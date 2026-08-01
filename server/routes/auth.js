const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const https = require('https');
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');
const admin = require('firebase-admin');
const adminAuth = admin.auth();
const adminFirestore = admin.firestore;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── reCAPTCHA v3 verification helper ──────────────────────
async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !token) return true; // skip if not configured (dev mode)
  return new Promise((resolve) => {
    const params = `secret=${secret}&response=${token}`;
    const req = https.request({
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': params.length }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          // score >= 0.5 means likely human (0.0=bot, 1.0=human)
          resolve(result.success && result.score >= 0.5);
        } catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(true)); // fail open in network errors
    req.write(params);
    req.end();
  });
}

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, recaptchaToken } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });

    // Check if email or username already exists
    const emailSnap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (!emailSnap.empty) return res.status(400).json({ success: false, message: 'Email already in use' });

    const userSnap = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!userSnap.empty) return res.status(400).json({ success: false, message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRef = db.collection('users').doc();
    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: 'hacker1',
      role: 'student',
      level: 1,
      xp: 0,
      rank: 'Script Kiddie',
      badges: [],
      completedChallenges: [],
      completedLabs: [],
      completedTasks: [],
      streak: 0,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      bio: '',
      skills: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData);
    const token = generateToken(userRef.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: userRef.id, username, email: email.toLowerCase(), level: 1, xp: 0, rank: 'Script Kiddie', role: 'student' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });

    const snap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const userDoc = snap.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await userDoc.ref.update({ lastActive: admin.firestore.FieldValue.serverTimestamp() });
    const token = generateToken(userDoc.id);

    res.json({
      success: true,
      token,
      user: {
        id: userDoc.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        role: user.role,
        avatar: user.avatar,
        badges: user.badges,
        streak: user.streak
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = { id: userDoc.id, ...userDoc.data() };
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/google — Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, username, photoURL } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'ID token required' });

    // Verify Google token with Firebase Admin
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Check if user already exists in Firestore
    let userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Create new user from Google account
      const cleanUsername = username || 'user_' + uid.slice(0, 8);
      // Check username uniqueness
      const uSnap = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();
      const finalUsername = uSnap.empty ? cleanUsername : cleanUsername + '_' + Date.now().toString().slice(-4);

      await db.collection('users').doc(uid).set({
        username: finalUsername,
        email: email.toLowerCase(),
        password: '',
        avatar: photoURL || 'hacker1',
        role: 'student',
        level: 1,
        xp: 0,
        rank: 'Script Kiddie',
        badges: [],
        completedChallenges: [],
        completedLabs: [],
        completedTasks: [],
        streak: 0,
        lastActive: adminFirestore.FieldValue.serverTimestamp(),
        bio: '',
        skills: [],
        provider: 'google',
        createdAt: adminFirestore.FieldValue.serverTimestamp()
      });
      userDoc = await db.collection('users').doc(uid).get();
    } else {
      // Update last active
      await db.collection('users').doc(uid).update({
        lastActive: adminFirestore.FieldValue.serverTimestamp()
      });
    }

    const user = userDoc.data();
    const token = generateToken(uid);

    res.json({
      success: true,
      token,
      user: {
        id: uid,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        rank: user.rank,
        role: user.role,
        avatar: user.avatar,
        badges: user.badges,
        streak: user.streak
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
