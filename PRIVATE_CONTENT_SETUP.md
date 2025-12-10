# Private Content Access with Cloudflare Workers + Firebase

Complete guide to set up secure gated content for authenticated users.

## Architecture

```
Client (private.html)
  ↓ Signs in via Firebase Auth (Google/Apple/Facebook)
  ↓ Gets ID token
  ↓ Calls Cloudflare Worker with ID token
  
Cloudflare Worker
  ↓ Verifies ID token via Firebase Admin SDK
  ↓ Fetches user's whitelist from Firestore
  ↓ Returns filtered content based on user's allowed access list
  ↓ Returns JSON with content items or 403 if not allowed

Client
  ↓ Renders content grid with links/resources
```

## Setup Steps

### 1. Firebase Project Setup

#### A. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click "Add project"
- Enable Authentication and Firestore

#### B. Set Up Authentication Providers
- In Firebase Console → Authentication → Sign-in method
- Enable: Google, Facebook, Apple
- For each, add your redirect URIs (add both `http://localhost:8000` for testing and your GitHub Pages domain)

#### C. Create Service Account Key
- **Skip this step** - we're using the simpler REST API approach that only needs your Web API key (no service account needed)

#### D. Set Up Firestore Database
- Go to Firestore Database
- Create a new database (use your project's default location)
- Create a collection: `whitelist`
- Add documents with structure:

```json
// Document ID: user's email or UID (lowercase)
{
  "allowed": true,
  "access": ["article-1", "article-2", "video-1"]
}
```

Example documents:
```
/whitelist/user@example.com
  { "allowed": true, "access": ["article-1", "book-1"] }

/whitelist/another-user@example.com
  { "allowed": true, "access": ["article-1", "article-2", "video-1", "book-1"] }

/whitelist/denied-user@example.com
  { "allowed": false, "access": [] }
```

### 2. Cloudflare Worker Setup

#### A. Create a Cloudflare Account
- Go to [Cloudflare](https://dash.cloudflare.com/)
- Create an account (free tier is fine)

#### B. Create a Worker
- In Cloudflare Dashboard → Workers & Pages
- Click "Create Application" → "Create Worker"
- Name it (e.g., `private-content-worker`)

#### C. Copy Worker Code
- Click "Edit Code"
- Delete the default code
- Copy and paste the entire content from `cloudflare-worker.js` in this repo
- Click "Save and Deploy"

#### D. Set Environment Variables
- In the worker settings, go to "Settings" → "Variables"
- Add these environment variables:
  - `FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g., `my-project-12345`)
  - `FIRESTORE_API_KEY`: Your Firebase Web API key (from Firebase Console → Project Settings → Web API Key)

#### E. Get Your Worker URL
After deployment, you'll get a URL like: `https://private-content-worker.YOUR_ACCOUNT.workers.dev`

**Note:** No npm dependencies or wrangler CLI needed - you can create and deploy directly in the Cloudflare dashboard!

### 3. Update `private.html`

In the `private.html` file in your GitHub Pages repo:

```javascript
// Fill in your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

// Fill in your Cloudflare Worker URL
const WORKER_URL = 'https://YOUR_WORKER_NAME.YOUR_ACCOUNT.workers.dev/access';
```

Get these values from:
- **apiKey, authDomain, projectId**: Firebase Console → Project Settings → General → Your apps → Web config
- **WORKER_URL**: Cloudflare Worker URL from deployment

### 4. Add Link to Header (Optional)

In `header.html`, add a link to the private content page:
```html
<li><a href="./private.html" data-page="private">Private Content</a></li>
```

### 5. Test the Setup

1. Go to `https://yoursite.com/private.html` (or localhost)
2. Sign in with Google/Apple/Facebook
3. Check the browser console for any errors
4. The page should display your whitelisted content

## Security Best Practices

- **Never** expose environment variables in client-side code
- The Worker verifies Firebase ID tokens using Google's public keys (cryptographically secure)
- ID tokens are ephemeral and short-lived (1 hour); the worker verifies them server-side
- Firestore REST API calls use your API key, which is stored securely in Cloudflare (encrypted at rest)
- The Firestore API key is safe to use with proper security rules
- Use HTTPS only for production

## Sample Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read only their own whitelist doc
    match /whitelist/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.token.email.lower() == userId || 
                      request.auth.uid == userId);
      allow write: if false; // Only admins can write (via Firebase Console)
    }
  }
}
```

## Troubleshooting

### "Error loading content"
- Check browser console for network errors
- Verify `WORKER_URL` is correct
- Confirm ID token is being sent

### "Worker returns 403"
- Check that user's email is in Firestore whitelist with `allowed: true`
- Verify Firebase service account key in `wrangler.toml` is valid

### "Sign-in failed"
- Ensure Firebase auth domains include your GitHub Pages domain
- Check CORS settings in Firebase (usually auto-configured)

## Future Enhancements

- Dynamic content catalog: fetch from Firestore instead of hardcoded
- Admin dashboard to manage whitelist
- Rate limiting on worker
- Audit logs for content access
- Refresh token handling for long sessions
