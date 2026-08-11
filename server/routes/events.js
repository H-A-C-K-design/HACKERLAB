const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect } = require('../middleware/auth');
const admin = require('firebase-admin');

const events = [
  {
    id: 'hexnova-ctf-2026',
    title: 'HexNova CTF 2026',
    organizer: 'CyberForge Academy',
    date: 'September 5, 2026',
    time: '10:00 AM UTC',
    duration: '8 Hours',
    type: 'Jeopardy & Attack-Defense',
    status: 'upcoming',
    xpReward: 500,
    bannerGradient: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(219,39,119,0.85))',
    description: 'The flagship annual CTF event organized by CyberForge. Test your penetration testing, web security, reverse engineering, cryptography, and forensics skills in an intense 24-hour global competition!',
    categories: ['Web Exploitation', 'Reverse Engineering', 'Cryptography', 'Forensics', 'Pwn', 'OSINT'],
    rules: [
      'Teams of 1 to 4 members are allowed.',
      'Flag format: CyberForge{...}',
      'Attacking the event submission infrastructure will result in immediate disqualification.',
      'Sharing flags or writeups during the active competition is strictly forbidden.'
    ],
    registrationUrl: 'https://hexnova.space/register'
  }
];

// GET all events
router.get('/', protect, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const registeredEvents = user.registeredEvents || [];

    const list = events.map(e => ({
      ...e,
      isRegistered: registeredEvents.includes(e.id)
    }));

    res.json({ success: true, events: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST register for event
router.post('/:id/register', protect, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = events.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userDoc.data();
    const registeredEvents = user.registeredEvents || [];

    if (registeredEvents.includes(eventId)) {
      return res.json({ success: false, message: 'Already registered for this event' });
    }

    await db.collection('users').doc(req.user.id).update({
      registeredEvents: admin.firestore.FieldValue.arrayUnion(eventId)
    });

    res.json({ success: true, message: `🎉 Successfully registered for ${event.title}! Event passes sent.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
