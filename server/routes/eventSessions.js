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

const eventSessions = [
  {
    id: 'live-recon-masterclass',
    title: 'Live Recon Masterclass',
    description: 'Join our live session on advanced reconnaissance techniques including subdomain enumeration, OSINT gathering, and passive fingerprinting used by professional red teamers.',
    speaker: 'Ravi Shankar (Red Team Lead)',
    date: 'August 20, 2026',
    time: '7:00 PM IST',
    duration: '90 mins',
    xpReward: 200,
    type: 'Live Webinar',
    status: 'upcoming',
    capacity: 100,
    enrolled: 42,
    tags: ['Recon', 'OSINT', 'Red Team'],
    bannerGradient: 'linear-gradient(135deg, #7c3aed, #2563eb)'
  },
  {
    id: 'malware-analysis-101',
    title: 'Malware Analysis 101',
    description: 'An introductory session on static and dynamic malware analysis. Learn to use tools like Ghidra, x64dbg, and sandbox environments to dissect real-world malware samples.',
    speaker: 'Sarah Chen (Malware Researcher)',
    date: 'August 25, 2026',
    time: '6:00 PM IST',
    duration: '120 mins',
    xpReward: 300,
    type: 'Hands-on Workshop',
    status: 'upcoming',
    capacity: 75,
    enrolled: 58,
    tags: ['Malware', 'Reverse Engineering', 'Forensics'],
    bannerGradient: 'linear-gradient(135deg, #db2777, #f97316)'
  },
  {
    id: 'bug-bounty-ama',
    title: 'Bug Bounty AMA with Top Hunters',
    description: 'Ask-Me-Anything session with top-ranked bug bounty hunters. Learn their methodology, tips for writing better reports, and how to get started on platforms like HackerOne & Bugcrowd.',
    speaker: 'Panel: 3 Top Bug Bounty Hunters',
    date: 'September 1, 2026',
    time: '8:00 PM IST',
    duration: '60 mins',
    xpReward: 150,
    type: 'AMA / Q&A',
    status: 'upcoming',
    capacity: 200,
    enrolled: 87,
    tags: ['Bug Bounty', 'Web Security', 'Career'],
    bannerGradient: 'linear-gradient(135deg, #059669, #0891b2)'
  },
  {
    id: 'cloud-security-deep-dive',
    title: 'Cloud Security Deep Dive: AWS & Azure',
    description: 'Explore common cloud misconfigurations, IAM privilege escalation, S3 bucket vulnerabilities, and how to secure cloud infrastructure from real-world attack scenarios.',
    speaker: 'Marcus Williams (Cloud Security Architect)',
    date: 'September 10, 2026',
    time: '7:30 PM IST',
    duration: '105 mins',
    xpReward: 250,
    type: 'Live Webinar',
    status: 'upcoming',
    capacity: 120,
    enrolled: 33,
    tags: ['Cloud Security', 'AWS', 'Azure', 'IAM'],
    bannerGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  },
  {
    id: 'ctf-strategy-session',
    title: 'CTF Strategy & Problem Solving',
    description: 'A completed session covering winning CTF strategies, time management during competitions, and walkthroughs of past CTF challenges from major events.',
    speaker: 'Alex Hunter (CTF Champion)',
    date: 'August 5, 2026',
    time: '6:00 PM IST',
    duration: '75 mins',
    xpReward: 175,
    type: 'Recorded Session',
    status: 'completed',
    capacity: 150,
    enrolled: 150,
    tags: ['CTF', 'Strategy', 'Problem Solving'],
    bannerGradient: 'linear-gradient(135deg, #0ea5e9, #7c3aed)'
  }
];

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
