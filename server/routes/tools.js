const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Cybersecurity tools database
const toolsDatabase = [
  {
    id: 1, name: 'Nmap', category: 'network', difficulty: 'beginner',
    description: 'Network exploration tool and security auditing. Used for host discovery, port scanning, and service detection.',
    install: 'sudo apt install nmap',
    usage: 'nmap [options] target',
    examples: [
      { cmd: 'nmap 192.168.1.1', desc: 'Basic scan' },
      { cmd: 'nmap -sV -sC 192.168.1.1', desc: 'Version + script scan' },
      { cmd: 'nmap -A -T4 192.168.1.0/24', desc: 'Aggressive network scan' },
      { cmd: 'nmap -p- 192.168.1.1', desc: 'All ports scan' },
      { cmd: 'nmap -sU -p 53,161 192.168.1.1', desc: 'UDP scan' }
    ],
    tags: ['scanning', 'network', 'reconnaissance'], icon: '🔍'
  },
  {
    id: 2, name: 'Metasploit', category: 'exploitation', difficulty: 'advanced',
    description: 'World\'s most used penetration testing framework. Contains hundreds of exploits, payloads, and auxiliary modules.',
    install: 'sudo apt install metasploit-framework',
    usage: 'msfconsole',
    examples: [
      { cmd: 'msfconsole', desc: 'Start Metasploit console' },
      { cmd: 'search exploit ms17-010', desc: 'Search for EternalBlue' },
      { cmd: 'use exploit/windows/smb/ms17_010_eternalblue', desc: 'Load exploit' },
      { cmd: 'set RHOSTS 192.168.1.5', desc: 'Set target' },
      { cmd: 'set LHOST 192.168.1.100 && run', desc: 'Set listener and exploit' }
    ],
    tags: ['exploitation', 'pentest', 'framework'], icon: '💀'
  },
  {
    id: 3, name: 'Hydra', category: 'password', difficulty: 'intermediate',
    description: 'Fast and flexible online password cracking tool supporting 50+ protocols.',
    install: 'sudo apt install hydra',
    usage: 'hydra [options] target service',
    examples: [
      { cmd: 'hydra -l admin -P rockyou.txt ssh://192.168.1.1', desc: 'SSH brute force' },
      { cmd: 'hydra -L users.txt -P pass.txt ftp://192.168.1.1', desc: 'FTP brute force' },
      { cmd: 'hydra -l admin -P rockyou.txt http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"', desc: 'Web form attack' }
    ],
    tags: ['password', 'brute-force', 'authentication'], icon: '🔑'
  },
  {
    id: 4, name: 'Hashcat', category: 'password', difficulty: 'intermediate',
    description: 'World\'s fastest password cracker. Supports GPU acceleration and 350+ hash types.',
    install: 'sudo apt install hashcat',
    usage: 'hashcat [options] hashfile wordlist',
    examples: [
      { cmd: 'hashcat -m 0 hash.txt rockyou.txt', desc: 'MD5 dictionary attack' },
      { cmd: 'hashcat -m 1000 ntlm.txt rockyou.txt', desc: 'NTLM crack' },
      { cmd: 'hashcat -m 1800 sha512.txt rockyou.txt', desc: 'SHA-512 crack' },
      { cmd: 'hashcat -m 0 -a 3 hash.txt ?a?a?a?a?a?a', desc: 'Brute force 6 chars' }
    ],
    tags: ['password', 'hash', 'cracking'], icon: '🔓'
  },
  {
    id: 5, name: 'Burp Suite', category: 'web', difficulty: 'intermediate',
    description: 'Leading web application security testing platform. Intercept, analyze, and manipulate HTTP traffic.',
    install: 'sudo apt install burpsuite',
    usage: 'burpsuite (GUI application)',
    examples: [
      { cmd: 'Set browser proxy to 127.0.0.1:8080', desc: 'Configure browser proxy' },
      { cmd: 'Intercept > Forward', desc: 'Intercept HTTP requests' },
      { cmd: 'Repeater > Send', desc: 'Manually modify and replay requests' },
      { cmd: 'Intruder > Sniper attack', desc: 'Automated fuzzing' },
      { cmd: 'Scanner > Active scan', desc: 'Automated vulnerability scan' }
    ],
    tags: ['web', 'proxy', 'intercept'], icon: '🕷️'
  },
  {
    id: 6, name: 'John the Ripper', category: 'password', difficulty: 'beginner',
    description: 'Classic password cracker. Supports hundreds of hash types and encryption methods.',
    install: 'sudo apt install john',
    usage: 'john [options] hashfile',
    examples: [
      { cmd: 'john hash.txt', desc: 'Auto-detect and crack' },
      { cmd: 'john --wordlist=rockyou.txt hash.txt', desc: 'Dictionary attack' },
      { cmd: 'john --format=md5crypt hash.txt', desc: 'Specific format' },
      { cmd: 'john --show hash.txt', desc: 'Show cracked passwords' },
      { cmd: 'unshadow /etc/passwd /etc/shadow > hashes.txt', desc: 'Combine shadow files' }
    ],
    tags: ['password', 'hash', 'cracking'], icon: '🔐'
  },
  {
    id: 7, name: 'Wireshark', category: 'network', difficulty: 'beginner',
    description: 'Network protocol analyzer. Capture and analyze network packets in real time.',
    install: 'sudo apt install wireshark',
    usage: 'wireshark (GUI) or tshark (CLI)',
    examples: [
      { cmd: 'wireshark', desc: 'Open GUI' },
      { cmd: 'tshark -i eth0 -w capture.pcap', desc: 'Capture to file' },
      { cmd: 'tshark -r capture.pcap -Y http', desc: 'Filter HTTP traffic' },
      { cmd: 'tshark -r capture.pcap -T fields -e http.request.uri', desc: 'Extract URIs' }
    ],
    tags: ['network', 'packet', 'analysis'], icon: '🦈'
  },
  {
    id: 8, name: 'SQLMap', category: 'web', difficulty: 'intermediate',
    description: 'Automatic SQL injection tool. Detects and exploits SQL injection vulnerabilities.',
    install: 'sudo apt install sqlmap',
    usage: 'sqlmap [options] -u URL',
    examples: [
      { cmd: "sqlmap -u 'http://target.com/page?id=1' --dbs", desc: 'Find databases' },
      { cmd: "sqlmap -u 'http://target.com/page?id=1' -D dbname --tables", desc: 'List tables' },
      { cmd: "sqlmap -u 'http://target.com/page?id=1' -D dbname -T users --dump", desc: 'Dump table' },
      { cmd: "sqlmap -u 'http://target.com/login' --data='user=a&pass=b' --level=5", desc: 'POST form attack' }
    ],
    tags: ['web', 'sql', 'injection'], icon: '💉'
  },
  {
    id: 9, name: 'Aircrack-ng', category: 'wireless', difficulty: 'intermediate',
    description: 'Complete suite of WiFi security tools. WEP/WPA/WPA2 auditing toolkit.',
    install: 'sudo apt install aircrack-ng',
    usage: 'aircrack-ng [options] capture.cap',
    examples: [
      { cmd: 'airmon-ng start wlan0', desc: 'Enable monitor mode' },
      { cmd: 'airodump-ng wlan0mon', desc: 'Scan for networks' },
      { cmd: 'airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon', desc: 'Capture handshake' },
      { cmd: 'aircrack-ng -w rockyou.txt capture.cap', desc: 'Crack WPA password' }
    ],
    tags: ['wireless', 'wifi', 'wpa'], icon: '📡'
  },
  {
    id: 10, name: 'Nikto', category: 'web', difficulty: 'beginner',
    description: 'Web server vulnerability scanner. Checks for dangerous files, outdated software, and misconfigurations.',
    install: 'sudo apt install nikto',
    usage: 'nikto -h target',
    examples: [
      { cmd: 'nikto -h http://192.168.1.1', desc: 'Basic scan' },
      { cmd: 'nikto -h http://192.168.1.1 -p 8080', desc: 'Custom port' },
      { cmd: 'nikto -h http://192.168.1.1 -o results.html -Format htm', desc: 'Save HTML report' },
      { cmd: 'nikto -h http://192.168.1.1 -Plugins headers', desc: 'Check security headers' }
    ],
    tags: ['web', 'scanner', 'vulnerabilities'], icon: '🔭'
  },
  {
    id: 11, name: 'Gobuster', category: 'web', difficulty: 'beginner',
    description: 'Directory/file brute-forcer for web applications. Also supports DNS and virtual host discovery.',
    install: 'sudo apt install gobuster',
    usage: 'gobuster dir -u URL -w wordlist',
    examples: [
      { cmd: 'gobuster dir -u http://target.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt', desc: 'Directory scan' },
      { cmd: 'gobuster dns -d target.com -w subdomains.txt', desc: 'Subdomain enum' },
      { cmd: 'gobuster dir -u http://target.com -w wordlist.txt -x php,html,txt', desc: 'File extension scan' }
    ],
    tags: ['web', 'directory', 'enumeration'], icon: '🔎'
  },
  {
    id: 12, name: 'Steghide', category: 'forensics', difficulty: 'beginner',
    description: 'Steganography tool to hide/extract data in images and audio files.',
    install: 'sudo apt install steghide',
    usage: 'steghide embed/extract -sf file',
    examples: [
      { cmd: 'steghide embed -cf image.jpg -sf secret.txt -p password', desc: 'Hide data in image' },
      { cmd: 'steghide extract -sf image.jpg -p password', desc: 'Extract hidden data' },
      { cmd: 'steghide info image.jpg', desc: 'Check for hidden data' },
      { cmd: 'stegcracker image.jpg rockyou.txt', desc: 'Crack steghide password' }
    ],
    tags: ['forensics', 'steganography', 'hidden'], icon: '🖼️'
  }
];

router.get('/', protect, async (req, res) => {
  const { category, search } = req.query;
  let tools = toolsDatabase;
  if (category && category !== 'all') tools = tools.filter(t => t.category === category);
  if (search) tools = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));
  res.json({ success: true, tools });
});

router.get('/:id', protect, async (req, res) => {
  const tool = toolsDatabase.find(t => t.id === parseInt(req.params.id));
  if (!tool) return res.status(404).json({ success: false, message: 'Tool not found' });
  res.json({ success: true, tool });
});

module.exports = router;
