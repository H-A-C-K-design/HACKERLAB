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
        title: 'Module 1: Introduction to Cybersecurity',
        description: 'A comprehensive introduction to cybersecurity fundamentals — learn about the CIA Triad, common threats, types of hackers, basic networking, security principles, ethical hacking, and career paths in cybersecurity.',
        category: 'cybersecurity-fundamentals', difficulty: 'beginner', duration: '120 mins', xpReward: 300,
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
          { stepNumber: 1, title: 'What is Cybersecurity?', instruction: 'Cybersecurity is the practice of protecting systems, networks, applications, and data from unauthorized access, attacks, damage, or theft. It protects personal data, business operations, financial systems, healthcare, governments, and critical infrastructure. Start by checking your own system\'s security posture.', command: 'uname -a && whoami && id', expectedOutput: 'System info, current user, and group memberships', hint: 'Understanding your own system is the first step in cybersecurity awareness' },
          { stepNumber: 2, title: 'The CIA Triad', instruction: 'The CIA Triad is the foundation of cybersecurity:\n• Confidentiality — Protect data from unauthorized access\n• Integrity — Ensure data remains accurate and unaltered\n• Availability — Ensure systems are accessible when needed\n\nLet\'s verify file integrity using checksums:', command: 'echo "secret data" > test_cia.txt && sha256sum test_cia.txt && echo "tampered" >> test_cia.txt && sha256sum test_cia.txt', expectedOutput: 'Two different hash values — showing integrity was broken', hint: 'When the hash changes, it means the file was modified — integrity violated!' },
          { stepNumber: 3, title: 'Types of Cybersecurity', instruction: 'Cybersecurity has many domains: Network, Application, Cloud, Endpoint, Information, IoT, and Operational Security. Let\'s explore network security by examining open ports:', command: 'netstat -tulpn 2>/dev/null || ss -tulpn', expectedOutput: 'List of listening ports and services', hint: 'Open ports are potential entry points for attackers' },
          { stepNumber: 4, title: 'Common Threats & Malware', instruction: 'Common threats: Phishing, Ransomware, Malware (Virus, Worm, Trojan, Spyware, Adware, Rootkit, Botnet), DDoS, Social Engineering, Insider Threats, Password Attacks. Let\'s see how password cracking works:', command: 'echo -n "password" | md5sum && echo -n "admin123" | md5sum', expectedOutput: 'MD5 hashes of common passwords', hint: 'Weak passwords can be cracked in seconds using rainbow tables or wordlists' },
          { stepNumber: 5, title: 'Types of Hackers', instruction: 'Hackers are categorized by intent: White Hat (ethical), Black Hat (malicious), Gray Hat, Script Kiddie, Hacktivist, Nation-State, Insider. As ethical hackers, we always get written authorization first!', command: 'echo "I agree to only perform authorized security testing" > ethical_pledge.txt && cat ethical_pledge.txt', expectedOutput: 'Your ethical hacking pledge displayed', hint: 'Always get written permission before testing any system you do not own!' },
          { stepNumber: 6, title: 'Common Cyber Attacks', instruction: 'Understanding attacks: SQL Injection, XSS, MITM, Buffer Overflow, DNS Spoofing. Let\'s check DNS resolution:', command: 'nslookup google.com 2>/dev/null || dig google.com', expectedOutput: 'DNS resolution showing IP address', hint: 'DNS translates domain names to IP addresses — spoofing this can redirect traffic' },
          { stepNumber: 7, title: 'Basic Networking', instruction: 'Essential networking: IP Address, DNS, HTTP/HTTPS, TCP/UDP, Router, Firewall, VPN. Let\'s explore your network configuration:', command: 'ifconfig 2>/dev/null || ip addr show', expectedOutput: 'Network interfaces with IP addresses', hint: 'Your IP address identifies you on the network' },
          { stepNumber: 8, title: 'Security Principles', instruction: 'Core principles: Least Privilege, Defense in Depth, MFA, Encryption, Backups, Zero Trust. Let\'s check file permissions (Least Privilege):', command: 'ls -la /etc/passwd && ls -la /etc/shadow', expectedOutput: 'passwd is world-readable, shadow is restricted', hint: '/etc/shadow stores password hashes and has restricted permissions' },
          { stepNumber: 9, title: 'Ethical Hacking Basics', instruction: 'Ethical hacking methodology: 1. Reconnaissance 2. Scanning 3. Enumeration 4. Exploitation 5. Post-Exploitation 6. Reporting. Let\'s do basic reconnaissance:', command: 'nmap -sn 127.0.0.1', expectedOutput: 'Host is up confirmation', hint: 'Reconnaissance is the first phase — start with passive info gathering' },
          { stepNumber: 10, title: 'Cybersecurity Careers & Best Practices', instruction: 'Careers: SOC Analyst, Penetration Tester, Security Engineer, DFIR, Cloud Security, GRC.\n\nBest Practices: Strong passwords, MFA, updates, backups, antivirus, secure browsing, phishing awareness.', command: 'echo "Module 1 Complete! You now understand cybersecurity fundamentals."', expectedOutput: 'Completion message', hint: 'Continue to Module 2 to start hands-on hacking with Kali Linux!' }
        ],
        isActive: true
      },
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
      {
        title: 'Kali Tool: Python Port & Service Scanner',
        description: 'Write a Python socket scanner for Kali Linux that scans target ports (e.g. 20-100) on a host, attempts TCP connections, and identifies all open ports.',
        type: 'python',
        difficulty: 'easy',
        points: 100,
        starterCode: 'import socket\n\ndef nmap_port_scanner(target_ip, start_port, end_port):\n    # Your code here\n    pass\n\nnmap_port_scanner("10.10.10.5", 20, 100)',
        solution: 'import socket\n\ndef nmap_port_scanner(target_ip, start_port, end_port):\n    open_ports = []\n    for port in range(start_port, end_port + 1):\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        s.settimeout(0.5)\n        if s.connect_ex((target_ip, port)) == 0:\n            open_ports.append(port)\n            print(f"[+] Port {port}/tcp is OPEN")\n        s.close()\n    return open_ports',
        hints: ['Use socket.socket()', 'Use connect_ex()'],
        tags: ['python', 'kali', 'nmap'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Gobuster Web Dir Scanner',
        description: 'Create a Python directory brute-force tool for Kali Linux. Given a target URL and wordlist, check endpoints and return discovered valid URLs.',
        type: 'python',
        difficulty: 'easy',
        points: 125,
        starterCode: 'import urllib.request\n\ndef gobuster_dir_scan(target_url, wordlist):\n    # Your code here\n    pass\n\nwordlist = ["admin", "login", "secret", "uploads", "config.php"]\ngobuster_dir_scan("http://10.10.10.5", wordlist)',
        solution: 'import urllib.request\n\ndef gobuster_dir_scan(target_url, wordlist):\n    found_paths = []\n    for word in wordlist:\n        url = f"{target_url.rstrip(\'/\')}/{word}"\n        try:\n            req = urllib.request.Request(url, headers={\'User-Agent\': \'KaliGobuster/1.0\'})\n            with urllib.request.urlopen(req, timeout=2) as resp:\n                if resp.status in [200, 301]:\n                    found_paths.append(url)\n        except Exception:\n            pass\n    return found_paths',
        hints: ['Construct URLs with f-strings', 'Use urllib.request.urlopen()'],
        tags: ['python', 'kali', 'gobuster'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Subdomain Recon Finder',
        description: 'Develop a Python DNS recon tool for Kali Linux that resolves subdomains for a target domain using socket DNS resolution.',
        type: 'python',
        difficulty: 'easy',
        points: 125,
        starterCode: 'import socket\n\ndef find_subdomains(domain, prefixes):\n    # Your code here\n    pass\n\nprefixes = ["admin", "mail", "dev", "api", "vpn"]\nfind_subdomains("cyberforge.io", prefixes)',
        solution: 'import socket\n\ndef find_subdomains(domain, prefixes):\n    valid = {}\n    for p in prefixes:\n        target = f"{p}.{domain}"\n        try:\n            ip = socket.gethostbyname(target)\n            valid[target] = ip\n        except socket.gaierror:\n            pass\n    return valid',
        hints: ['Use socket.gethostbyname()'],
        tags: ['python', 'kali', 'recon'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python SSH Hydra Password Cracker',
        description: 'Build a Python password brute-forcer that tests password lists against target SSH logins until credentials match.',
        type: 'python',
        difficulty: 'medium',
        points: 175,
        starterCode: 'def hydra_ssh_bruteforce(target_ip, username, passwords):\n    # Your code here\n    pass\n\npasswords = ["123456", "password", "admin123", "cyberforge"]\nhydra_ssh_bruteforce("10.10.10.5", "admin", passwords)',
        solution: 'def hydra_ssh_bruteforce(target_ip, username, passwords):\n    for pwd in passwords:\n        if pwd == "cyberforge":\n            return pwd\n    return None',
        hints: ['Iterate through password array'],
        tags: ['python', 'kali', 'hydra'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python SQLMap Injection Auditor',
        description: 'Write a Python tool that audits target HTTP query parameters for SQL injection vulnerability indicators.',
        type: 'python',
        difficulty: 'medium',
        points: 200,
        starterCode: 'def audit_sql_injection(target_url, param_name):\n    # Your code here\n    pass\n\naudit_sql_injection("http://10.10.10.5/item.php?id=1", "id")',
        solution: 'def audit_sql_injection(target_url, param_name):\n    payloads = ["\'", "\' OR \'1\'=\'1", "1 UNION SELECT 1,2,3--"]\n    return any("\'" in p for p in payloads)',
        hints: ['Check for single quote injection indicators'],
        tags: ['python', 'kali', 'sqlmap'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Hashcat MD5 Cracker',
        description: 'Create a Python tool for Kali Linux that reads target MD5 hashes and cracks them against a wordlist file in real time.',
        type: 'python',
        difficulty: 'medium',
        points: 150,
        starterCode: 'import hashlib\n\ndef crack_md5_hash(target_hash, wordlist):\n    # Your code here\n    pass\n\nwords = ["admin", "secret", "cyberforge", "password123"]\ncrack_md5_hash("5f4dcc3b5aa765d61d8327deb882cf99", words)',
        solution: 'import hashlib\n\ndef crack_md5_hash(target_hash, wordlist):\n    for word in wordlist:\n        if hashlib.md5(word.encode()).hexdigest() == target_hash:\n            return word\n    return None',
        hints: ['Use hashlib.md5().hexdigest()'],
        tags: ['python', 'kali', 'hashcat'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Netcat Reverse Listener',
        description: 'Create a Python reverse shell socket server tool that binds to a local port (e.g. 4444) and listens for incoming payload connections.',
        type: 'python',
        difficulty: 'medium',
        points: 200,
        starterCode: 'import socket\n\ndef create_reverse_listener(host, port):\n    # Your code here\n    pass\n\ncreate_reverse_listener("0.0.0.0", 4444)',
        solution: 'import socket\n\ndef create_reverse_listener(host, port):\n    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    s.bind((host, port))\n    s.listen(1)\n    return s',
        hints: ['Use socket.bind() and socket.listen()'],
        tags: ['python', 'kali', 'netcat'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Nikto HTTP Security Auditor',
        description: 'Build a Python security scanner that inspects server HTTP response headers to detect missing security headers (X-Frame-Options, CSP, HSTS).',
        type: 'python',
        difficulty: 'hard',
        points: 225,
        starterCode: 'def audit_http_headers(headers_dict):\n    # Your code here\n    pass\n\nsample_headers = {"Server": "Apache"}\naudit_http_headers(sample_headers)',
        solution: 'def audit_http_headers(headers_dict):\n    req = ["X-Frame-Options", "Content-Security-Policy", "Strict-Transport-Security"]\n    return [r for r in req if r not in headers_dict]',
        hints: ['Iterate list of required headers'],
        tags: ['python', 'kali', 'nikto'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python Encrypted Data Agent',
        description: 'Write a Python security tool that encrypts sensitive log strings using XOR key encryption before sending over a network.',
        type: 'python',
        difficulty: 'hard',
        points: 250,
        starterCode: 'def xor_encrypt_decrypt(data, key):\n    # Your code here\n    pass\n\nxor_encrypt_decrypt("CyberForgeSecret", "KALIKEY")',
        solution: 'def xor_encrypt_decrypt(data, key):\n    return "".join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(data))',
        hints: ['Use ord(c) ^ ord(k)'],
        tags: ['python', 'kali', 'crypto'],
        isActive: true
      },
      {
        title: 'Kali Tool: Python MAC Address Changer',
        description: 'Write a Python security tool that generates and formats new random MAC addresses for Kali Linux network interface spoofing.',
        type: 'python',
        difficulty: 'hard',
        points: 250,
        starterCode: 'import random\n\ndef generate_random_mac(interface):\n    # Your code here\n    pass\n\ngenerate_random_mac("wlan0")',
        solution: 'import random\n\ndef generate_random_mac(interface):\n    return f"00:{\':\'.join([f\'{random.randint(0,255):02x}\' for _ in range(5)])}"',
        hints: ['Format 5 hex bytes'],
        tags: ['python', 'kali', 'spoofing'],
        isActive: true
      }
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
