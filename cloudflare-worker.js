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
async function verifyFirebaseToken(idToken, projectId) {
  try {
    // Decode the token header to get the key ID
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Fetch Google's public keys
    const keysResponse = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    const keys = await keysResponse.json();
    
    // Get the public key for this token
    const publicKey = keys[header.kid];
    if (!publicKey) {
      throw new Error('Public key not found');
    }

    // Import the public key
    const pemKey = publicKey.replace(/\\n/g, '\n');
    const keyData = pemKey.match(/-----BEGIN CERTIFICATE-----\n([\s\S]+?)\n-----END CERTIFICATE-----/)[1];
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify the signature
    const [headerPayloadB64, signatureB64] = idToken.split('.').slice(0, 2);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const data = new TextEncoder().encode(`${headerB64}.${headerPayloadB64}`);
    
    const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payloadB64 = idToken.split('.')[1];
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
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
 * Sample content catalog (can also come from Firestore or a static JSON)
 * Each item has: id, title, description, type, link
 */
const CONTENT_CATALOG = [
  {
    id: 'article-1',
    title: 'Homeopathy Basics',
    description: 'An introduction to homeopathic principles',
    type: 'Article',
    link: '/private/articles/homeopathy-basics.pdf',
  },
  {
    id: 'article-2',
    title: 'Women\'s Health Guide',
    description: 'Comprehensive guide to homeopathic remedies for women\'s health',
    type: 'Article',
    link: '/private/articles/womens-health.pdf',
  },
  {
    id: 'video-1',
    title: 'Tissue Salts Workshop',
    description: 'Video workshop on biochemic tissue salts',
    type: 'Video',
    link: 'https://youtube.com/watch?v=...',
  },
  {
    id: 'book-1',
    title: 'The Complete Homeopathy Book',
    description: 'Detailed reference book',
    type: 'Book',
    link: '/private/books/complete-homeopathy.pdf',
  },
];

/**
 * Fetch user's whitelist document from Firestore using REST API
 */
async function getUserWhitelist(projectId, apiKey, email, uid) {
  const docIds = [email.toLowerCase(), uid];

  for (const docId of docIds) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/whitelist/${encodeURIComponent(docId)}?key=${apiKey}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Parse Firestore document format
        const allowed = data.fields?.allowed?.booleanValue || false;
        const access = data.fields?.access?.arrayValue?.values?.map(v => v.stringValue) || [];
        
        return { allowed, access };
      }
    } catch (err) {
      console.error(`Error fetching whitelist for ${docId}:`, err);
    }
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

      // Get user's whitelist doc
      const whitelist = await getUserWhitelist(projectId, apiKey, email, uid);

      if (!whitelist || !whitelist.allowed) {
        return new Response(
          JSON.stringify({
            allowed: false,
            content: [],
            user: { email, uid },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Filter content based on user's access array
      const userAccess = whitelist.access || [];
      const allowedContent = CONTENT_CATALOG.filter((item) =>
        userAccess.includes(item.id)
      );

      return new Response(
        JSON.stringify({
          allowed: true,
          content: allowedContent,
          user: { email, uid, accessCount: userAccess.length },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
