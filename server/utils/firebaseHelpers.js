const { db, auth } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Firebase Firestore Helper Functions
 */

// Create or update a user in Firestore
const createUser = async (uid, userData) => {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true, uid };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

// Get user by UID
const getUser = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: userDoc.data() };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

// Update user
const updateUser = async (uid, updates) => {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    await db.collection('users').doc(uid).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

// Create a challenge
const createChallenge = async (challengeData) => {
  try {
    const challengeRef = db.collection('challenges').doc();
    await challengeRef.set({
      ...challengeData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: challengeRef.id };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error: error.message };
  }
};

// Get all challenges
const getChallenges = async (category = null) => {
  try {
    let query = db.collection('challenges');
    if (category) {
      query = query.where('category', '==', category);
    }
    const snapshot = await query.get();
    const challenges = [];
    snapshot.forEach(doc => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: challenges };
  } catch (error) {
    console.error('Error getting challenges:', error);
    return { success: false, error: error.message };
  }
};

// Verify Firebase ID Token
const verifyToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { success: true, uid: decodedToken.uid, decodedToken };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { success: false, error: error.message };
  }
};

// Create custom token for authentication
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return { success: true, token: customToken };
  } catch (error) {
    console.error('Error creating custom token:', error);
    return { success: false, error: error.message };
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return { success: true, user: userRecord };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return { success: false, error: error.message };
  }
};

// Add XP to user
const addUserXP = async (uid, xpToAdd) => {
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      xp: admin.firestore.FieldValue.increment(xpToAdd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding XP:', error);
    return { success: false, error: error.message };
  }
};

// Update leaderboard
const updateLeaderboard = async (uid, username, xp, level) => {
  try {
    const leaderboardRef = db.collection('leaderboard').doc(uid);
    await leaderboardRef.set({
      uid,
      username,
      xp,
      level,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard
const getLeaderboard = async (limit = 10) => {
  try {
    const snapshot = await db.collection('leaderboard')
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();
    
    const leaderboard = [];
    snapshot.forEach(doc => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  createChallenge,
  getChallenges,
  verifyToken,
  createCustomToken,
  getUserByEmail,
  addUserXP,
  updateLeaderboard,
  getLeaderboard
};
