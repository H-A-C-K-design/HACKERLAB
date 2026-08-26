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
    id: 'ctf-in-hindi-explained',
    title: 'What is CTF in Hindi | Capture The Flag Explained',
    description: 'Master the core concepts of Capture The Flag (CTF) security competitions in Hindi. Deep dive into Jeopardy vs Attack-Defense styles, Web Exploitation, Reverse Engineering, Cryptography, Forensics, and practical tips to start competing and capturing flags.',
    instructor: 'Ankit Chauhan',
    duration: '18 mins',
    difficulty: 'Beginner',
    status: 'recorded',
    xpReward: 300,
    tags: ['CTF', 'Hindi', 'Jeopardy', 'Reverse Engineering', 'Web Security'],
    videoUrl: 'https://d4k2eekwuskedyx5.public.blob.vercel-storage.com/What%20is%20CTF%20in%20Hindi%20%20Capture%20The%20Flag%20Explained%20%20CTF%202021%20-%20Ankit%20Chauhan.mp3',
    date: 'CTF 2021',
    mediaType: 'audio'
  },
  {
    id: 'intro-to-web-security-owasp',
    title: 'OWASP Top 10 Web Vulnerabilities Deep Dive',
    description: 'Hands-on breakdown of modern web exploitation vectors including SQL Injection, Cross-Site Scripting (XSS), IDOR, and Server-Side Request Forgery (SSRF) with live demonstrations.',
    instructor: 'CyberForge Core Team',
    duration: '45 mins',
    difficulty: 'Intermediate',
    status: 'recorded',
    xpReward: 350,
    tags: ['Web Security', 'OWASP', 'SQLi', 'XSS', 'AppSec'],
    videoUrl: 'https://d4k2eekwuskedyx5.public.blob.vercel-storage.com/What%20is%20CTF%20in%20Hindi%20%20Capture%20The%20Flag%20Explained%20%20CTF%202021%20-%20Ankit%20Chauhan.mp3',
    date: '2024',
    mediaType: 'audio'
  },
  {
    id: 'intro-network-sniffing-wireshark',
    title: 'Packet Analysis & Threat Hunting with Wireshark',
    description: 'Master packet inspection, traffic flow reconstruction, PCAP forensic investigations, and extracting malicious payloads from live network streams.',
    instructor: 'CyberForge Core Team',
    duration: '35 mins',
    difficulty: 'Intermediate',
    status: 'recorded',
    xpReward: 300,
    tags: ['Network Security', 'Wireshark', 'PCAP', 'Packet Analysis'],
    videoUrl: 'https://d4k2eekwuskedyx5.public.blob.vercel-storage.com/What%20is%20CTF%20in%20Hindi%20%20Capture%20The%20Flag%20Explained%20%20CTF%202021%20-%20Ankit%20Chauhan.mp3',
    date: '2024',
    mediaType: 'audio'
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
