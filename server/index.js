const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();

// Initialize Firebase
const { db, auth } = require('./config/firebase');

// Honeypot
const { router: honeypotRouter, honeypotMiddleware } = require('./routes/honeypot');

const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);
// ── Allowed origins (set ALLOWED_ORIGINS in .env, comma-separated) ──
const rawOrigins = process.env.ALLOWED_ORIGINS || 'https://hackerlab-rho.vercel.app,http://localhost:3000,http://localhost:5000';
const ALLOWED_ORIGINS = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin header
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))) {
      return callback(null, true);
    }
    return callback(new Error('CORS request rejected: Origin not allowed'), false);
  },
  credentials: true
};

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.google.com', 'https://www.gstatic.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'ws:', 'wss:', 'http:', 'https:'],
      frameSrc: ["'self'", 'https://www.google.com', 'https://*.firebaseapp.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));

// ── Honeypot — must be registered BEFORE static files and SPA catch-all ──
app.use(honeypotMiddleware);
app.use('/api/honeypot', honeypotRouter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/public')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Strict rate limit on sensitive Auth routes (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use('/api/workshops', require('./routes/workshops'));
app.use('/api/events', require('./routes/events'));
app.use('/api/event-sessions', require('./routes/eventSessions'));

// Admin panel token verification — token via Authorization header only (never in URL)
app.get('/api/admin-access/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token && token === process.env.ADMIN_PANEL_TOKEN) {
    return res.json({ success: true });
  }
  res.status(403).json({ success: false, message: 'Forbidden' });
});

// JSON 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<!DOCTYPE html><html><head><title>CyberForge Academy</title></head><body><div id="app"></div><script src="/app.js"></script></body></html>');
  }
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message || err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? (err.message || 'Internal Server Error') : 'An internal server error occurred'
  });
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
  const c = cmd.toLowerCase().trim();
  if (c.startsWith('git clone')) {
    const repo = c.split(' ')[2] || 'repository';
    return `Cloning into '${repo}'...\nremote: Enumerating objects: 12450, done.\nremote: Counting objects: 100% (1450/1450), done.\nReceiving objects: 100% (12450/12450), 24.50 MiB, done.\nResolving deltas: 100% (8900/8900), done.\n[+] Repository '${repo}' successfully cloned.`;
  }
  if (c.startsWith('apt install') || c.startsWith('apt-get install')) {
    const pkg = c.split(' ')[2] || 'tool';
    return `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed: ${pkg}\nUnpacking ${pkg} ...\nSetting up ${pkg} ...\n[+] Package '${pkg}' installed in /usr/bin/${pkg}.`;
  }
  if (c.startsWith('nmap')) {
    return `Starting Nmap 7.94 at ${new Date().toLocaleTimeString()}\nNmap scan report for 10.10.10.5\nHost is up (0.0012s latency).\nPORT     STATE SERVICE VERSION\n21/tcp   open  ftp     vsftpd 2.3.4 (VULNERABLE)\n22/tcp   open  ssh     OpenSSH 8.4p1 Debian 5\n80/tcp   open  http    Apache httpd 2.4.51\n3306/tcp open  mysql   MySQL 8.0.27\nNmap done: 1 IP address (1 host up) scanned in 2.84 seconds`;
  }
  if (c.startsWith('gobuster') || c.startsWith('dirb')) {
    return `Gobuster v3.6 - Directory Brute-forcing Engine\n[+] Url: http://10.10.10.5\n/admin (Status: 200) [Size: 4512]\n/login (Status: 200) [Size: 2150]\n/secret (Status: 301) [Size: 180]\n/flag.php (Status: 200) [Size: 64]\nFinished scanning in 1.25s`;
  }
  if (c.startsWith('sqlmap')) {
    return `[+] GET parameter 'id' is VULNERABLE to SQL injection!\n[*] Database: cyber_db\n+----+----------+----------------------------------+----------------------------------+\n| id | username | password_hash                    | flag                             |\n+----+----------+----------------------------------+----------------------------------+\n| 1  | admin    | 5f4dcc3b5aa765d61d8327deb882cf99 | CyberForge{sql_1nj3ct10n_m4st3r} |\n+----+----------+----------------------------------+----------------------------------+`;
  }
  if (c.startsWith('hydra')) {
    return `Hydra v9.5 - Realtime Brute-force Engine\n[ATTACK] attacking ssh://10.10.10.5:22/\n[22][ssh] host: 10.10.10.5   login: admin   password: cyberforge\n✓ 1 password found`;
  }
  if (c.startsWith('msfconsole') || c.startsWith('metasploit')) {
    return `─────────────【 METASPLOIT FRAMEWORK v6.3.4 】─────────────\nmsf6 > `;
  }

  const commands = {
    'ls': 'Desktop  Documents  Downloads  Tools  ctf_workspace  wordlists',
    'ls -la': `total 48\ndrwxr-xr-x 8 kali kali 4096 Jan 01 10:00 .\ndrwxr-xr-x 3 root root 4096 Jan 01 09:00 ..\n-rw-r--r-- 1 kali kali  220 Jan 01 09:00 .bash_logout\n-rw-r--r-- 1 kali kali 3526 Jan 01 09:00 .bashrc\ndrwxr-xr-x 2 kali kali 4096 Jan 01 10:00 Desktop\ndrwxr-xr-x 2 kali kali 4096 Jan 01 10:00 Tools`,
    'pwd': '/home/kali',
    'whoami': 'kali',
    'id': 'uid=1000(kali) gid=1000(kali) groups=1000(kali),24(cdrom),25(floppy),27(sudo),29(audio)',
    'uname -a': 'Linux kali 6.6.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.13-1kali1 (2026-01-15) x86_64 GNU/Linux',
    'ifconfig': `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 10.10.14.2  netmask 255.255.255.0  broadcast 10.10.14.255`,
    'help': 'Available Kali Linux commands:\nNavigation: ls, pwd, cd, mkdir, touch, cat, echo, rm, nano\nInstaller: git clone <url>, apt install <pkg>\nScanners: nmap, gobuster, sqlmap, hydra, hashcat, nikto, msfconsole',
    'clear': 'CLEAR_TERMINAL'
  };

  return commands[c] || `bash: ${cmd}: command not found in simulation mode\nTip: Type 'help' to see available commands`;
}

// Export for Vercel serverless; also listen locally
const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => console.log(`🚀 CyberForge Server running on port ${PORT}`));
}

module.exports = app;
