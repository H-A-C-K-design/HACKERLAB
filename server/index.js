const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

// Initialize Firebase
const { db, auth } = require('./config/firebase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/public')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/labs', require('./routes/labs'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/admin', require('./routes/admin'));

// Admin panel token verification
app.get('/api/admin-access/verify', (req, res) => {
  const { token } = req.query;
  if (token === process.env.ADMIN_PANEL_TOKEN) {
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: 'Not found' });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Socket.io for real-time terminal simulation
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('terminal-command', (data) => {
    const output = simulateTerminal(data.command, data.context);
    socket.emit('terminal-output', { output, command: data.command });
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Simulated terminal engine
function simulateTerminal(cmd, context = 'kali') {
  const commands = {
    'ls': 'Desktop  Documents  Downloads  Tools  ctf_workspace  wordlists',
    'ls -la': `total 48\ndrwxr-xr-x 8 kali kali 4096 Jan 01 10:00 .\ndrwxr-xr-x 3 root root 4096 Jan 01 09:00 ..\n-rw-r--r-- 1 kali kali  220 Jan 01 09:00 .bash_logout\n-rw-r--r-- 1 kali kali 3526 Jan 01 09:00 .bashrc\ndrwxr-xr-x 2 kali kali 4096 Jan 01 10:00 Desktop\ndrwxr-xr-x 2 kali kali 4096 Jan 01 10:00 Tools`,
    'pwd': '/home/kali',
    'whoami': 'kali',
    'id': 'uid=1000(kali) gid=1000(kali) groups=1000(kali),24(cdrom),25(floppy),27(sudo),29(audio)',
    'uname -a': 'Linux kali 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.27-1kali1 (2023-05-12) x86_64 GNU/Linux',
    'ifconfig': `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 00:0c:29:xx:xx:xx  txqueuelen 1000  (Ethernet)\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`,
    'nmap --help': 'Nmap 7.94 ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}\n  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans\n  -sU: UDP Scan\n  -sV: Probe open ports to determine service/version info\n  -O: Enable OS detection\n  -A: Enable OS detection, version detection, script scanning',
    'nmap -sV 192.168.1.1': `Starting Nmap 7.94\nNmap scan report for 192.168.1.1\nHost is up (0.0010s latency).\nPORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.4p1\n80/tcp open  http    Apache httpd 2.4.51\n443/tcp open https   nginx 1.21.0\nNmap done: 1 IP address (1 host up) scanned in 3.21 seconds`,
    'metasploit': '⚠️  Metasploit Framework - Use only on authorized systems!\nmsf6 > ',
    'hydra --help': 'Hydra v9.4 (c) 2022 by van Hauser/THC\nSyntax: hydra [options] target service\n  -l LOGIN : single login name\n  -L FILE  : login file with several logins\n  -p PASS  : single password\n  -P FILE  : password file\n  -t TASKS : run TASKS number of connects in parallel',
    'hashcat --help': 'hashcat (v6.2.6) starting in help mode\nUsage: hashcat [options]... hash|hashfile|hccapxfile [dictionary|mask|directory]...\n  -m : Hash type (0=MD5, 100=SHA1, 1800=sha512crypt)\n  -a : Attack mode (0=dict, 1=combo, 3=brute)',
    'help': 'Available commands: ls, pwd, whoami, id, uname -a, ifconfig, nmap, metasploit, hydra, hashcat, clear\nType any command to simulate Kali Linux terminal',
    'clear': 'CLEAR_TERMINAL'
  };
  return commands[cmd.toLowerCase().trim()] ||
    `bash: ${cmd}: command not found in simulation mode\nTip: Type 'help' to see available commands`;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 CyberForge Server running on port ${PORT}`));
