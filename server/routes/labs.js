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
    title: 'Module 1: Introduction to Cybersecurity',
    description: 'A comprehensive introduction to cybersecurity fundamentals — learn about the CIA Triad, common threats, types of hackers, basic networking, security principles, ethical hacking, and career paths in cybersecurity.',
    category: 'cybersecurity-fundamentals', difficulty: 'beginner', duration: '120 mins', xpReward: 300,
    downloadFile: '/modules/Module_1_Introduction_to_Cybersecurity.docx',
    downloadFileName: 'Module_1_Introduction_to_Cybersecurity.docx',
    tools: ['Browser', 'Terminal', 'Wireshark'],
    objectives: [
      'Understand what cybersecurity is and why it matters',
      'Learn the CIA Triad (Confidentiality, Integrity, Availability)',
      'Identify common cyber threats and malware types',
      'Understand types of hackers and their motivations',
      'Learn basic networking concepts (IP, DNS, HTTP, TCP/UDP)',
      'Apply core security principles (Least Privilege, Defense in Depth, Zero Trust)',
      'Understand ethical hacking fundamentals',
      'Explore cybersecurity career paths'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'What is Cybersecurity?',
        instruction: 'Cybersecurity is the practice of protecting systems, networks, applications, and data from unauthorized access, attacks, damage, or theft. It protects personal data, business operations, financial systems, healthcare, governments, and critical infrastructure. Start by checking your own system\'s security posture.',
        command: 'uname -a && whoami && id',
        expectedOutput: 'System info, current user, and group memberships',
        hint: 'Understanding your own system is the first step in cybersecurity awareness'
      },
      {
        stepNumber: 2,
        title: 'The CIA Triad',
        instruction: 'The CIA Triad is the foundation of cybersecurity:\n• Confidentiality — Protect data from unauthorized access (encryption, access controls)\n• Integrity — Ensure data remains accurate and unaltered (hashing, checksums)\n• Availability — Ensure systems are accessible when needed (redundancy, backups)\n\nLet\'s verify file integrity using checksums:',
        command: 'echo "secret data" > test_cia.txt && sha256sum test_cia.txt && echo "tampered" >> test_cia.txt && sha256sum test_cia.txt',
        expectedOutput: 'Two different hash values — showing integrity was broken',
        hint: 'When the hash changes, it means the file was modified — integrity violated!'
      },
      {
        stepNumber: 3,
        title: 'Types of Cybersecurity',
        instruction: 'Cybersecurity has many domains:\n• Network Security — Protecting network infrastructure\n• Application Security — Securing software applications\n• Cloud Security — Protecting cloud-based resources\n• Endpoint Security — Securing devices (laptops, phones)\n• Information Security — Protecting data at rest and in transit\n• IoT Security — Securing connected devices\n• Operational Security (OPSEC) — Protecting operational processes\n\nLet\'s explore network security by examining open ports:',
        command: 'netstat -tulpn 2>/dev/null || ss -tulpn',
        expectedOutput: 'List of listening ports and services',
        hint: 'Open ports are potential entry points for attackers'
      },
      {
        stepNumber: 4,
        title: 'Common Threats & Malware',
        instruction: 'Common cyber threats include:\n• Phishing — Deceptive emails/messages to steal credentials\n• Ransomware — Encrypts files and demands payment\n• Malware — Virus, Worm, Trojan, Spyware, Adware, Rootkit, Botnet\n• DDoS — Floods systems to deny service\n• Social Engineering — Manipulating people to reveal information\n• Insider Threats — Malicious or negligent employees\n• Password Attacks — Brute-force, dictionary, credential stuffing\n\nLet\'s see how password cracking works:',
        command: 'echo -n "password" | md5sum && echo -n "admin123" | md5sum',
        expectedOutput: 'MD5 hashes of common passwords',
        hint: 'Weak passwords can be cracked in seconds using rainbow tables or wordlists'
      },
      {
        stepNumber: 5,
        title: 'Types of Hackers',
        instruction: 'Hackers are categorized by intent:\n• White Hat — Ethical hackers who test security with authorization\n• Black Hat — Malicious hackers who exploit vulnerabilities illegally\n• Gray Hat — Hack without permission but without malicious intent\n• Script Kiddie — Uses pre-made tools without understanding them\n• Hacktivist — Hacks for political or social causes\n• Nation-State — Government-sponsored cyber attackers\n• Insider — Employee or contractor with system access\n\nAs ethical hackers, we always get written authorization first!',
        command: 'echo "I agree to only perform authorized security testing" > ethical_pledge.txt && cat ethical_pledge.txt',
        expectedOutput: 'Your ethical hacking pledge displayed',
        hint: 'Always get written permission before testing any system you do not own!'
      },
      {
        stepNumber: 6,
        title: 'Common Cyber Attacks',
        instruction: 'Understanding attack techniques helps you defend against them:\n• SQL Injection — Injecting malicious SQL into web forms\n• Cross-Site Scripting (XSS) — Injecting scripts into web pages\n• Man-in-the-Middle (MITM) — Intercepting communications\n• Buffer Overflow — Overwriting memory to execute code\n• DNS Spoofing — Redirecting domain lookups\n\nLet\'s check DNS resolution to understand how DNS works:',
        command: 'nslookup google.com 2>/dev/null || dig google.com',
        expectedOutput: 'DNS resolution showing IP address',
        hint: 'DNS translates domain names to IP addresses — spoofing this can redirect traffic'
      },
      {
        stepNumber: 7,
        title: 'Basic Networking',
        instruction: 'Essential networking concepts for cybersecurity:\n• IP Address — Unique identifier for devices on a network\n• DNS — Domain Name System (translates names to IPs)\n• HTTP/HTTPS — Web protocols (HTTPS adds encryption)\n• TCP/UDP — Transport protocols (TCP reliable, UDP fast)\n• Router — Routes traffic between networks\n• Firewall — Filters network traffic based on rules\n• VPN — Encrypted tunnel for secure communication\n\nLet\'s explore your network configuration:',
        command: 'ifconfig 2>/dev/null || ip addr show',
        expectedOutput: 'Network interfaces with IP addresses',
        hint: 'Your IP address identifies you on the network — attackers use this for targeting'
      },
      {
        stepNumber: 8,
        title: 'Security Principles',
        instruction: 'Core security principles to follow:\n• Least Privilege — Give minimum access needed\n• Defense in Depth — Multiple layers of security\n• Multi-Factor Authentication (MFA) — Multiple verification methods\n• Encryption — Protect data in transit and at rest\n• Regular Backups — Protect against data loss\n• Zero Trust — Never trust, always verify\n\nLet\'s check file permissions (Least Privilege):',
        command: 'ls -la /etc/passwd && ls -la /etc/shadow',
        expectedOutput: 'passwd is world-readable, shadow is restricted',
        hint: '/etc/shadow stores password hashes and has restricted permissions — Least Privilege in action!'
      },
      {
        stepNumber: 9,
        title: 'Ethical Hacking Basics',
        instruction: 'Ethical hacking (penetration testing) is authorized security testing to identify and report vulnerabilities responsibly. The methodology includes:\n1. Reconnaissance — Gather information about the target\n2. Scanning — Identify open ports and services\n3. Enumeration — Discover usernames, shares, services\n4. Exploitation — Attempt to gain access\n5. Post-Exploitation — Assess impact and maintain access\n6. Reporting — Document findings and recommendations\n\nLet\'s do basic reconnaissance:',
        command: 'nmap -sn 127.0.0.1 && echo "--- Recon complete ---"',
        expectedOutput: 'Host is up confirmation',
        hint: 'Reconnaissance is the first phase — always start with passive information gathering'
      },
      {
        stepNumber: 10,
        title: 'Cybersecurity Careers & Best Practices',
        instruction: 'Career paths in cybersecurity:\n• SOC Analyst — Monitor security events\n• Penetration Tester — Authorized security testing\n• Security Engineer — Build secure systems\n• DFIR (Digital Forensics & Incident Response) — Investigate breaches\n• Cloud Security Engineer — Secure cloud infrastructure\n• GRC (Governance, Risk, Compliance) — Policy and compliance\n\nBest Practices:\n✅ Use strong, unique passwords\n✅ Enable MFA everywhere\n✅ Keep systems updated\n✅ Regular backups\n✅ Use antivirus software\n✅ Secure browsing habits\n✅ Phishing awareness training',
        command: 'echo "Module 1 Complete! You now understand cybersecurity fundamentals." && echo "Next: Start hands-on labs with Kali Linux!"',
        expectedOutput: 'Completion message',
        hint: 'Continue to Module 2 to start hands-on hacking with Kali Linux!'
      }
    ]
  },
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
