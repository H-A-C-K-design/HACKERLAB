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
    const snap = await db.collection('labs').where('isActive', '==', true).get();
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const completedLabs = userDoc.data().completedLabs || [];

    const labs = snap.docs.map(doc => {
      const { steps, ...rest } = doc.data();
      return { id: doc.id, ...rest, completed: completedLabs.includes(doc.id) };
    });

    res.json({ success: true, labs });
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

const seedLabs = [
  {
    title: 'Kali Linux Installation Guide',
    description: 'Complete guide to installing Kali Linux on your laptop - from USB creation to first boot',
    category: 'kali-basics', difficulty: 'beginner', duration: '45 mins', xpReward: 150,
    tools: ['VirtualBox', 'Rufus', 'Kali ISO'],
    objectives: ['Download Kali Linux ISO', 'Create bootable USB', 'Install Kali Linux', 'Configure initial settings'],
    steps: [
      { stepNumber: 1, title: 'Download Kali Linux', instruction: 'Go to kali.org/get-kali and download the latest ISO. Choose the installer version (not live).', command: 'wget https://cdimage.kali.org/kali-2024.1/kali-linux-2024.1-installer-amd64.iso', expectedOutput: 'Download progress bar', hint: 'Choose the 64-bit installer version' },
      { stepNumber: 2, title: 'Verify ISO integrity', instruction: 'Always verify your download to ensure it was not corrupted or tampered with.', command: 'sha256sum kali-linux-2024.1-installer-amd64.iso', expectedOutput: 'Hash matches official website', hint: 'Compare with hash on kali.org downloads page' },
      { stepNumber: 3, title: 'Create Bootable USB', instruction: 'Use Rufus (Windows) or dd (Linux) to create a bootable USB drive.', command: 'sudo dd if=kali-linux-2024.1-installer-amd64.iso of=/dev/sdb bs=4M status=progress', expectedOutput: 'Records in/out, bytes copied', hint: 'Use lsblk to identify your USB drive first' },
      { stepNumber: 4, title: 'Boot from USB', instruction: 'Restart your laptop, enter BIOS/UEFI and set USB as first boot device.', command: 'reboot', expectedOutput: 'Kali Linux boot menu appears', hint: 'Common BIOS keys: Dell=F2, HP=F10, Lenovo=F1' },
      { stepNumber: 5, title: 'Complete Installation', instruction: 'Follow the graphical installer.', command: '', expectedOutput: 'Installation complete, reboot prompt', hint: 'Use ext4 filesystem' }
    ]
  },
  {
    title: 'Essential Linux Commands for Hackers',
    description: 'Master the most important Linux commands used in cybersecurity and penetration testing',
    category: 'kali-basics', difficulty: 'beginner', duration: '60 mins', xpReward: 200,
    tools: ['Terminal', 'Bash'],
    objectives: ['Navigate filesystem', 'Manage files and permissions', 'Network commands', 'Process management'],
    steps: [
      { stepNumber: 1, title: 'Navigation Commands', instruction: 'Learn to move around the filesystem', command: 'ls -la && pwd && cd /etc && ls', expectedOutput: 'List of files with permissions', hint: 'ls -la shows hidden files too' },
      { stepNumber: 2, title: 'File Operations', instruction: 'Create, read, copy, and delete files', command: 'touch test.txt && echo "Hello Hacker" > test.txt && cat test.txt', expectedOutput: 'Hello Hacker', hint: 'Use cat, less, more, or nano to read files' },
      { stepNumber: 3, title: 'Permissions', instruction: 'Understanding file permissions is crucial for privilege escalation', command: 'ls -la /etc/passwd && chmod 777 test.txt && ls -la test.txt', expectedOutput: '-rwxrwxrwx permissions', hint: 'chmod 4+x adds execute' },
      { stepNumber: 4, title: 'Network Commands', instruction: 'Essential networking commands for reconnaissance', command: 'ifconfig && ip addr && netstat -tulpn', expectedOutput: 'Network interfaces and open ports', hint: 'ip addr is more modern than ifconfig' },
      { stepNumber: 5, title: 'Process Management', instruction: 'Monitor and manage system processes', command: 'ps aux && top', expectedOutput: 'Running processes list', hint: 'ps aux shows all processes' }
    ]
  },
  {
    title: 'Nmap Network Scanning',
    description: 'Learn to use Nmap - the most powerful network scanner used by security professionals',
    category: 'network-scan', difficulty: 'intermediate', duration: '90 mins', xpReward: 300,
    tools: ['nmap', 'Wireshark'],
    objectives: ['Host discovery', 'Port scanning', 'Service detection', 'OS fingerprinting', 'NSE scripts'],
    steps: [
      { stepNumber: 1, title: 'Basic Ping Sweep', instruction: 'Discover live hosts on the network', command: 'nmap -sn 192.168.1.0/24', expectedOutput: 'Hosts up: X', hint: '-sn means no port scan, just ping' },
      { stepNumber: 2, title: 'Port Scanning', instruction: 'Scan for open ports', command: 'nmap -sS -p 1-1000 192.168.1.1', expectedOutput: 'Open ports listed', hint: '-sS is SYN scan (stealth), requires root' },
      { stepNumber: 3, title: 'Service Version Detection', instruction: 'Identify services running on open ports', command: 'nmap -sV -sC 192.168.1.1', expectedOutput: 'Service names and versions', hint: '-sC runs default scripts' },
      { stepNumber: 4, title: 'OS Detection', instruction: 'Fingerprint the target operating system', command: 'nmap -O 192.168.1.1', expectedOutput: 'OS guess with percentage', hint: 'Requires root privileges' },
      { stepNumber: 5, title: 'Aggressive Scan', instruction: 'Run comprehensive scan with all features', command: 'nmap -A -T4 192.168.1.1', expectedOutput: 'Full scan results', hint: '-T4 increases speed' }
    ]
  }
];

module.exports = router;
