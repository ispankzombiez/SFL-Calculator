# Firebase Security Rules Setup

## Issue
Your Firestore database is currently blocking writes to the `apiData` collection because the security rules haven't been configured to allow it.

## Solution
Add the following rules to your Firestore security rules:

### Complete Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data and credentials
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Calculator results subcollection
      match /results/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Raw API data subcollection (NEW - THIS IS WHAT'S MISSING)
      match /apiData/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## How to Update Firebase Security Rules

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `sfl-calculator`
3. **Navigate to Firestore Database**:
   - Click "Firestore Database" in the left sidebar
4. **Open the Rules tab**:
   - Click the "Rules" tab at the top
5. **Edit the rules**:
   - Replace your current rules with the complete rules above
   - Make sure the `apiData` section is included
6. **Publish**:
   - Click the "Publish" button to save the changes

## What These Rules Do

- **users/{userId}**: Users can read/write their own user document
- **users/{userId}/results/{document}**: Users can read/write their calculator results
- **users/{userId}/apiData/{document}**: Users can read/write their raw API data (prices & farm data)

All rules require authentication (`request.auth != null`) and ensure users can only access their own data (`request.auth.uid == userId`).

## Testing

After updating the rules:
1. Refresh your calculator page
2. Sign in with your Google account
3. Connect to your farm
4. Check the console - you should see: `✅ Raw API data successfully saved to Firestore`
5. No more permission errors!
