/**
 * Cloudflare Worker: Private Content Access Gateway
 * 
 * This worker receives a Firebase ID token from the client, verifies it,
 * checks the user's whitelist in Firestore, and returns their allowed content.
 * 
 * Setup:
 * 1. Create environment variables in Cloudflare Worker settings:
 *    - FIREBASE_PROJECT_ID: Your Firebase project ID
 *    - FIRESTORE_API_KEY: Your Firebase Web API key (for Firestore REST API)
 * 2. Deploy with: wrangler deploy
 * 
 * No npm dependencies required - uses Firebase REST APIs directly.
 */

/**
 * Verify Firebase ID token using Google's public keys
 */

// Helper: base64url decode
function base64urlToUint8Array(base64url) {
  // Pad base64 string
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) bytes[i] = str.charCodeAt(i);
  return bytes;
}

// Helper: import RSA public key from JWKS n/e
async function importRsaPublicKey(n, e) {
  // Import the RSA public key directly from JWK (n, e)
  const jwk = {
    kty: 'RSA',
    n: n,
    e: e,
    alg: 'RS256',
    ext: true
  };
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

async function verifyFirebaseToken(idToken, projectId) {
  try {
    // Decode the token header to get the key ID
    const [jwtHeaderB64, jwtPayloadB64, jwtSignatureB64] = idToken.split('.');
    const header = JSON.parse(atob(jwtHeaderB64.replace(/-/g, '+').replace(/_/g, '/')));
    console.log('verifyFirebaseToken: header.kid=', header.kid, 'alg=', header.alg);


    // Fetch Google's JWKS public keys
    const jwksUrl = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
    console.log('verifyFirebaseToken: fetching JWKS from', jwksUrl);
    const jwksResponse = await fetch(jwksUrl);
    const jwks = await jwksResponse.json();
    console.log('verifyFirebaseToken: jwks.keys.length=', Array.isArray(jwks.keys) ? jwks.keys.length : 0);
    const jwk = jwks.keys.find(k => k.kid === header.kid);
    if (!jwk) {
      console.error('verifyFirebaseToken: public key not found for kid', header.kid);
      throw new Error('Public key not found in JWKS');
    }
    console.log('verifyFirebaseToken: found jwk:', { kid: jwk.kid, kty: jwk.kty, alg: jwk.alg });
    // Import the public key from n/e
    const cryptoKey = await importRsaPublicKey(jwk.n, jwk.e);


    // Correct JWT signature verification: signature is over header.payload (base64url), signature is base64url decoded
    const signature = base64urlToUint8Array(jwtSignatureB64);
    const data = new TextEncoder().encode(`${jwtHeaderB64}.${jwtPayloadB64}`);

    const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);

    if (!isValid) {
      console.error('verifyFirebaseToken: signature verification failed');
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(atob(jwtPayloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    console.log('verifyFirebaseToken: token payload sample:', {
      sub: payload.sub, uid: payload.user_id || payload.uid, email: payload.email, aud: payload.aud, iss: payload.iss, exp: payload.exp
    });
    // Verify claims
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }
    if (payload.aud !== projectId) {
      throw new Error('Invalid audience');
    }
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      throw new Error('Invalid issuer');
    }

    return payload;
  } catch (err) {
    console.error('Token verification error:', err);
    throw new Error('Token verification failed');
  }
}


/**
 * Fetch user's whitelist document from Firestore using REST API
 */
async function getUserWhitelist(projectId, apiKey, email, uid, env) {
  const kv = env && env.WHITELIST_KV;

  // Primary: lookup by email document ID (assume lowercase docId)
  if (email) {
    const emailId = email.toLowerCase();
    try {
      // Check KV cache keyed by emailId first
      if (kv) {
        try {
          const cached = await kv.get(emailId);
          if (cached) {
            console.log('getUserWhitelist: cache hit for emailId', emailId);
            return JSON.parse(cached);
          }
        } catch (e) {
          console.warn('getUserWhitelist: KV get error for emailId', e);
        }
      }

      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist/${encodeURIComponent(emailId)}?key=${apiKey}`;
      console.log('getUserWhitelist: fetching by email docId', url);
      const response = await fetch(url);
      console.log('getUserWhitelist: response.status=', response.status);

      if (response.ok) {
        const data = await response.json();
        const allowed = data.fields?.allowed?.booleanValue || false;
        // New: read accessBooks, accessArticles, accessVideos arrays
        const accessBooks = data.fields?.accessBooks?.arrayValue?.values?.map(v => v.stringValue) || [];
        const accessArticles = data.fields?.accessArticles?.arrayValue?.values?.map(v => v.stringValue) || [];
        const accessVideos = data.fields?.accessVideos?.arrayValue?.values?.map(v => v.stringValue) || [];
        const result = { allowed, accessBooks, accessArticles, accessVideos, raw: data };
        // Cache result keyed by emailId and optionally uid
        if (kv) {
          try { await kv.put(emailId, JSON.stringify(result), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
          if (uid) {
            try { await kv.put(uid, JSON.stringify(result), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
          }
        }
        return result;
      } else {
        const txt = await response.text();
        console.log('getUserWhitelist: email docId lookup non-ok', response.status, txt);
      }
    } catch (err) {
      console.error(`Error fetching whitelist for email doc ${emailId}:`, err);
    }
  }

  // Secondary: try lookup by UID (docId = uid)
  if (uid) {
    try {
      const uidUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist/${encodeURIComponent(uid)}?key=${apiKey}`;
      console.log('getUserWhitelist: fetching by uid', uidUrl);
      const uidResp = await fetch(uidUrl);
      if (uidResp.ok) {
        const data = await uidResp.json();
        const allowed = data.fields?.allowed?.booleanValue || false;
        const accessBooks = data.fields?.accessBooks?.arrayValue?.values?.map(v => v.stringValue) || [];
        const accessArticles = data.fields?.accessArticles?.arrayValue?.values?.map(v => v.stringValue) || [];
        const accessVideos = data.fields?.accessVideos?.arrayValue?.values?.map(v => v.stringValue) || [];
        // If older `access` field exists, preserve it in raw but also (optionally) map into books
        const accessFallback = data.fields?.access?.arrayValue?.values?.map(v => v.stringValue) || [];
        const result = { allowed, accessBooks, accessArticles, accessVideos, raw: data, accessFallback };
        // Cache under uid and emailId if available
        if (kv) {
          try { await kv.put(uid, JSON.stringify(result), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
          if (email) {
            try { await kv.put(email.toLowerCase(), JSON.stringify(result), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
          }
        }
        return result;
      } else {
        const txt = await uidResp.text();
        console.log('getUserWhitelist: uid lookup non-ok', uidResp.status, txt);
      }
    } catch (err) {
      console.error('getUserWhitelist: error during uid lookup', err);
    }
  }

  // Final fallback: structuredQuery by email field (handles cases where email is stored as a field)
  if (email) {
    const q = await queryWhitelistByEmail(projectId, apiKey, email);
    if (q) {
      // cache under emailId and uid if available
      if (kv) {
        try { await kv.put(email.toLowerCase(), JSON.stringify(q), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
        if (uid) {
          try { await kv.put(uid, JSON.stringify(q), { expirationTtl: 300 }); } catch (e) { console.warn('KV put error', e); }
        }
      }
      return q;
    }
  }

  return null;
}
/**
 * If no doc found by id, try querying the collection for a document whose `email` field matches.
 */
async function queryWhitelistByEmail(projectId, apiKey, email) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
    console.log('queryWhitelistByEmail: running structuredQuery for', email);
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'whitelist' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: email.toLowerCase() }
          }
        },
        limit: 1
      }
    };
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    console.log('queryWhitelistByEmail: response length=', Array.isArray(data) ? data.length : 0);
    if (Array.isArray(data) && data.length > 0) {
      for (const item of data) {
        if (item.document) {
          const doc = item.document;
          const allowed = doc.fields?.allowed?.booleanValue || false;
          const accessBooks = doc.fields?.accessBooks?.arrayValue?.values?.map(v => v.stringValue) || [];
          const accessArticles = doc.fields?.accessArticles?.arrayValue?.values?.map(v => v.stringValue) || [];
          const accessVideos = doc.fields?.accessVideos?.arrayValue?.values?.map(v => v.stringValue) || [];
          const accessFallback = doc.fields?.access?.arrayValue?.values?.map(v => v.stringValue) || [];
          console.log('queryWhitelistByEmail: found docId=', doc.name, 'allowed=', allowed);
          return { allowed, accessBooks, accessArticles, accessVideos, raw: doc, accessFallback };
        }
      }
    }
  } catch (err) {
    console.error('queryWhitelistByEmail error:', err);
  }
  return null;
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { idToken } = await request.json();

      if (!idToken) {
        return new Response(JSON.stringify({ error: 'Missing idToken' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get environment variables
      const projectId = env.FIREBASE_PROJECT_ID;
      const apiKey = env.FIRESTORE_API_KEY;

      if (!projectId || !apiKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify Firebase ID token
      const decodedToken = await verifyFirebaseToken(idToken, projectId);
      const email = decodedToken.email;
      const uid = decodedToken.uid;

      if (!email) {
        return new Response(JSON.stringify({ error: 'Email not in token' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Debug mode always off
      const debugMode = false;

      // Get user's whitelist doc
      const whitelist = await getUserWhitelist(projectId, apiKey, email, uid);

      if (!whitelist || !whitelist.allowed) {
        const body = {
          allowed: false,
          content: {
            books: [],
            articles: [],
            videos: []
          },
          user: { email, uid },
        };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build allowed content directly from Firestore arrays
      const accessBooks = whitelist.accessBooks || [];
      const accessArticles = whitelist.accessArticles || [];
      const accessVideos = whitelist.accessVideos || [];

      // Each entry is just the file ID/name; client can construct links as needed
      const allowedContent = {
        books: accessBooks,
        articles: accessArticles,
        videos: accessVideos
      };

      const successBody = {
        allowed: true,
        content: allowedContent,
        user: { email, uid,
          accessBooksCount: accessBooks.length,
          accessArticlesCount: accessArticles.length,
          accessVideosCount: accessVideos.length },
      };
      return new Response(JSON.stringify(successBody), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Unauthorized or server error', details: err.message }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
