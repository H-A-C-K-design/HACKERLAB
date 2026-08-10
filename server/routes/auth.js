const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const https = require('https');
const { db, admin } = require('../config/firebase');
const { protect } = require('../middleware/auth');

// Lazily resolved so they are only called after Firebase is initialised
const getAdminAuth = () => (admin.apps && admin.apps.length) ? admin.auth() : null;
const getFirestoreFieldValue = () => (admin.apps && admin.apps.length && admin.firestore) ? admin.firestore.FieldValue : { serverTimestamp: () => new Date().toISOString() };

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
          resolve(result.success && result.score >= 0.5);
        } catch { resolve(false); }
      });
    });
    req.on('error', () => resolve(false)); // fail CLOSED on network errors — do not allow bots through
    req.write(params);
    req.end();
  });
}

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ success: false, message: 'Database not initialized. Please set Firebase environment variables.' });
    const { username, email, password, recaptchaToken } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    // Input type validation to prevent NoSQL / method manipulation attacks
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input data format' });
    }

    // Input validation
    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ success: false, message: 'Username must be 3-20 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores' });
    
    // Strengthened Password Policy (min 8 chars)
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    if (password.length > 128)
      return res.status(400).json({ success: false, message: 'Password too long' });
    
    const weakPasswords = ['password', '12345678', 'admin123', 'cyberforge', 'password123', 'qwertyuiop'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Password is too common or easily guessable. Please choose a stronger password.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Invalid email format' });

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });

    const emailSnap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (!emailSnap.empty) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    const userSnap = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!userSnap.empty) return res.status(400).json({ success: false, message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRef = db.collection('users').doc();
    const FieldValue = getFirestoreFieldValue();
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
      lastActive: FieldValue.serverTimestamp(),
      bio: '',
      skills: [],
      createdAt: FieldValue.serverTimestamp()
    };

    await userRef.set(userData);
    const token = generateToken(userRef.id);

    res.status(201).json({
      success: true,
      token,
      user: { id: userRef.id, username, email: email.toLowerCase(), level: 1, xp: 0, rank: 'Script Kiddie', role: 'student' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed. Please verify input data and try again.' });
  }
});

// Account Lockout Constants (5 failed attempts => 5 hours lockout)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ success: false, message: 'Database not initialized. Please set Firebase environment variables.' });
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid credentials format' });
    }

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });

    const normalizedEmail = email.toLowerCase().trim();
    const snap = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();
    if (snap.empty) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const userDoc = snap.docs[0];
    const user = userDoc.data();
    const now = Date.now();

    // 1. Check if account is currently locked out for 5 hours
    if (user.lockoutUntil && user.lockoutUntil > now) {
      const remainingMs = user.lockoutUntil - now;
      const remainingMins = Math.ceil(remainingMs / (1000 * 60));
      const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      const timeStr = remainingMins > 60 ? `${remainingHours} hours` : `${remainingMins} minutes`;
      return res.status(423).json({
        success: false,
        message: `Account locked due to 5 consecutive failed login attempts. Please try again after ${timeStr}.`,
        isLockedOut: true,
        lockoutUntil: user.lockoutUntil
      });
    }

    // 2. Verify password match
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const attempts = (user.failedAttempts || 0) + 1;
      const updateData = { failedAttempts: attempts };

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        // Trigger 5-hour account lockout
        const lockoutUntil = now + LOCKOUT_DURATION_MS;
        updateData.lockoutUntil = lockoutUntil;
        await userDoc.ref.update(updateData);
        return res.status(423).json({
          success: false,
          message: '⛔ Account locked! You entered incorrect credentials 5 times. Account is locked for 5 hours.',
          isLockedOut: true,
          lockoutUntil
        });
      } else {
        await userDoc.ref.update(updateData);
        const remaining = MAX_FAILED_ATTEMPTS - attempts;
        return res.status(401).json({
          success: false,
          message: `Invalid credentials. Warning: ${remaining} attempt${remaining === 1 ? '' : 's'} left before 5-hour account lockout!`,
          attemptsRemaining: remaining
        });
      }
    }

    // 3. Successful login — reset failed attempts counter & clear lockout
    await userDoc.ref.update({
      lastActive: getFirestoreFieldValue().serverTimestamp(),
      failedAttempts: 0,
      lockoutUntil: null
    });

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
    res.status(401).json({ success: false, message: 'Invalid credentials' });
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
    res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
});

// @route POST /api/auth/google — Google Sign-In
router.post('/google', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ success: false, message: 'Database not initialized. Please set Firebase environment variables.' });
    const { idToken, username, photoURL } = req.body;
    if (!idToken || typeof idToken !== 'string') return res.status(400).json({ success: false, message: 'ID token required' });

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    // Trust verified email claim directly from verified Google ID token
    const verifiedEmail = (decoded.email || '').toLowerCase();

    let userDoc = await db.collection('users').doc(uid).get();
    const FieldValue = getFirestoreFieldValue();

    if (!userDoc.exists) {
      const rawUsername = (typeof username === 'string' && username.trim()) ? username.replace(/[^a-zA-Z0-9_]/g, '') : '';
      const cleanUsername = rawUsername || 'user_' + uid.slice(0, 8);
      const uSnap = await db.collection('users').where('username', '==', cleanUsername).limit(1).get();
      const finalUsername = uSnap.empty ? cleanUsername : cleanUsername + '_' + Date.now().toString().slice(-4);

      await db.collection('users').doc(uid).set({
        username: finalUsername,
        email: verifiedEmail,
        password: '',
        avatar: (typeof photoURL === 'string' && photoURL) ? photoURL : 'hacker1',
        role: 'student',
        level: 1,
        xp: 0,
        rank: 'Script Kiddie',
        badges: [],
        completedChallenges: [],
        completedLabs: [],
        completedTasks: [],
        streak: 0,
        lastActive: FieldValue.serverTimestamp(),
        bio: '',
        skills: [],
        provider: 'google',
        createdAt: FieldValue.serverTimestamp()
      });
      userDoc = await db.collection('users').doc(uid).get();
    } else {
      await db.collection('users').doc(uid).update({
        lastActive: FieldValue.serverTimestamp()
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
    res.status(401).json({ success: false, message: 'Google Authentication failed: Invalid or expired token' });
  }
});

module.exports = router;
