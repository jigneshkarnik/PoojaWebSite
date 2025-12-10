/**
 * FIRESTORE WHITELIST SETUP GUIDE
 * 
 * This file documents the structure and examples for Firestore whitelist documents.
 * 
 * Collection: whitelist
 * Document ID: User's email (lowercase) or Firebase UID
 * 
 * Fields:
 *   - allowed (boolean): Whether this user has any access at all
 *   - access (array): List of content IDs the user can access
 */

// ============================================
// EXAMPLE DOCUMENTS TO CREATE IN FIRESTORE
// ============================================

/**
 * Document 1: Full Access User
 * 
 * Collection: whitelist
 * Document ID: pooja@example.com
 */
{
  "allowed": true,
  "access": [
    "article-1",
    "article-2",
    "video-1",
    "book-1"
  ],
  "createdAt": "2025-01-01T10:00:00Z",
  "name": "Pooja Karnik"
}

// ============================================

/**
 * Document 2: Limited Access User
 * 
 * Collection: whitelist
 * Document ID: student@example.com
 */
{
  "allowed": true,
  "access": [
    "article-1",
    "video-1"
  ],
  "createdAt": "2025-01-01T11:00:00Z",
  "name": "Student Name"
}

// ============================================

/**
 * Document 3: Denied User (for auditing)
 * 
 * Collection: whitelist
 * Document ID: denied@example.com
 */
{
  "allowed": false,
  "access": [],
  "createdAt": "2025-01-01T12:00:00Z",
  "reason": "Request rejected"
}

// ============================================
// CONTENT ID REFERENCE
// ============================================
// 
// article-1       → Homeopathy Basics
// article-2       → Women's Health Guide
// video-1         → Tissue Salts Workshop
// book-1          → The Complete Homeopathy Book
// 
// Add or modify these IDs in the Cloudflare Worker's CONTENT_CATALOG
// to match your actual content resources.
//
// ============================================
// HOW TO CREATE IN FIREBASE CONSOLE
// ============================================
//
// 1. Open Firebase Console
// 2. Navigate to Firestore Database
// 3. Click "+ Add collection" → Name: "whitelist"
// 4. Click "+ Add document" → Document ID: user's email (lowercase) or UID
// 5. Add fields:
//    - allowed: boolean → true
//    - access: array → ["article-1", "article-2", ...]
// 6. Click Save
//
// ============================================
// FIRESTORE SECURITY RULES (Recommended)
// ============================================
//
// This denies direct browser access to the whitelist collection,
// forcing all reads through your Cloudflare Worker (which verifies tokens server-side).
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /whitelist/{document=**} {
//       allow read: if false;   // Deny browser reads (worker has own access)
//       allow write: if false;  // Deny all writes from browser
//     }
//   }
// }
//
// ============================================
