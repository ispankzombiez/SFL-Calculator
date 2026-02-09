# Cloudflare Worker with Firebase Backend

## Overview

This enhanced Cloudflare Worker provides:
1. **CORS Proxy** for SFL API (existing functionality)
2. **Firebase Backend** - Keeps your Firebase credentials completely secure on the server

## Why This Approach?

### ❌ Problem with Client-Side Firebase:
- Firebase config visible in browser DevTools
- Anyone can see your API keys
- Potential for quota abuse

### ✅ Solution with Worker Backend:
- Firebase credentials stay server-side only
- Client never sees Firebase config
- True credential protection
- FREE on Cloudflare (100k requests/day)

---

## Setup Instructions

### Part 1: Get Firebase Credentials

#### Option A: Use Firebase REST API (Simpler, Web only)

1. **Get your Web API Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click gear icon ⚙️ → **Project Settings**
   - Scroll to "Web API Key"
   - Copy the value

2. **Get your Project ID**:
   - Same page, under "Project ID"
   - Copy the value

#### Option B: Use Firebase Admin SDK (More features, requires service account)

1. **Create Service Account**:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Downloads a JSON file

2. **Extract credentials from JSON**:
   ```json
   {
     "project_id": "your-project-id",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

### Part 2: Deploy to Cloudflare

#### 1. Create/Update Worker

1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on your existing worker (`sfl-proxy`) or create new one
4. Click **Quick Edit**
5. Copy the entire code from `firebase-worker.js` and paste it
6. Click **Save and Deploy**

#### 2. Add Environment Variables (CRITICAL!)

These keep your credentials secret and server-side only:

1. Click on your worker name
2. Go to **Settings** → **Variables**
3. Click **Add variable** for each:

**If using Option A (REST API - Simpler)**:
```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_API_KEY = AIzaSy... (your Web API Key)
```

**If using Option B (Admin SDK)**:
```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

4. Make sure to check **"Encrypt"** for each variable
5. Click **Deploy**

#### 3. Test Your Worker

Your worker URL: `https://sfl-proxy.caleb-bren1.workers.dev`

**Test CORS Proxy (existing functionality)**:
```
https://sfl-proxy.caleb-bren1.workers.dev?url=https://sfl.world/api/v1/prices
```
Should return price data.

**Test Firebase endpoint**:
```
https://sfl-proxy.caleb-bren1.workers.dev/firebase/auth/email
```
Should return `{"error":"Missing email or password"}` (that's good - it means the route works!)

### Part 3: Update Your Calculator

#### 1. Create new Firebase API client

Create `js/firebase-backend.js`:

```javascript
/**
 * Firebase Backend API Client
 * Calls Cloudflare Worker instead of using Firebase SDK directly
 */

const WORKER_URL = 'https://sfl-proxy.caleb-bren1.workers.dev'

export async function signInWithEmail(email, password) {
    const response = await fetch(`${WORKER_URL}/firebase/auth/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.user
}

export async function createAccount(email, password) {
    const response = await fetch(`${WORKER_URL}/firebase/auth/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.user
}

export async function saveUserData(userId, userData, idToken) {
    const response = await fetch(`${WORKER_URL}/firebase/user/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: userData, idToken })
    })
    
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data
}

export async function loadUserData(userId, idToken) {
    const response = await fetch(`${WORKER_URL}/firebase/user/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, idToken })
    })
    
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data.data
}

export async function signOut() {
    // Sign out is client-side only - clear localStorage
    localStorage.removeItem('firebase_user')
    localStorage.removeItem('firebase_idToken')
    return true
}
```

#### 2. Update firebase-auth.js

Replace direct Firebase SDK calls with backend API calls (see `js/firebase-backend.js`).

#### 3. Remove firebase-config.js

You no longer need client-side Firebase config! Delete:
- `js/firebase-config.js`
- `js/firebase-config.template.js`

All Firebase credentials are now safely on the Cloudflare Worker.

---

## Architecture Diagram

```
┌─────────────────┐
│   Browser       │
│   (Client)      │
│                 │
│ - No Firebase   │
│   credentials   │
│ - Calls worker  │
│   API           │
└────────┬────────┘
         │
         │ HTTPS Requests
         │
         ▼
┌─────────────────────────────┐
│  Cloudflare Worker          │
│  (Server-side)              │
│                             │
│  Environment Variables:     │
│  - FIREBASE_PROJECT_ID     │
│  - FIREBASE_API_KEY        │
│  - (encrypted, secure)     │
│                             │
│  Handles:                   │
│  - CORS Proxy              │
│  - Firebase Auth           │
│  - Firestore Operations    │
└────────┬────────────────────┘
         │
         │ Authenticated Requests
         │
         ▼
┌─────────────────┐
│   Firebase      │
│   (Google)      │
│                 │
│ - Auth          │
│ - Firestore     │
└─────────────────┘
```

---

## Security Benefits

✅ **Firebase credentials never leave the server**
✅ **Client code is clean - no sensitive info**
✅ **Can't extract credentials from browser DevTools**
✅ **Easy to rotate credentials** (just update worker env vars)
✅ **Rate limiting possible** (add to worker if needed)
✅ **Free with Cloudflare Workers** (100k requests/day)

---

## Cost Analysis

| Service | Free Tier | Your Usage | Status |
|---------|-----------|------------|--------|
| **Cloudflare Workers** | 100,000 req/day | ~50 req/day | ✅ FREE |
| **Firebase Auth** | Unlimited | N/A | ✅ FREE |
| **Firestore** | 50k reads, 20k writes/day | ~10-100/day | ✅ FREE |

**Total Cost**: $0/month 🎉

---

## Troubleshooting

### Worker returns "Missing FIREBASE_PROJECT_ID"
- You forgot to add environment variables
- Go to: Worker Settings → Variables
- Add all required variables
- Click "Deploy"

### "Unauthorized" errors
- ID token expired (tokens expire after 1 hour)
- User needs to sign in again
- Implement token refresh logic

### CORS errors
- Worker code didn't deploy properly
- Check that all routes return proper CORS headers
- Test with browser Network tab

### Firestore permission denied
- Check Firebase Security Rules
- Make sure rules allow authenticated users to access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Next Steps

1. ✅ Deploy worker with Firebase code
2. ✅ Add environment variables
3. ✅ Test endpoints
4. ⬜ Create `js/firebase-backend.js` client
5. ⬜ Update `firebase-auth.js` to use backend
6. ⬜ Remove client-side Firebase config files
7. ⬜ Test authentication flow
8. ⬜ Test data save/load
9. ⬜ Deploy to GitHub Pages
10. ⬜ Verify credentials not visible in browser

---

## Alternative: Keep Google Sign-In Client-Side

Firebase Google Sign-In works better client-side (better UX with popup).

**Hybrid approach**:
- Keep Google Sign-In using Firebase SDK client-side
- Move Firestore operations to worker
- Still secure - only non-sensitive Firebase Web API key exposed

See `firebase-worker-hybrid.js` for this approach.
