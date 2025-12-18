/**
 * Cloudflare Worker: Private Content Access Gateway (Strict Email Lookup)
 * Version: 1.0.2 - Fixed Caching & Strict ID Lookup
 */

const WORKER_VERSION = "1.0.2";

async function importRsaPublicKey(n, e) {
  const jwk = { kty: 'RSA', n, e, alg: 'RS256', ext: true };
  return await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['verify']
  );
}

function base64urlToUint8Array(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function verifyFirebaseToken(idToken, projectId) {
  const [jwtHeaderB64, jwtPayloadB64, jwtSignatureB64] = idToken.split('.');
  const header = JSON.parse(atob(jwtHeaderB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  // Fetch JWKS with cache busting to ensure we have latest keys
  const jwksResponse = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com', {
    cf: { cacheTtl: 86400 } 
  });
  const jwks = await jwksResponse.json();
  const jwk = jwks.keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('Public key not found');

  const cryptoKey = await importRsaPublicKey(jwk.n, jwk.e);
  const signature = base64urlToUint8Array(jwtSignatureB64);
  const data = new TextEncoder().encode(`${jwtHeaderB64}.${jwtPayloadB64}`);
  const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);

  if (!isValid) throw new Error('Invalid signature');

  const payload = JSON.parse(atob(jwtPayloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now || payload.aud !== projectId) throw new Error('Token invalid or expired');

  return payload;
}

/**
 * STRICT LOOKUP: Only check Firestore for a document matching the Email ID
 */
async function getUserWhitelist(projectId, apiKey, email) {
  const emailId = email.toLowerCase();
  // Added timestamp AND strict cache-control headers for the subrequest
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist/${encodeURIComponent(emailId)}?key=${apiKey}&t=${Date.now()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    cf: {
      cacheTtl: 0,
      cacheEverything: false
    }
  });

  if (!response.ok) return null;

  const data = await response.json();
  return {
    allowed: data.fields?.allowed?.booleanValue || false,
    accessBooks: data.fields?.accessBooks?.arrayValue?.values?.map(v => v.stringValue) || [],
    accessArticles: data.fields?.accessArticles?.arrayValue?.values?.map(v => v.stringValue) || [],
    accessVideos: data.fields?.accessVideos?.arrayValue?.values?.map(v => v.stringValue) || []
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate', // Block browser cache
      'X-Worker-Version': WORKER_VERSION
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
      const { idToken, fileUrl } = await request.json();
      const decodedToken = await verifyFirebaseToken(idToken, env.FIREBASE_PROJECT_ID);
      const email = decodedToken.email;

      if (!email) throw new Error('No email in token');

      const whitelist = await getUserWhitelist(env.FIREBASE_PROJECT_ID, env.FIRESTORE_API_KEY, email);

      // Handle File Proxy Request if fileUrl is present
      if (fileUrl) {
        if (!whitelist || !whitelist.allowed) return new Response('Forbidden', { status: 403 });
        
        const allUrls = [...whitelist.accessBooks, ...whitelist.accessArticles, ...whitelist.accessVideos];
        if (!allUrls.includes(fileUrl)) return new Response('Link Not Whitelisted', { status: 403 });

        const fileResp = await fetch(fileUrl, { cf: { cacheTtl: 0 } });
        return new Response(fileResp.body, { 
          status: fileResp.status, 
          headers: { ...corsHeaders, 'Content-Type': fileResp.headers.get('Content-Type') } 
        });
      }

      // Default: Return the whitelist JSON
      const body = {
        allowed: whitelist?.allowed || false,
        content: {
          books: whitelist?.accessBooks || [],
          articles: whitelist?.accessArticles || [],
          videos: whitelist?.accessVideos || []
        },
        version: WORKER_VERSION
      };

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 403, headers: corsHeaders });
    }
  }
};