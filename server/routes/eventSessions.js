const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');
const admin = require('firebase-admin');

function calcRank(xp) {
  const ranks = [
    { min: 0, name: 'Script Kiddie' },
    { min: 500, name: 'Newbie Hacker' },
    { min: 1500, name: 'Penetration Tester' },
    { min: 3000, name: 'Security Analyst' },
    { min: 6000, name: 'Ethical Hacker' },
    { min: 10000, name: 'Cyber Warrior' },
    { min: 20000, name: 'Elite Hacker' },
    { min: 50000, name: 'Cyber God' }
  ];
  return ranks.filter(r => xp >= r.min).pop().name;
}

const eventSessions = [];

// GET all event sessions
router.get('/', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const registeredSessions = user.registeredSessions || [];
    const completedSessions = user.completedSessions || [];

    const list = eventSessions.map(s => ({
      ...s,
      isRegistered: registeredSessions.includes(s.id),
      isCompleted: completedSessions.includes(s.id)
    }));

    res.json({ success: true, sessions: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register for an event session
router.post('/:id/register', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = eventSessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const registeredSessions = user.registeredSessions || [];

    if (registeredSessions.includes(sessionId)) {
      return res.json({ success: false, message: 'Already registered for this session' });
    }

    await db.collection('users').doc(req.user.id).update({
      registeredSessions: admin.firestore.FieldValue.arrayUnion(sessionId)
    });

    res.json({ success: true, message: `🎉 Successfully registered for "${session.title}"! You'll receive a reminder before the session.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST complete an event session (earn XP)
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = eventSessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const completedSessions = user.completedSessions || [];

    if (completedSessions.includes(sessionId)) {
      return res.json({ success: false, message: 'Session already completed' });
    }

    const newXP = (user.xp || 0) + session.xpReward;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    await db.collection('users').doc(req.user.id).update({
      completedSessions: admin.firestore.FieldValue.arrayUnion(sessionId),
      xp: newXP,
      rank: newRank,
      level: newLevel
    });

    res.json({ success: true, message: '🎉 Session Completed!', xpEarned: session.xpReward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
