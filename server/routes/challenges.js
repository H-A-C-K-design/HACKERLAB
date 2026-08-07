const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { protect, adminOnly } = require('../middleware/auth');
const admin = require('firebase-admin');

// Rank calculation helper
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

// GET all challenges
router.get('/', protect, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    let query = db.collection('challenges').where('isActive', '==', true);
    if (category) query = query.where('category', '==', category);
    if (difficulty) query = query.where('difficulty', '==', difficulty);

    const snap = await query.get();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const completedChallenges = userDoc.data().completedChallenges || [];

    const challenges = snap.docs.map(doc => {
      const data = doc.data();
      const { flag, ...rest } = data;
      return { id: doc.id, ...rest, solved: completedChallenges.includes(doc.id) };
    });

    challenges.sort((a, b) => a.points - b.points);
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single challenge
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await db.collection('challenges').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Challenge not found' });
    const { flag, ...rest } = doc.data();
    res.json({ success: true, challenge: { id: doc.id, ...rest } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST submit flag
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { flag } = req.body;
    const challengeDoc = await db.collection('challenges').doc(req.params.id).get();
    if (!challengeDoc.exists) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const challenge = challengeDoc.data();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = userDoc.data();
    const completed = user.completedChallenges || [];

    if (completed.includes(req.params.id))
      return res.status(400).json({ success: false, message: 'Already solved!' });

    if (flag.trim() !== challenge.flag)
      return res.json({ success: false, message: '❌ Wrong flag! Keep trying...' });

    const newXP = (user.xp || 0) + challenge.points;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    await db.collection('users').doc(req.user.id).update({
      completedChallenges: admin.firestore.FieldValue.arrayUnion(req.params.id),
      xp: newXP,
      rank: newRank,
      level: newLevel
    });

    await db.collection('challenges').doc(req.params.id).update({
      solvedBy: admin.firestore.FieldValue.arrayUnion(req.user.id),
      solveCount: admin.firestore.FieldValue.increment(1)
    });

    res.json({
      success: true,
      message: '🎉 Correct Flag! XP earned: ' + challenge.points,
      xpEarned: challenge.points,
      newXP,
      newRank
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST seed challenges
router.post('/seed/all', protect, adminOnly, async (req, res) => {
  try {
    const batch = db.batch();
    seedChallenges.forEach(challenge => {
      const ref = db.collection('challenges').doc();
      batch.set(ref, { ...challenge, solvedBy: [], solveCount: 0, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    res.json({ success: true, message: 'Challenges seeded!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const seedChallenges = [
  { title: 'Hello World Flag', description: 'Find the hidden flag in the HTTP response headers of this request. Tools: curl, browser devtools.\n\nHint: Check the X-Flag header!', category: 'web', difficulty: 'easy', points: 50, flag: 'CyberForge{h3ll0_w0rld_h4ck3r}', hints: [{ text: 'Use curl -I or browser network tab', cost: 10 }], tags: ['web', 'beginner', 'http'] },
  { title: 'Base64 Secrets', description: 'Decode this string to find the flag:\n\nQ3liZXJGb3JnZXtCNHM2NF9pczNhc3lfZGVjMGQzfQ==\n\nTools: base64, CyberChef', category: 'cryptography', difficulty: 'easy', points: 50, flag: 'CyberForge{B4s64_is3asy_dec0d3}', hints: [{ text: 'echo "encoded" | base64 -d', cost: 5 }], tags: ['crypto', 'encoding', 'base64'] },
  { title: 'Hidden in Plain Sight', description: 'A secret message is hidden in this image using steganography.\nDownload and analyze: challenge_image.png\n\nTools: steghide, strings, exiftool', category: 'steganography', difficulty: 'easy', points: 75, flag: 'CyberForge{st3g_1s_fun_t0_l34rn}', hints: [{ text: 'Try: steghide extract -sf image.png', cost: 15 }], tags: ['steg', 'image', 'forensics'] },
  { title: 'SQL Injection 101', description: 'Bypass this login form using SQL injection.\nTarget: http://lab.cyberforge.local/sqli\n\nUsername: admin\nPassword: ?\n\nFind the flag in the admin panel.', category: 'web', difficulty: 'medium', points: 150, flag: 'CyberForge{SQL_1nj3ct10n_byp4ss}', hints: [{ text: "Try: ' OR '1'='1", cost: 20 }, { text: "Username: admin'--", cost: 30 }], tags: ['web', 'sqli', 'database'] },
  { title: 'Network Packet Analysis', description: 'Download the PCAP file and analyze it.\nFind the credentials transmitted over the network.\n\nTools: Wireshark, tcpdump, tshark', category: 'forensics', difficulty: 'medium', points: 150, flag: 'CyberForge{p4ck3t_sn1ff3r_pr0}', hints: [{ text: 'Filter: http.authbasic in Wireshark', cost: 25 }], tags: ['network', 'forensics', 'wireshark'] },
  { title: 'ROT13 Cipher', description: 'Decrypt this message:\nPloresBbetr{e0g_13_v2_r4fl_3apr4gvba}\n\nFind the original flag!', category: 'cryptography', difficulty: 'easy', points: 50, flag: 'CyberForge{r0t_13_i2_e4sy_3ncr4tion}', hints: [{ text: 'ROT13 shifts each letter by 13', cost: 5 }], tags: ['crypto', 'rot13', 'cipher'] },
  { title: 'XSS Challenge', description: 'Find and exploit an XSS vulnerability in the target web app.\nSteal the admin cookie and submit it as the flag.\n\nTools: Browser, Burp Suite', category: 'web', difficulty: 'medium', points: 200, flag: 'CyberForge{xss_st0l3n_c00k13}', hints: [{ text: 'Try injecting <script>alert(1)</script>', cost: 20 }], tags: ['web', 'xss', 'javascript'] },
  { title: 'Binary Exploitation Basics', description: 'A buffer overflow vulnerability exists in this program.\nOverwrite the return address to call the win() function.\n\nTools: GDB, pwntools, Python', category: 'pwn', difficulty: 'hard', points: 300, flag: 'CyberForge{buff3r_0v3rfl0w_m4st3r}', hints: [{ text: 'Find the offset using pattern_create', cost: 30 }, { text: 'Use gdb: info functions', cost: 40 }], tags: ['pwn', 'buffer-overflow', 'binary'] },
  { title: 'Reverse Me', description: 'Reverse engineer this binary and find the correct password.\nThe program checks a hardcoded password.\n\nTools: Ghidra, IDA Free, strings', category: 'reverse-engineering', difficulty: 'hard', points: 300, flag: 'CyberForge{r3v3rs3_3ng1n33r1ng_pr0}', hints: [{ text: 'Run: strings ./binary | grep flag', cost: 25 }], tags: ['rev', 'binary', 'ghidra'] },
  { title: 'OSINT: Find the Location', description: 'Using only open-source intelligence, find the exact location shown in this image.\nSubmit: CyberForge{city_country} format\n\nTools: Google Maps, Reverse Image Search, EXIF data', category: 'osint', difficulty: 'medium', points: 175, flag: 'CyberForge{new_york_usa}', hints: [{ text: 'Check the EXIF data for GPS coordinates', cost: 20 }], tags: ['osint', 'geolocation', 'intelligence'] },
  { title: 'Hash Cracking', description: 'Crack these MD5 hashes:\n1. 5f4dcc3b5aa765d61d8327deb882cf99\n2. e10adc3949ba59abbe56e057f20f883e\n\nSubmit both passwords as: CyberForge{pass1_pass2}', category: 'cryptography', difficulty: 'easy', points: 100, flag: 'CyberForge{password_123456}', hints: [{ text: 'Use hashcat -m 0 hash.txt wordlist.txt', cost: 10 }], tags: ['crypto', 'hash', 'hashcat'] },
  { title: 'Directory Traversal', description: 'Exploit a path traversal vulnerability to read /etc/passwd from the server.\nTarget: http://lab.cyberforge.local/files?name=\n\nTools: curl, Burp Suite', category: 'web', difficulty: 'hard', points: 250, flag: 'CyberForge{p4th_tr4v3rs4l_expl01t}', hints: [{ text: 'Try: ?name=../../../../etc/passwd', cost: 25 }], tags: ['web', 'lfi', 'traversal'] }
];

module.exports = router;
