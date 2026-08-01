// Seed script - run: node server/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const { db } = require('./config/firebase');

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── Admin User ──────────────────────────────────────────
  const adminSnap = await db.collection('users')
    .where('email', '==', 'admin@cyberforge.io')
    .limit(1)
    .get();

  if (adminSnap.empty) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const ref = db.collection('users').doc();
    await ref.set({
      username: 'admin',
      email: 'admin@cyberforge.io',
      password: hashedPassword,
      avatar: 'hacker1',
      role: 'admin',
      level: 100,
      xp: 50000,
      rank: 'Cyber God',
      badges: [
        { name: 'Founder', icon: '👑', earnedAt: new Date() },
        { name: 'Elite Hacker', icon: '🎯', earnedAt: new Date() }
      ],
      completedChallenges: [],
      completedLabs: [],
      completedTasks: [],
      streak: 0,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      bio: 'Platform Administrator',
      skills: ['pentesting', 'web-security', 'forensics'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Admin user created');
    console.log('   Email   : admin@cyberforge.io');
    console.log('   Password: admin123\n');
  } else {
    console.log('ℹ️  Admin user already exists\n');
  }

  // ── Challenges ──────────────────────────────────────────
  const challengeSnap = await db.collection('challenges').limit(1).get();
  if (challengeSnap.empty) {
    const batch = db.batch();
    const challenges = [
      { title: 'Hello World Flag', description: 'Find the hidden flag in the HTTP response headers. Tools: curl, browser devtools.\n\nHint: Check the X-Flag header!', category: 'web', difficulty: 'easy', points: 50, flag: 'CyberForge{h3ll0_w0rld_h4ck3r}', hints: [{ text: 'Use curl -I or browser network tab', cost: 10 }], tags: ['web', 'beginner', 'http'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'Base64 Secrets', description: 'Decode this string:\nQ3liZXJGb3JnZXtCNHM2NF9pczNhc3lfZGVjMGQzfQ==', category: 'cryptography', difficulty: 'easy', points: 50, flag: 'CyberForge{B4s64_is3asy_dec0d3}', hints: [{ text: 'echo "encoded" | base64 -d', cost: 5 }], tags: ['crypto', 'encoding'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'SQL Injection 101', description: 'Bypass login using SQL injection.\nTarget: http://lab.cyberforge.local/sqli', category: 'web', difficulty: 'medium', points: 150, flag: 'CyberForge{SQL_1nj3ct10n_byp4ss}', hints: [{ text: "Try: ' OR '1'='1", cost: 20 }], tags: ['web', 'sqli'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'Hash Cracking', description: 'Crack these MD5 hashes:\n1. 5f4dcc3b5aa765d61d8327deb882cf99\n2. e10adc3949ba59abbe56e057f20f883e\n\nSubmit as: CyberForge{pass1_pass2}', category: 'cryptography', difficulty: 'easy', points: 100, flag: 'CyberForge{password_123456}', hints: [{ text: 'Use hashcat -m 0 hash.txt wordlist.txt', cost: 10 }], tags: ['crypto', 'hash'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'XSS Challenge', description: 'Find and exploit an XSS vulnerability.\nSteal the admin cookie.', category: 'web', difficulty: 'medium', points: 200, flag: 'CyberForge{xss_st0l3n_c00k13}', hints: [{ text: 'Try injecting <script>alert(1)</script>', cost: 20 }], tags: ['web', 'xss'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'Binary Exploitation', description: 'Buffer overflow vulnerability exists.\nOverwrite return address to call win().', category: 'pwn', difficulty: 'hard', points: 300, flag: 'CyberForge{buff3r_0v3rfl0w_m4st3r}', hints: [{ text: 'Find offset using pattern_create', cost: 30 }], tags: ['pwn', 'binary'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'Reverse Me', description: 'Reverse engineer this binary and find the correct password.', category: 'reverse-engineering', difficulty: 'hard', points: 300, flag: 'CyberForge{r3v3rs3_3ng1n33r1ng_pr0}', hints: [{ text: 'Run: strings ./binary | grep flag', cost: 25 }], tags: ['rev', 'binary'], solvedBy: [], solveCount: 0, isActive: true },
      { title: 'Network Packet Analysis', description: 'Download the PCAP file and analyze it.\nFind the credentials transmitted over the network.', category: 'forensics', difficulty: 'medium', points: 150, flag: 'CyberForge{p4ck3t_sn1ff3r_pr0}', hints: [{ text: 'Filter: http.authbasic in Wireshark', cost: 25 }], tags: ['network', 'forensics'], solvedBy: [], solveCount: 0, isActive: true }
    ];
    challenges.forEach(c => {
      const ref = db.collection('challenges').doc();
      batch.set(ref, { ...c, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log(`✅ ${challenges.length} challenges seeded\n`);
  } else {
    console.log('ℹ️  Challenges already exist\n');
  }

  // ── Labs ────────────────────────────────────────────────
  const labSnap = await db.collection('labs').limit(1).get();
  if (labSnap.empty) {
    const batch = db.batch();
    const labs = [
      {
        title: 'Kali Linux Installation Guide',
        description: 'Complete guide to installing Kali Linux on your laptop',
        category: 'kali-basics', difficulty: 'beginner', duration: '45 mins', xpReward: 150,
        tools: ['VirtualBox', 'Rufus', 'Kali ISO'],
        objectives: ['Download Kali Linux ISO', 'Create bootable USB', 'Install Kali Linux'],
        steps: [
          { stepNumber: 1, title: 'Download Kali Linux', instruction: 'Go to kali.org/get-kali and download the latest ISO.', command: 'wget https://cdimage.kali.org/kali-2024.1/kali-linux-2024.1-installer-amd64.iso', expectedOutput: 'Download progress bar', hint: 'Choose the 64-bit installer version' },
          { stepNumber: 2, title: 'Verify ISO', instruction: 'Verify your download integrity.', command: 'sha256sum kali-linux-2024.1-installer-amd64.iso', expectedOutput: 'Hash matches official website', hint: 'Compare with hash on kali.org' },
          { stepNumber: 3, title: 'Create Bootable USB', instruction: 'Use Rufus or dd to create bootable USB.', command: 'sudo dd if=kali.iso of=/dev/sdb bs=4M status=progress', expectedOutput: 'Records in/out', hint: 'Use lsblk to identify USB drive' }
        ],
        isActive: true
      },
      {
        title: 'Essential Linux Commands',
        description: 'Master the most important Linux commands for cybersecurity',
        category: 'kali-basics', difficulty: 'beginner', duration: '60 mins', xpReward: 200,
        tools: ['Terminal', 'Bash'],
        objectives: ['Navigate filesystem', 'Manage files', 'Network commands'],
        steps: [
          { stepNumber: 1, title: 'Navigation', instruction: 'Learn to move around the filesystem', command: 'ls -la && pwd', expectedOutput: 'File list with permissions', hint: 'ls -la shows hidden files' },
          { stepNumber: 2, title: 'File Operations', instruction: 'Create and manage files', command: 'touch test.txt && echo "Hello" > test.txt && cat test.txt', expectedOutput: 'Hello', hint: 'Use cat to read files' },
          { stepNumber: 3, title: 'Network Commands', instruction: 'Essential network recon commands', command: 'ifconfig && ip addr', expectedOutput: 'Network interfaces', hint: 'ip addr is more modern' }
        ],
        isActive: true
      },
      {
        title: 'Nmap Network Scanning',
        description: 'Learn Nmap - the most powerful network scanner',
        category: 'network-scan', difficulty: 'intermediate', duration: '90 mins', xpReward: 300,
        tools: ['nmap', 'Wireshark'],
        objectives: ['Host discovery', 'Port scanning', 'Service detection'],
        steps: [
          { stepNumber: 1, title: 'Ping Sweep', instruction: 'Discover live hosts', command: 'nmap -sn 192.168.1.0/24', expectedOutput: 'Hosts up: X', hint: '-sn = no port scan' },
          { stepNumber: 2, title: 'Port Scan', instruction: 'Scan for open ports', command: 'nmap -sS -p 1-1000 192.168.1.1', expectedOutput: 'Open ports listed', hint: '-sS is SYN scan' },
          { stepNumber: 3, title: 'Service Detection', instruction: 'Identify running services', command: 'nmap -sV -sC 192.168.1.1', expectedOutput: 'Service names and versions', hint: '-sC runs default scripts' }
        ],
        isActive: true
      }
    ];
    labs.forEach(l => {
      const ref = db.collection('labs').doc();
      batch.set(ref, { ...l, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log(`✅ ${labs.length} labs seeded\n`);
  } else {
    console.log('ℹ️  Labs already exist\n');
  }

  // ── Tasks ───────────────────────────────────────────────
  const taskSnap = await db.collection('tasks').limit(1).get();
  if (taskSnap.empty) {
    const batch = db.batch();
    const tasks = [
      { title: 'Port Scanner in Python', description: 'Write a Python script that scans ports 1-1024 on localhost.', type: 'python', difficulty: 'easy', points: 100, starterCode: 'import socket\n\ndef scan_ports(host, start_port, end_port):\n    # Your code here\n    pass\n\nscan_ports("localhost", 1, 1024)', solution: 'import socket\ndef scan_ports(host, start_port, end_port):\n    for port in range(start_port, end_port+1):\n        s = socket.socket()\n        s.settimeout(0.5)\n        if s.connect_ex((host, port)) == 0:\n            print(f"Port {port} is open")\n        s.close()', hints: ['Use socket.connect_ex()', 'Returns 0 if port is open'], tags: ['python', 'networking'], isActive: true },
      { title: 'Caesar Cipher', description: 'Implement Caesar Cipher encryption and decryption.', type: 'python', difficulty: 'easy', points: 75, starterCode: 'def caesar_encrypt(text, shift):\n    pass\n\ndef caesar_decrypt(text, shift):\n    pass', solution: 'def caesar_encrypt(text, shift):\n    result = ""\n    for char in text:\n        if char.isalpha():\n            base = ord("A") if char.isupper() else ord("a")\n            result += chr((ord(char) - base + shift) % 26 + base)\n        else:\n            result += char\n    return result\ndef caesar_decrypt(text, shift):\n    return caesar_encrypt(text, -shift)', hints: ['Use ord() and chr()', 'Use modulo 26'], tags: ['python', 'crypto'], isActive: true },
      { title: 'XSS Filter', description: 'Write JavaScript to detect and sanitize XSS payloads.', type: 'javascript', difficulty: 'medium', points: 200, starterCode: 'function sanitizeInput(input) {\n  // Remove dangerous tags\n}\nfunction detectXSS(input) {\n  // Return true if XSS detected\n}', solution: 'function sanitizeInput(input) {\n  return input.replace(/<script[^>]*>.*?<\\/script>/gi, "").replace(/javascript:/gi, "").replace(/</g, "&lt;").replace(/>/g, "&gt;");\n}\nfunction detectXSS(input) {\n  return [/<script/i, /javascript:/i, /on\\w+=/i].some(p => p.test(input));\n}', hints: ['Use regex for script tags', 'HTML encode < and >'], tags: ['javascript', 'xss'], isActive: true }
    ];
    tasks.forEach(t => {
      const ref = db.collection('tasks').doc();
      batch.set(ref, { ...t, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log(`✅ ${tasks.length} tasks seeded\n`);
  } else {
    console.log('ℹ️  Tasks already exist\n');
  }

  console.log('🎉 Seed complete!');
  console.log('─────────────────────────────────');
  console.log('Open: http://localhost:5000');
  console.log('Login: admin@cyberforge.io / admin123');
  console.log('─────────────────────────────────');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
