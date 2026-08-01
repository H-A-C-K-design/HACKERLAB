const admin = require('firebase-admin');
require('dotenv').config();

// Check if Firebase credentials are configured
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
                          process.env.FIREBASE_PRIVATE_KEY && 
                          !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_KEY_HERE');

let db, auth, firebaseApp;

if (hasFirebaseConfig) {
  try {
    // Firebase Admin SDK initialization
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || process.env.FIREBASE_PROJECT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
    };

    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
      console.log('✅ Firebase Admin Initialized Successfully');
    } else {
      firebaseApp = admin.app();
    }

    // Initialize Firestore
    db = admin.firestore();
    
    // Initialize Firebase Auth
    auth = admin.auth();

  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('Make sure all Firebase credentials are properly set in .env file');
  }
} else {
  console.warn('⚠️  Firebase credentials not fully configured. Some features will be unavailable.');
  console.warn('Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env');
}

module.exports = {
  admin,
  db,
  auth,
  firebaseApp,
  hasFirebaseConfig
};
