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

const workshops = [
  {
    id: 'intro-cybersecurity',
    title: 'Introduction to Cybersecurity',
    description: 'Learn the core security concepts, CIA triad, and common attack vectors in this beginner-friendly overview.',
    videoUrl: 'videos/intro-cybersecurity.mp4',
    duration: '20 mins',
    xpReward: 100,
    difficulty: 'Beginner',
    instructor: 'Alex Hunter (SecOps Lead)',
    status: 'recorded',
    tags: ['Security Basics', 'Threat Modeling']
  },
  {
    id: 'kali-linux-setup',
    title: 'Kali Linux Setup & Configuration',
    description: 'Walkthrough of installing Kali Linux in a virtual machine and configuring key penetration testing tools.',
    videoUrl: 'videos/kali-linux-setup.mp4',
    duration: '15 mins',
    xpReward: 150,
    difficulty: 'Intermediate',
    instructor: 'Diana Prince (SRE)',
    status: 'recorded',
    tags: ['Linux', 'Lab Setup']
  },
  {
    id: 'web-pen-testing',
    title: 'Web Application Penetration Testing',
    description: 'Deep dive into OWASP Top 10 vulnerabilities, demonstrating SQL injection and Cross-Site Scripting (XSS).',
    duration: '90 mins',
    xpReward: 250,
    difficulty: 'Advanced',
    instructor: 'Bruce Wayne (Ethical Hacker)',
    status: 'upcoming',
    date: 'Aug 18, 2026, 6:00 PM',
    tags: ['Web Security', 'OWASP']
  },
  {
    id: 'wireless-auditing',
    title: 'Wireless Network Auditing & WPA2 Cracking',
    description: 'Step-by-step session on auditing Wi-Fi networks and understanding WPA2 security handshake vulnerabilities.',
    duration: '60 mins',
    xpReward: 200,
    difficulty: 'Intermediate',
    instructor: 'Barry Allen (Network Admin)',
    status: 'upcoming',
    date: 'Aug 25, 2026, 5:00 PM',
    tags: ['Wi-Fi Security', 'Aircrack-ng']
  }
];

// GET all workshops
router.get('/', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const completedWorkshops = user.completedWorkshops || [];

    // Map workshops to include completed status
    const list = workshops.map(w => ({
      ...w,
      completed: completedWorkshops.includes(w.id)
    }));

    res.json({ success: true, workshops: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST complete workshop
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const workshopId = req.params.id;
    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return res.status(404).json({ success: false, message: 'Workshop not found' });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const completedWorkshops = user.completedWorkshops || [];

    if (completedWorkshops.includes(workshopId)) {
      return res.json({ success: false, message: 'Workshop already completed' });
    }

    const newXP = (user.xp || 0) + workshop.xpReward;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    await db.collection('users').doc(req.user.id).update({
      completedWorkshops: admin.firestore.FieldValue.arrayUnion(workshopId),
      xp: newXP,
      rank: newRank,
      level: newLevel
    });

    res.json({ success: true, message: '🎉 Workshop Completed!', xpEarned: workshop.xpReward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
