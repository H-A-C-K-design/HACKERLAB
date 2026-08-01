const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const snap = await db.collection('users').orderBy('xp', 'desc').limit(50).get();

    const leaderboard = snap.docs.map((doc, i) => {
      const u = doc.data();
      return {
        position: i + 1,
        username: u.username,
        xp: u.xp,
        level: u.level,
        rank: u.rank,
        avatar: u.avatar,
        badgeCount: (u.badges || []).length,
        challengesSolved: (u.completedChallenges || []).length
      };
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
