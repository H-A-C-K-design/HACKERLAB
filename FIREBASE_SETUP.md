# Firebase Setup Guide for CyberForge Academy

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `cyberforge-academy` (or your preferred name)
4. Enable/disable Google Analytics (your choice)
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password** (enable)
   - **Google** (optional, for social login)
3. Click **Save**

## Step 3: Enable Firestore Database

1. Go to **Firestore Database** in the left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your preferred region
5. Click **"Done"**

## Step 4: Get Service Account Credentials

1. Click the gear icon ⚙️ → **Project Settings**
2. Go to **Service accounts** tab
3. Click **"Generate new private key"**
4. A JSON file will download automatically
5. **IMPORTANT**: Keep this file secure and never commit it to Git!

## Step 5: Update Your .env File

Open the downloaded JSON file and copy the values to your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id-from-json
FIREBASE_PRIVATE_KEY_ID=private_key_id-from-json
FIREBASE_CLIENT_EMAIL=client_email-from-json
FIREBASE_CLIENT_ID=client_id-from-json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
```

**Example:**

If your JSON file contains:
```json
{
  "project_id": "cyberforge-academy",
  "private_key_id": "abc123xyz",
  "client_email": "firebase-adminsdk-abc123@cyberforge-academy.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
}
```

Your `.env` should be:
```env
FIREBASE_PROJECT_ID=cyberforge-academy
FIREBASE_PRIVATE_KEY_ID=abc123xyz
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@cyberforge-academy.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"
```

## Step 6: Test the Connection

Run your server:
```bash
npm run dev
```

You should see:
```
✅ Firebase Admin Initialized
✅ MongoDB Connected
🚀 CyberForge Server running on port 5000
```

## Step 7: Configure Firestore Security Rules (Optional but Recommended)

Go to **Firestore Database** → **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow read for all, write for admins only
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Leaderboard is readable by all
    match /leaderboard/{entryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Firebase Helper Functions Available

The following helper functions are now available in `server/utils/firebaseHelpers.js`:

### User Management
- `createUser(uid, userData)` - Create or update a user
- `getUser(uid)` - Get user by UID
- `updateUser(uid, updates)` - Update user data
- `deleteUser(uid)` - Delete a user
- `getUserByEmail(email)` - Get user by email

### Authentication
- `verifyToken(idToken)` - Verify Firebase ID token
- `createCustomToken(uid, claims)` - Create custom auth token

### Challenges
- `createChallenge(challengeData)` - Create a new challenge
- `getChallenges(category)` - Get all challenges (optional filter by category)

### Gamification
- `addUserXP(uid, xpAmount)` - Add XP to a user
- `updateLeaderboard(uid, username, xp, level)` - Update leaderboard
- `getLeaderboard(limit)` - Get top players

## Usage Examples

### In a Route File

```javascript
const { createUser, getUser, verifyToken } = require('../utils/firebaseHelpers');

// Create a new user after Firebase Auth signup
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  
  // Create user in Firebase Auth
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: username
  });
  
  // Store additional user data in Firestore
  await createUser(userRecord.uid, {
    username,
    email,
    xp: 0,
    level: 1,
    rank: 'Script Kiddie'
  });
  
  res.json({ success: true, uid: userRecord.uid });
});

// Protected route using Firebase token
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  const { success, uid } = await verifyToken(token);
  
  if (!success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await getUser(uid);
  res.json(user);
});
```

## Firestore Data Structure

### Users Collection
```
users/{uid}
├── username: string
├── email: string
├── xp: number
├── level: number
├── rank: string
├── badges: array
├── completedChallenges: array
├── streak: number
└── createdAt: timestamp
```

### Challenges Collection
```
challenges/{challengeId}
├── title: string
├── description: string
├── category: string
├── difficulty: string
├── points: number
└── createdAt: timestamp
```

### Leaderboard Collection
```
leaderboard/{uid}
├── username: string
├── xp: number
├── level: number
└── updatedAt: timestamp
```

## Client-Side Firebase Setup (for frontend)

Install Firebase in your client:

```bash
cd client
npm install firebase
```

Create `client/src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Get these config values from:
Firebase Console → Project Settings → General → Your apps → Web app

## Troubleshooting

### "Firebase initialization error"
- Check all environment variables are set correctly
- Ensure `FIREBASE_PRIVATE_KEY` has `\n` for newlines, not actual line breaks
- Verify the service account has the correct permissions

### "Permission denied"
- Check Firestore security rules
- Ensure user is authenticated
- Verify the UID matches the authenticated user

### "Invalid JWT"
- Token might be expired
- User might need to re-authenticate
- Check token format in Authorization header

## Next Steps

1. Set up Firebase in your client-side code
2. Implement Firebase Authentication on frontend
3. Migrate routes to use Firebase instead of MongoDB (optional)
4. Set up Firestore security rules
5. Add Firebase Realtime Database or Firestore listeners for real-time features
