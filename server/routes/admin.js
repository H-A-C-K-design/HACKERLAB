const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect, adminOnly } = require('../middleware/auth');
const admin = require('firebase-admin');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ── DASHBOARD STATS ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [usersSnap, challengesSnap, labsSnap, tasksSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('challenges').count().get(),
      db.collection('labs').count().get(),
      db.collection('tasks').count().get()
    ]);

    const recentSnap = await db.collection('users').orderBy('createdAt', 'desc').limit(5).get();
    const topSnap = await db.collection('users').orderBy('xp', 'desc').limit(5).get();

    const recentUsers = recentSnap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, username: d.username, email: d.email, role: d.role, xp: d.xp, rank: d.rank, createdAt: d.createdAt };
    });

    const topUsers = topSnap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, username: d.username, xp: d.xp, rank: d.rank, level: d.level };
    });

    res.json({
      success: true,
      stats: {
        totalUsers: usersSnap.data().count,
        totalChallenges: challengesSnap.data().count,
        totalLabs: labsSnap.data().count,
        totalTasks: tasksSnap.data().count
      },
      recentUsers,
      topUsers
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── USERS ─────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = snap.docs.map(doc => {
      const { password, ...rest } = doc.data();
      return { id: doc.id, ...rest };
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    // Whitelist only allowed fields — prevent arbitrary field injection
    const { role, xp, rank } = req.body;
    const update = {};
    if (role !== undefined) update.role = role;
    if (xp !== undefined) update.xp = Number(xp);
    if (rank !== undefined) update.rank = String(rank);
    if (Object.keys(update).length === 0)
      return res.status(400).json({ success: false, message: 'No valid fields provided' });
    await db.collection('users').doc(req.params.id).update(update);
    const updated = await db.collection('users').doc(req.params.id).get();
    const { password, ...rest } = updated.data();
    res.json({ success: true, user: { id: updated.id, ...rest } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    await db.collection('users').doc(req.params.id).delete();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CHALLENGES ────────────────────────────────────────────
router.get('/challenges', async (req, res) => {
  try {
    const snap = await db.collection('challenges').orderBy('createdAt', 'desc').get();
    const challenges = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/challenges', async (req, res) => {
  try {
    const ref = db.collection('challenges').doc();
    await ref.set({ ...req.body, solvedBy: [], solveCount: 0, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    res.status(201).json({ success: true, challenge: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/challenges/:id', async (req, res) => {
  try {
    // Check existence first
    const existing = await db.collection('challenges').doc(req.params.id).get();
    if (!existing.exists) return res.status(404).json({ success: false, message: 'Challenge not found' });
    // Whitelist allowed fields — prevent arbitrary field injection
    const { title, description, category, difficulty, points, hints, tags, isActive } = req.body;
    const update = {};
    if (title !== undefined) update.title = String(title).slice(0, 200);
    if (description !== undefined) update.description = String(description).slice(0, 5000);
    if (category !== undefined) update.category = String(category);
    if (difficulty !== undefined) update.difficulty = String(difficulty);
    if (points !== undefined) update.points = Number(points);
    if (hints !== undefined) update.hints = hints;
    if (tags !== undefined) update.tags = tags;
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    await db.collection('challenges').doc(req.params.id).update(update);
    const doc = await db.collection('challenges').doc(req.params.id).get();
    res.json({ success: true, challenge: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/challenges/:id', async (req, res) => {
  try {
    await db.collection('challenges').doc(req.params.id).delete();
    res.json({ success: true, message: 'Challenge deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── LABS ──────────────────────────────────────────────────
router.get('/labs', async (req, res) => {
  try {
    const snap = await db.collection('labs').orderBy('createdAt', 'desc').get();
    const labs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, labs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/labs', async (req, res) => {
  try {
    const ref = db.collection('labs').doc();
    await ref.set({ ...req.body, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    res.status(201).json({ success: true, lab: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/labs/:id', async (req, res) => {
  try {
    await db.collection('labs').doc(req.params.id).delete();
    res.json({ success: true, message: 'Lab deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── TASKS ─────────────────────────────────────────────────
router.get('/tasks', async (req, res) => {
  try {
    const snap = await db.collection('tasks').orderBy('createdAt', 'desc').get();
    const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const ref = db.collection('tasks').doc();
    await ref.set({ ...req.body, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    const doc = await ref.get();
    res.status(201).json({ success: true, task: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await db.collection('tasks').doc(req.params.id).delete();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ANNOUNCE ─────────────────────────────────────────────
router.post('/announce', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });
    global.announcement = { message, postedAt: new Date(), postedBy: req.user.username };
    res.json({ success: true, message: 'Announcement posted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/announcement', async (req, res) => {
  res.json({ success: true, announcement: global.announcement || null });
});

module.exports = router;
