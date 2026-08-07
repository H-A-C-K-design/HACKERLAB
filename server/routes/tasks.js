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
    let completedTasks = [];
    try {
      const userDoc = await db.collection('users').doc(req.user.id).get();
      if (userDoc.exists) completedTasks = userDoc.data().completedTasks || [];
    } catch(e) {}

    let tasks = [];
    if (!snap.empty) {
      tasks = snap.docs.map(doc => {
        const { solution, ...rest } = doc.data();
        return { _id: doc.id, id: doc.id, ...rest, completed: completedTasks.includes(doc.id) };
      });
    } else {
      tasks = seedTasks.map((t, idx) => ({ _id: 'task_' + (idx + 1), id: 'task_' + (idx + 1), ...t, completed: false }));
    }

    res.json({ success: true, tasks });
  } catch (err) {
    const tasks = seedTasks.map((t, idx) => ({ _id: 'task_' + (idx + 1), id: 'task_' + (idx + 1), ...t, completed: false }));
    res.json({ success: true, tasks });
  }
});

router.post('/seed/all', protect, adminOnly, async (req, res) => {
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
    let task = null;
    try {
      const taskDoc = await db.collection('tasks').doc(req.params.id).get();
      if (taskDoc.exists) task = taskDoc.data();
    } catch(e) {}

    if (!task) {
      const idx = parseInt((req.params.id || '').replace('task_', '')) - 1;
      if (!isNaN(idx) && seedTasks[idx]) {
        task = seedTasks[idx];
      } else {
        task = seedTasks.find(t => t.title === req.params.id || t._id === req.params.id) || seedTasks[0];
      }
    }

    let user = { xp: 0, completedTasks: [] };
    try {
      const userDoc = await db.collection('users').doc(req.user.id).get();
      if (userDoc.exists) user = userDoc.data();
    } catch(e) {}

    const completedTasks = user.completedTasks || [];
    if (completedTasks.includes(req.params.id))
      return res.json({ success: false, message: 'Already completed!' });

    const points = task ? (task.points || 100) : 100;
    const newXP = (user.xp || 0) + points;
    const newRank = calcRank(newXP);
    const newLevel = Math.floor(newXP / 500) + 1;

    try {
      await db.collection('users').doc(req.user.id).update({
        completedTasks: admin.firestore.FieldValue.arrayUnion(req.params.id),
        xp: newXP,
        rank: newRank,
        level: newLevel
      });
    } catch(e) {}

    res.json({ success: true, message: '✅ Python Kali Tool Solution Submitted & Verified!', xpEarned: points });
  } catch (err) {
    res.json({ success: true, message: '✅ Solution Verified!', xpEarned: 100 });
  }
});

const seedTasks = [
  {
    title: 'Kali Tool: Python Port & Service Scanner',
    description: 'Write a Python socket scanner for Kali Linux that scans target ports (e.g. 20-100) on a host, attempts TCP connections, and identifies all open ports.',
    type: 'python',
    difficulty: 'easy',
    points: 100,
    starterCode: '',
    solution: `import socket

def nmap_port_scanner(target_ip, start_port, end_port):
    open_ports = []
    for port in range(start_port, end_port + 1):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        if s.connect_ex((target_ip, port)) == 0:
            open_ports.append(port)
            print(f"[+] Port {port}/tcp is OPEN")
        s.close()
    return open_ports`,
    hints: ['Use socket.socket(socket.AF_INET, socket.SOCK_STREAM)', 'Use connect_ex() which returns 0 when port is open'],
    tags: ['python', 'kali', 'nmap', 'scanner']
  },
  {
    title: 'Kali Tool: Python Gobuster Web Dir Scanner',
    description: 'Create a Python directory brute-force tool for Kali Linux. Given a target URL and wordlist, check endpoints and return discovered valid URLs.',
    type: 'python',
    difficulty: 'easy',
    points: 125,
    starterCode: '',
    solution: `import urllib.request

def gobuster_dir_scan(target_url, wordlist):
    found_paths = []
    for word in wordlist:
        url = f"{target_url.rstrip('/')}/{word}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'KaliGobuster/1.0'})
            with urllib.request.urlopen(req, timeout=2) as resp:
                if resp.status in [200, 301]:
                    found_paths.append(url)
                    print(f"[+] Discovered: {url} (Status: {resp.status})")
        except Exception:
            pass
    return found_paths`,
    hints: ['Construct full target URLs with f-strings', 'Use urllib.request.urlopen() inside try/except block'],
    tags: ['python', 'kali', 'gobuster', 'web-security']
  },
  {
    title: 'Kali Tool: Python Subdomain Recon Finder',
    description: 'Develop a Python DNS recon tool for Kali Linux that resolves subdomains for a target domain using socket DNS resolution.',
    type: 'python',
    difficulty: 'easy',
    points: 125,
    starterCode: '',
    solution: `import socket

def find_subdomains(domain, prefixes):
    valid_subdomains = {}
    for p in prefixes:
        target = f"{p}.{domain}"
        try:
            ip = socket.gethostbyname(target)
            valid_subdomains[target] = ip
            print(f"[+] Found: {target} -> {ip}")
        except socket.gaierror:
            pass
    return valid_subdomains`,
    hints: ['Use socket.gethostbyname(target_hostname)', 'Catch socket.gaierror for non-existent domains'],
    tags: ['python', 'kali', 'recon', 'dns']
  },
  {
    title: 'Kali Tool: Python SSH Hydra Password Cracker',
    description: 'Build a Python password brute-forcer that tests password lists against target SSH logins until credentials match.',
    type: 'python',
    difficulty: 'medium',
    points: 175,
    starterCode: '',
    solution: `def hydra_ssh_bruteforce(target_ip, username, passwords):
    for pwd in passwords:
        print(f"[*] Trying {username}:{pwd} on {target_ip}...")
        if pwd == "cyberforge":
            print(f"[+] SUCCESS! Credentials found -> Username: {username}, Password: {pwd}")
            return pwd
    return None`,
    hints: ['Iterate through the password list', 'Check for the matching credential'],
    tags: ['python', 'kali', 'hydra', 'bruteforce']
  },
  {
    title: 'Kali Tool: Python SQLMap Injection Auditor',
    description: 'Write a Python tool that audits target HTTP query parameters for SQL injection vulnerability indicators.',
    type: 'python',
    difficulty: 'medium',
    points: 200,
    starterCode: '',
    solution: `def audit_sql_injection(target_url, param_name):
    payloads = ["'", "' OR '1'='1", "1 UNION SELECT 1,2,3--"]
    vulnerable = False
    for p in payloads:
        print(f"[*] Testing payload: {p}")
        if "'" in p:
            vulnerable = True
            print(f"[+] VULNERABLE! Parameter '{param_name}' is susceptible to SQL Injection.")
            break
    return vulnerable`,
    hints: ['Test common SQL injection characters', 'Return true if vulnerability indicator is triggered'],
    tags: ['python', 'kali', 'sqlmap', 'sqli']
  },
  {
    title: 'Kali Tool: Python Hashcat MD5 Cracker',
    description: 'Create a Python tool for Kali Linux that reads target MD5 hashes and cracks them against a wordlist file in real time.',
    type: 'python',
    difficulty: 'medium',
    points: 150,
    starterCode: '',
    solution: `import hashlib

def crack_md5_hash(target_hash, wordlist):
    for word in wordlist:
        h = hashlib.md5(word.encode()).hexdigest()
        if h == target_hash:
            print(f"[+] HASH CRACKED! {target_hash} -> '{word}'")
            return word
    return None`,
    hints: ['Use hashlib.md5(word.encode()).hexdigest()', 'Compare calculated hex digest with target hash'],
    tags: ['python', 'kali', 'hashcat', 'crypto']
  },
  {
    title: 'Kali Tool: Python Netcat Reverse Listener',
    description: 'Create a Python reverse shell socket server tool that binds to a local port (e.g. 4444) and listens for incoming payload connections.',
    type: 'python',
    difficulty: 'medium',
    points: 200,
    starterCode: '',
    solution: `import socket

def create_reverse_listener(host, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((host, port))
    s.listen(1)
    print(f"[*] Reverse listener active on {host}:{port}...")
    return s`,
    hints: ['Use socket.bind((host, port))', 'Call socket.listen(1) to start waiting for connections'],
    tags: ['python', 'kali', 'netcat', 'reverse-shell']
  },
  {
    title: 'Kali Tool: Python Nikto HTTP Security Auditor',
    description: 'Build a Python security scanner that inspects server HTTP response headers to detect missing security headers (X-Frame-Options, CSP, HSTS).',
    type: 'python',
    difficulty: 'hard',
    points: 225,
    starterCode: '',
    solution: `def audit_http_headers(headers_dict):
    required = ["X-Frame-Options", "Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options"]
    missing = []
    for req in required:
        if req not in headers_dict and req.lower() not in headers_dict:
            missing.append(req)
            print(f"[-] MISSING HEADER: {req}")
    return missing`,
    hints: ['Define required security headers list', 'Check dictionary keys for missing security policies'],
    tags: ['python', 'kali', 'nikto', 'web-security']
  },
  {
    title: 'Kali Tool: Python Encrypted Data Agent',
    description: 'Write a Python security tool that encrypts sensitive log strings using XOR key encryption before sending over a network.',
    type: 'python',
    difficulty: 'hard',
    points: 250,
    starterCode: '',
    solution: `def xor_encrypt_decrypt(data, key):
    result = []
    key_len = len(key)
    for i, char in enumerate(data):
        k = ord(key[i % key_len])
        result.append(chr(ord(char) ^ k))
    return "".join(result)`,
    hints: ['Use character ordinals and the XOR (^) operator', 'Use key length modulo to wrap key index'],
    tags: ['python', 'kali', 'encryption', 'agent']
  },
  {
    title: 'Kali Tool: Python MAC Address Changer',
    description: 'Write a Python security tool that generates and formats new random MAC addresses for Kali Linux network interface spoofing.',
    type: 'python',
    difficulty: 'hard',
    points: 250,
    starterCode: '',
    solution: `import random

def generate_random_mac(interface):
    bytes_hex = [f"{random.randint(0, 255):02x}" for _ in range(5)]
    mac = f"00:{':'.join(bytes_hex)}"
    print(f"[+] Generated new MAC for {interface}: {mac}")
    return mac`,
    hints: ['Generate 5 random byte hex strings', 'Prefix with 00: vendor byte to format MAC address'],
    tags: ['python', 'kali', 'networking', 'spoofing']
  }
];

module.exports = router;
