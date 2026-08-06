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

router.get('/', protect, async (req, res) => {
  try {
    // All labs are disabled — return empty array
    res.json({ success: true, labs: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.collection('labs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Lab not found' });
    res.json({ success: true, lab: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/complete', protect, async (req, res) => {
  try {
    const labDoc = await db.collection('labs').doc(req.params.id).get();
    if (!labDoc.exists) return res.status(404).json({ success: false, message: 'Lab not found' });

    const lab = labDoc.data();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = userDoc.data();
    const completedLabs = user.completedLabs || [];

    if (completedLabs.includes(req.params.id))
      return res.json({ success: false, message: 'Lab already completed' });

    const newXP = (user.xp || 0) + lab.xpReward;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    await db.collection('users').doc(req.user.id).update({
      completedLabs: admin.firestore.FieldValue.arrayUnion(req.params.id),
      xp: newXP,
      rank: newRank,
      level: newLevel
    });

    res.json({ success: true, message: '🎉 Lab Completed!', xpEarned: lab.xpReward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed/all', async (req, res) => {
  try {
    const batch = db.batch();
    seedLabs.forEach(lab => {
      const ref = db.collection('labs').doc();
      batch.set(ref, { ...lab, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    res.json({ success: true, message: 'Labs seeded!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all labs from Firestore — clears the collection
router.delete('/all', async (req, res) => {
  try {
    const snap = await db.collection('labs').get();
    if (snap.empty) return res.json({ success: true, message: 'No labs to delete', deleted: 0 });
    // Firestore batch supports max 500 ops
    const chunks = [];
    let batch = db.batch();
    let count = 0;
    snap.docs.forEach((doc, i) => {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        chunks.push(batch.commit());
        batch = db.batch();
        count = 0;
      }
    });
    if (count > 0) chunks.push(batch.commit());
    await Promise.all(chunks);
    res.json({ success: true, message: `Deleted ${snap.size} labs`, deleted: snap.size });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all labs from Firestore
router.delete('/all', async (req, res) => {
  try {
    const snap = await db.collection('labs').get();
    if (snap.empty) return res.json({ success: true, message: 'No labs to delete' });
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ success: true, message: `Deleted ${snap.size} labs` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const seedLabs = [];

module.exports = router;
