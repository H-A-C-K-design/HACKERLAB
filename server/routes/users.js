const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

router.get('/profile/:id', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = { id: userDoc.id, ...userDoc.data() };
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { bio, skills, avatar } = req.body;
    await db.collection('users').doc(req.user.id).update({ bio, skills, avatar });
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = { id: userDoc.id, ...userDoc.data() };
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = userDoc.data();
    res.json({
      success: true,
      stats: {
        xp: user.xp,
        level: user.level,
        rank: user.rank,
        challengesSolved: (user.completedChallenges || []).length,
        labsCompleted: (user.completedLabs || []).length,
        badges: (user.badges || []).length,
        streak: user.streak
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
