# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "SFL Calculator")
4. Follow the setup wizard

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left menu
2. Click "Get started"
3. Enable sign-in methods:
   - **Google**: Click "Google" → Enable → Save
   - **Email/Password**: Click "Email/Password" → Enable → Save
   - **Anonymous** (optional): Click "Anonymous" → Enable → Save

## 3. Set Up Firestore Database

1. In your Firebase project, go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (we'll set up rules next)
4. Choose a location close to your users
5. Click "Enable"

## 4. Configure Firestore Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can access their own sub-collections
      match /results/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click "Publish"

## 5. Get Your Firebase Config

1. In Firebase Console, click the gear icon ⚙️ → **Project settings**
2. Scroll down to "Your apps"
3. Click the **Web** button `</>`
4. Register your app with a nickname (e.g., "SFL Calculator Web")
5. Copy the `firebaseConfig` object

## 6. Add Config to Your Project

1. In your project, copy `js/firebase-config-template.js` to `js/firebase-config.js`
   ```powershell
   Copy-Item js\firebase-config-template.js js\firebase-config.js
   ```

2. Open `js/firebase-config.js` and replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};

export default firebaseConfig;
```

3. Save the file

## 7. Configure GitHub Pages Domain (Optional)

If deploying to GitHub Pages, add your domain to Firebase authorized domains:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Click "Add domain"
3. Add: `YOUR_USERNAME.github.io`
4. Save

## 8. Test Locally

```powershell
# Navigate to project
cd C:\Users\caleb\Documents\GitHub\SFL-Calculator

# Start local server
python -m http.server 8000

# Open http://localhost:8000 in browser
# Try signing in with Google
```

## 9. Deploy

Once everything works locally:

```powershell
git add js/firebase-config.js  # Only if you want to (NOT recommended for public repos)
git commit -m "Add Firebase authentication"
git push
```

**⚠️ IMPORTANT:** The `.gitignore` is configured to exclude `firebase-config.js` by default. This prevents your Firebase credentials from being committed to GitHub. If you want to deploy to GitHub Pages:

**Option A: Public repo with environment variables (recommended)**
- Don't commit `firebase-config.js`
- Use GitHub Actions to inject config at build time

**Option B: Private repo**
- You can commit `firebase-config.js` if the repo is private
- Still not ideal for security

**Option C: Server-side proxy**
- Set up a backend service to handle Firebase auth
- Frontend never exposes Firebase credentials

## Firestore Data Structure

The app stores data in this structure:

```
users/
  {userId}/
    farmId: string
    apiKey: string (encrypted)
    lastUpdated: timestamp
    
    results/
      cows/
        data: object
        timestamp: timestamp
      sheep/
        data: object
        timestamp: timestamp
      ... (other calculators)
```

## Security Notes

- **Firebase API keys are public** - They're meant to be in client-side code
- **Security comes from Firestore Rules** - The rules ensure users can only access their own data
- **API keys should still be protected** - Use Firestore rules to restrict what authenticated users can do

## Troubleshooting

**"Firebase not initialized"**
- Check that `firebase-config.js` exists and has correct values
- Check browser console for Firebase errors
- Verify Firebase SDK scripts are loading in `index.html`

**"Permission denied" errors in Firestore**
- Check that Firestore rules are set correctly
- Verify user is signed in
- Check that userId matches in rules

**Authentication popup blocked**
- Browser may be blocking popup windows
- Try allowing popups for your site
- Or use redirect-based auth instead of popup

**CORS errors**
- Add your domain to Firebase authorized domains
- Check that domain is correctly formatted
