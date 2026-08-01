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
    const snap = await db.collection('tasks').where('isActive', '==', true).get();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const completedTasks = userDoc.data().completedTasks || [];

    const tasks = snap.docs.map(doc => {
      const { solution, ...rest } = doc.data();
      return { id: doc.id, ...rest, completed: completedTasks.includes(doc.id) };
    });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed/all', async (req, res) => {
  try {
    const batch = db.batch();
    seedTasks.forEach(task => {
      const ref = db.collection('tasks').doc();
      batch.set(ref, { ...task, isActive: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    res.json({ success: true, message: 'Tasks seeded!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/submit', protect, async (req, res) => {
  try {
    const taskDoc = await db.collection('tasks').doc(req.params.id).get();
    if (!taskDoc.exists) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = taskDoc.data();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const user = userDoc.data();
    const completedTasks = user.completedTasks || [];

    if (completedTasks.includes(req.params.id))
      return res.json({ success: false, message: 'Already completed!' });

    const newXP = (user.xp || 0) + task.points;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    await db.collection('users').doc(req.user.id).update({
      completedTasks: admin.firestore.FieldValue.arrayUnion(req.params.id),
      xp: newXP,
      rank: newRank,
      level: newLevel
    });

    res.json({ success: true, message: '✅ Task Completed!', xpEarned: task.points });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const seedTasks = [
  { title: 'Port Scanner in Python', description: 'Write a Python script that scans ports 1-1024 on localhost and prints all open ports.', type: 'python', difficulty: 'easy', points: 100, starterCode: 'import socket\n\ndef scan_ports(host, start_port, end_port):\n    # Your code here\n    pass\n\nscan_ports("localhost", 1, 1024)', solution: 'import socket\ndef scan_ports(host, start_port, end_port):\n    for port in range(start_port, end_port+1):\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        s.settimeout(0.5)\n        if s.connect_ex((host, port)) == 0:\n            print(f"Port {port} is open")\n        s.close()', hints: ['Use socket.connect_ex() - returns 0 if port is open', 'Use socket.settimeout() to avoid hanging'], tags: ['python', 'networking', 'scanner'] },
  { title: 'Caesar Cipher', description: 'Implement Caesar Cipher encryption and decryption in Python.', type: 'python', difficulty: 'easy', points: 75, starterCode: 'def caesar_encrypt(text, shift):\n    pass\n\ndef caesar_decrypt(text, shift):\n    pass', solution: 'def caesar_encrypt(text, shift):\n    result = ""\n    for char in text:\n        if char.isalpha():\n            base = ord("A") if char.isupper() else ord("a")\n            result += chr((ord(char) - base + shift) % 26 + base)\n        else:\n            result += char\n    return result\n\ndef caesar_decrypt(text, shift):\n    return caesar_encrypt(text, -shift)', hints: ['Use ord() and chr() for ASCII conversion', 'Use modulo 26 to wrap around the alphabet'], tags: ['python', 'cryptography', 'cipher'] },
  { title: 'Password Strength Checker', description: 'Write a function that checks password strength and returns: Weak, Medium, or Strong.', type: 'python', difficulty: 'easy', points: 75, starterCode: 'import re\n\ndef check_password_strength(password):\n    pass', solution: 'import re\ndef check_password_strength(password):\n    score = 0\n    if len(password) >= 8: score += 1\n    if re.search(r"[A-Z]", password): score += 1\n    if re.search(r"[a-z]", password): score += 1\n    if re.search(r"\\d", password): score += 1\n    if re.search(r"[!@#$%^&*]", password): score += 1\n    if score <= 2: return "Weak"\n    elif score <= 4: return "Medium"\n    return "Strong"', hints: ['Use re module for regex checks', 'Count how many criteria are met'], tags: ['python', 'security', 'passwords'] },
  { title: 'Hash a Password', description: 'Use Python hashlib to hash a password with SHA-256 and add salt for security.', type: 'python', difficulty: 'medium', points: 150, starterCode: 'import hashlib\nimport os\n\ndef hash_password(password):\n    pass\n\ndef verify_password(password, hashed, salt):\n    pass', solution: 'import hashlib, os\ndef hash_password(password):\n    salt = os.urandom(32)\n    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)\n    return key.hex(), salt.hex()\ndef verify_password(password, stored_hash, salt):\n    key = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100000)\n    return key.hex() == stored_hash', hints: ['Use os.urandom() for cryptographic salt', 'Use hashlib.pbkdf2_hmac for secure hashing'], tags: ['python', 'cryptography', 'hashing'] },
  { title: 'Bash: File Permission Audit', description: 'Write a bash script that finds all SUID files on the system.', type: 'bash', difficulty: 'medium', points: 150, starterCode: '#!/bin/bash\n# Find all SUID files and save to suid_files.txt\n# Your code here', solution: '#!/bin/bash\necho "Scanning for SUID files..."\nfind / -perm -4000 -type f 2>/dev/null | tee suid_files.txt\necho "Found $(wc -l < suid_files.txt) SUID files"', hints: ['Use find command with -perm -4000', 'Redirect stderr to /dev/null to suppress errors'], tags: ['bash', 'linux', 'privilege-escalation'] },
  { title: 'XSS Filter Bypass', description: 'Write JavaScript code to detect and sanitize XSS payloads from user input.', type: 'javascript', difficulty: 'medium', points: 200, starterCode: 'function sanitizeInput(input) {\n  // Remove dangerous HTML tags\n}\n\nfunction detectXSS(input) {\n  // Return true if XSS detected\n}', solution: 'function sanitizeInput(input) {\n  return input.replace(/<script[^>]*>.*?<\\/script>/gi, "")\n    .replace(/javascript:/gi, "")\n    .replace(/</g, "&lt;").replace(/>/g, "&gt;");\n}\nfunction detectXSS(input) {\n  const patterns = [/<script/i, /javascript:/i, /on\\w+=/i, /eval\\s*\\(/i];\n  return patterns.some(p => p.test(input));\n}', hints: ['Use regex to detect script tags', 'HTML encode < and > characters'], tags: ['javascript', 'xss', 'web-security'] }
];

module.exports = router;
