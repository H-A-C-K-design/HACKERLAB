// ======================================================
// CyberForge Academy - Main Application
// ======================================================
const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
let state = {
  user: null, token: null, page: 'home',
  challenges: [], labs: [], tools: [], learningModules: [],
  leaderboard: [], tasks: [],
  selectedChallenge: null, selectedLab: null, selectedTool: null,
  selectedModule: null,
  challengeFilter: 'all', toolFilter: 'all',
  terminalHistory: [], terminalInput: '',
  socket: null
};

// ---- helpers ----
const $ = id => document.getElementById(id);
const html = (el, content) => { if(el) el.innerHTML = content; };
const show = id => { const e=$(id); if(e) e.style.display=''; };
const hide = id => { const e=$(id); if(e) e.style.display='none'; };
const getToken = () => localStorage.getItem('cf_token');
const getUser = () => { try { return JSON.parse(localStorage.getItem('cf_user')); } catch { return null; } };

async function api(endpoint, method='GET', body=null) {
  const opts = { method, headers: { 'Content-Type':'application/json' } };
  const token = getToken();
  if(token) opts.headers['Authorization'] = 'Bearer ' + token;
  if(body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(API + endpoint, opts);
    return await res.json();
  } catch(err) {
    return { success: false, message: 'Connection error. Is the server running?' };
  }
}

// ---- RENDER MAIN ----
function render() {
  const app = document.getElementById('app');
  state.token = getToken();
  state.user = getUser();

  if (!state.token) {
    // Always show home page with optional auth modal
    if (state.page === 'register') {
      app.innerHTML = renderHomePage('register');
    } else if (state.page === 'login') {
      app.innerHTML = renderHomePage('login');
    } else {
      app.innerHTML = renderHomePage(null);
    }
    attachAuthEvents();
    return;
  }

  if (state.page === 'home') { app.innerHTML = renderDashboardLayout(renderDashboard()); attachNavEvents(); loadDashboardData(); }
  else if (state.page === 'challenges') { app.innerHTML = renderDashboardLayout(renderChallengesPage()); attachNavEvents(); loadChallenges(); }
  else if (state.page === 'labs') { app.innerHTML = renderDashboardLayout(renderLabsPage()); attachNavEvents(); loadLabs(); }
  else if (state.page === 'tools') { app.innerHTML = renderDashboardLayout(renderToolsPage()); attachNavEvents(); loadTools(); }
  else if (state.page === 'terminal') { app.innerHTML = renderDashboardLayout(renderTerminalPage()); attachNavEvents(); initTerminal(); }
  else if (state.page === 'learning') { app.innerHTML = renderDashboardLayout(renderLearningPage()); attachNavEvents(); loadLearning(); }
  else if (state.page === 'leaderboard') { app.innerHTML = renderDashboardLayout(renderLeaderboardPage()); attachNavEvents(); loadLeaderboard(); }
  else if (state.page === 'tasks') { app.innerHTML = renderDashboardLayout(renderTasksPage()); attachNavEvents(); loadTasks(); }
}

// ---- NAVBAR ----
function renderNavbar() {
  const u = state.user;
  return `<nav class="navbar">
    <div class="logo" onclick="navigate('home')">CYBER<span>FORGE</span> <small style="font-size:0.6rem;color:#555;font-family:Rajdhani">ACADEMY</small></div>
    <div class="nav-links">
      <button class="nav-btn ${state.page==='home'?'active':''}" onclick="navigate('home')"><i class="fas fa-tachometer-alt"></i> Dashboard</button>
      <button class="nav-btn ${state.page==='challenges'?'active':''}" onclick="navigate('challenges')"><i class="fas fa-flag"></i> Challenges</button>
      <button class="nav-btn ${state.page==='labs'?'active':''}" onclick="navigate('labs')"><i class="fas fa-flask"></i> Labs</button>
      <button class="nav-btn ${state.page==='tools'?'active':''}" onclick="navigate('tools')"><i class="fas fa-tools"></i> Tools</button>
      <button class="nav-btn ${state.page==='learning'?'active':''}" onclick="navigate('learning')"><i class="fas fa-book"></i> Learn</button>
      <button class="nav-btn ${state.page==='terminal'?'active':''}" onclick="navigate('terminal')"><i class="fas fa-terminal"></i> Terminal</button>
      <button class="nav-btn ${state.page==='tasks'?'active':''}" onclick="navigate('tasks')"><i class="fas fa-code"></i> Tasks</button>
      <button class="nav-btn ${state.page==='leaderboard'?'active':''}" onclick="navigate('leaderboard')"><i class="fas fa-trophy"></i> Board</button>
    </div>
    <div class="nav-user">
      <span class="xp-badge"><i class="fas fa-star" style="color:#ffcc00"></i> ${u?u.xp||0:0} XP</span>
      <span class="rank-badge">🎖️ ${u?u.rank||'Script Kiddie':'Guest'}</span>
      <button class="btn btn-red" style="padding:0.4rem 1rem;font-size:0.85rem" onclick="logout()">Logout</button>
    </div>
  </nav>`;
}

function renderSidebar() {
  const items = [
    { page:'home', icon:'fa-tachometer-alt', label:'Dashboard' },
    { page:'challenges', icon:'fa-flag', label:'CTF Challenges' },
    { page:'labs', icon:'fa-flask', label:'Hacking Labs' },
    { page:'tools', icon:'fa-tools', label:'Security Tools' },
    { page:'learning', icon:'fa-book-open', label:'Learn Hacking' },
    { page:'terminal', icon:'fa-terminal', label:'Live Terminal' },
    { page:'tasks', icon:'fa-code', label:'Coding Tasks' },
    { page:'leaderboard', icon:'fa-trophy', label:'Leaderboard' },
  ];
  return `<div class="sidebar">${items.map(i => `<div class="sidebar-item ${state.page===i.page?'active':''}" onclick="navigate('${i.page}')"><i class="fas ${i.icon}"></i> ${i.label}</div>`).join('')}
    <div style="padding:1.5rem; margin-top:auto; border-top:1px solid #1a3a5a; margin-top:2rem;">
      <div style="font-size:0.75rem; color:#3a5a7a; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">Logged in as</div>
      <div style="color:#80c0ff; font-weight:700;">${state.user?state.user.username:'Unknown'}</div>
      <div style="font-size:0.8rem; color:#3a6a5a; margin-top:0.25rem;">Level ${state.user?state.user.level||1:1}</div>
    </div>
  </div>`;
}

function renderDashboardLayout(content) {
  return renderNavbar() + renderSidebar() + `<div class="content-area fade-in">${content}</div>`;
}

// ---- DASHBOARD ----
function renderDashboard() {
  const u = state.user || {};
  const xpToNext = ((Math.floor((u.xp||0)/500)+1)*500);
  const pct = Math.min(100, ((u.xp||0) % 500) / 500 * 100);
  return `<div class="page-header">
    <div class="page-title">Welcome back, <span>${u.username||'Hacker'}</span> 👋</div>
    <div class="page-sub">Your cybersecurity journey continues. Keep hacking!</div>
  </div>
  <div class="dashboard-grid">
    <div class="stat-card cyan"><div class="big-num">${u.xp||0}</div><div class="stat-label">Total XP</div>
      <div class="xp-bar-container"><div class="xp-bar" style="width:${pct}%"></div></div>
      <div style="font-size:0.75rem;color:#3a5a7a;margin-top:0.3rem">${(u.xp||0)%500}/${500} to next level</div>
    </div>
    <div class="stat-card green"><div class="big-num">${u.level||1}</div><div class="stat-label">Level</div></div>
    <div class="stat-card red"><div class="big-num" id="dash-challenges">-</div><div class="stat-label">Challenges Solved</div></div>
    <div class="stat-card purple"><div class="big-num" id="dash-labs">-</div><div class="stat-label">Labs Completed</div></div>
  </div>
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h3 style="font-family:Orbitron,monospace;font-size:1.1rem;color:var(--accent-cyan)"><i class="fas fa-rocket"></i> Quick Start</h3>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
      ${[
        {icon:'🎯',title:'Start a Challenge',sub:'Test your skills with CTF challenges',page:'challenges',color:'var(--accent-green)'},
        {icon:'🧪',title:'Enter a Lab',sub:'Guided hands-on hacking labs',page:'labs',color:'var(--accent-cyan)'},
        {icon:'📚',title:'Learn Concepts',sub:'Theory and techniques explained',page:'learning',color:'var(--accent-purple)'},
        {icon:'💻',title:'Open Terminal',sub:'Simulate Kali Linux commands',page:'terminal',color:'var(--accent-orange)'},
      ].map(q => `<div onclick="navigate('${q.page}')" style="background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:1.2rem;cursor:pointer;transition:all 0.3s;border-left:3px solid ${q.color}" onmouseover="this.style.borderColor='${q.color}'" >
        <div style="font-size:1.5rem;margin-bottom:0.5rem">${q.icon}</div>
        <div style="font-weight:700;margin-bottom:0.25rem">${q.title}</div>
        <div style="font-size:0.85rem;color:var(--text-muted)">${q.sub}</div>
      </div>`).join('')}
    </div>
  </div>
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;">
    <h3 style="font-family:Orbitron,monospace;font-size:1.1rem;color:var(--accent-cyan);margin-bottom:1rem"><i class="fas fa-bolt"></i> Platform Tip</h3>
    <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:1rem;font-family:'Share Tech Mono',monospace;font-size:0.85rem;color:#80c0a0;line-height:1.8" id="tip-box">
    Loading tip...
    </div>
  </div>`;
}

const tips = [
  '💡 Always scan with nmap -sV to detect service versions before exploiting.',
  '🔑 Use rockyou.txt at /usr/share/wordlists/rockyou.txt for password attacks.',
  '🐉 Run "sudo apt update && sudo apt upgrade -y" to keep Kali updated.',
  '🕵️ Check GTFObins.github.io for SUID binary exploitation techniques.',
  '🔍 Use "strings" and "file" commands to analyze unknown binaries.',
  '🌐 Burp Suite Community is free and essential for web app testing.',
  '📡 Enable monitor mode: sudo airmon-ng start wlan0',
  '⚠️ Always get written permission before testing any system you do not own!'
];

async function loadDashboardData() {
  const data = await api('/users/stats');
  if (data.success) {
    const e1 = $('dash-challenges'); if(e1) e1.textContent = data.stats.challengesSolved;
    const e2 = $('dash-labs'); if(e2) e2.textContent = data.stats.labsCompleted;
  }
  const tip = $('tip-box');
  if(tip) tip.textContent = tips[Math.floor(Math.random()*tips.length)];
}

// =========================================================
// HOME PAGE — CyberSpace Devil Theme
// =========================================================
function renderHomePage(modal) {
  const feats = [
    {icon:'🚩', title:'CTF Challenges', desc:'50+ real-world hacking challenges across web, crypto, forensics, pwn & more.'},
    {icon:'🧪', title:'Hacking Labs',   desc:'Step-by-step guided labs. Kali basics to advanced exploitation.'},
    {icon:'💻', title:'Live Terminal',  desc:'Simulate Kali Linux in-browser. Practice safely with real commands.'},
    {icon:'📚', title:'Learn & Master', desc:'Structured courses from beginner to advanced. Theory meets practice.'},
    {icon:'🏆', title:'Leaderboard',    desc:'Compete globally. Rank up from Script Kiddie to Cyber God.'},
    {icon:'⚡', title:'Coding Tasks',   desc:'Python, Bash & JS security tools. XP for every solution.'},
  ];
  return `
  <div style="min-height:100vh;background:var(--bg);position:relative;z-index:1">
    <!-- NAVBAR -->
    <nav class="home-nav">
      <span class="home-logo-icon">⚡</span>
      <span class="home-logo" onclick="navigate('home')">CYBERFORGE</span>
      <div class="home-nav-links">
        <button class="home-nav-link active">HOME</button>
        <button class="home-nav-link" onclick="showAuthModal('login')">CHALLENGES</button>
        <button class="home-nav-link" onclick="showAuthModal('login')">LEADERBOARD</button>
        <button class="home-nav-link" onclick="showAuthModal('login')">LABS</button>
        <button class="home-nav-link" onclick="showAuthModal('login')">FEATURES</button>
        <button class="home-nav-link" onclick="showAuthModal('login')">TERMINAL</button>
      </div>
      <div class="home-nav-right">
        <span class="home-operator">Operator: <span>guest_user</span></span>
        <button class="home-nav-btn-outline" onclick="showAuthModal('login')">Sign In</button>
        <button class="home-nav-btn-fill"    onclick="showAuthModal('register')">Get Started →</button>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero-wrap">
      <div class="hero-left">
        <div class="hero-badge">
          <div class="hero-badge-dot"></div>
          LIVE CTF PLATFORM
        </div>
        <h1 class="hero-title">
          <span class="hero-t2">CyberLab.</span>
        </h1>
        <p class="hero-desc">
          Join live cybersecurity challenges, solve real-world problems,
          team up with friends, and climb the leaderboard.
        </p>
        <div class="hero-btns">
          <button class="hero-btn-primary" onclick="showAuthModal('register')">
            Get Started &nbsp;→
          </button>
          <button class="hero-btn-secondary" onclick="showAuthModal('login')">
            <i class="fas fa-user"></i> &nbsp;Sign In
          </button>
        </div>
      </div>

      <!-- Animated hacker figure -->
      <div class="hero-right">
        <div class="hacker-rings">
          <div class="hacker-ring"></div>
          <div class="hacker-ring"></div>
          <div class="hacker-ring"></div>
        </div>
        <div class="hacker-glow-outer"></div>
        <div class="hacker-glow-mid"></div>
        <div class="hacker-figure">👾</div>
      </div>
    </section>

    <!-- STATS STRIP -->
    <div class="stats-strip">
      <div class="strip-item"><div class="strip-num">1,200+</div><div class="strip-lbl">Active Hackers</div></div>
      <div class="strip-item"><div class="strip-num">50+</div><div class="strip-lbl">CTF Challenges</div></div>
      <div class="strip-item"><div class="strip-num">20+</div><div class="strip-lbl">Hacking Labs</div></div>
      <div class="strip-item"><div class="strip-num">9</div><div class="strip-lbl">Categories</div></div>
      <div class="strip-item"><div class="strip-num">100%</div><div class="strip-lbl">Free Access</div></div>
    </div>

    <!-- FEATURES -->
    <section class="features-section">
      <div class="section-head">
        <div class="section-tag">Platform Features</div>
        <div class="section-title">Everything you need to <span>hack & learn</span></div>
        <div class="section-sub">A complete cybersecurity learning environment, zero cost.</div>
      </div>
      <div class="features-grid">
        ${feats.map(f=>`
          <div class="feat-card">
            <div class="feat-icon">${f.icon}</div>
            <div class="feat-title">${f.title}</div>
            <div class="feat-desc">${f.desc}</div>
          </div>`).join('')}
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="home-footer">
      <div class="home-footer-logo">⚡ CYBERFORGE ACADEMY</div>
      <div class="home-footer-copy">© 2025 CyberForge · Built for ethical hackers</div>
    </footer>

    <!-- AUTH MODAL -->
    ${modal ? renderAuthModal(modal) : ''}
  </div>`;
}

function renderAuthModal(mode) {
  const isLogin = mode === 'login';
  return `<div class="auth-overlay" onclick="closeAuthModal(event)">
    <div class="auth-box" onclick="event.stopPropagation()">
      <button class="auth-box-close" onclick="closeAuthModal()">✕</button>
      <div class="auth-box-logo">⚡ CYBERFORGE</div>
      <div class="auth-box-title">${isLogin ? 'Welcome back' : 'Create account'}</div>
      <div class="auth-box-sub">${isLogin ? 'Sign in to access your dashboard' : 'Join the cybersecurity community'}</div>

      <!-- Google Sign-In Button -->
      <button class="google-btn" onclick="doGoogleLogin()">
        <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right:10px">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        Continue with Google
      </button>

      <div class="auth-divider"><span>or</span></div>

      <div class="auth-box-tabs">
        <button class="auth-box-tab ${isLogin?'active':''}" onclick="showAuthModal('login')">Sign In</button>
        <button class="auth-box-tab ${!isLogin?'active':''}" onclick="showAuthModal('register')">Register</button>
      </div>
      <div id="auth-msg"></div>
      ${isLogin ? `
        <div class="form-group"><label class="form-label">Email</label>
          <input class="form-input" id="login-email" type="email" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="form-group"><label class="form-label">Password</label>
          <input class="form-input" id="login-pass" type="password" placeholder="Enter password" autocomplete="current-password"/>
        </div>
        <button class="auth-box-submit" onclick="doLogin()">Sign In →</button>
        <div class="auth-switch">No account? <a onclick="showAuthModal('register')">Register free →</a></div>
        <div class="auth-demo"><i class="fas fa-info-circle"></i> Demo: <code>admin@cyberforge.io</code> / <code>admin123</code></div>
      ` : `
        <div class="form-group"><label class="form-label">Username</label>
          <input class="form-input" id="reg-user" type="text" placeholder="Your username" autocomplete="username"/>
        </div>
        <div class="form-group"><label class="form-label">Email</label>
          <input class="form-input" id="reg-email" type="email" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="form-group"><label class="form-label">Password</label>
          <input class="form-input" id="reg-pass" type="password" placeholder="Min. 6 characters" autocomplete="new-password"/>
        </div>
        <button class="auth-box-submit" onclick="doRegister()">Create Account →</button>
        <div class="auth-switch">Already registered? <a onclick="showAuthModal('login')">Sign in →</a></div>
      `}
    </div>
  </div>`;
}

function showAuthModal(mode) {
  state._authModal = mode;
  const app = document.getElementById('app');
  app.innerHTML = renderHomePage(mode);
  attachAuthEvents();
}

function closeAuthModal(e) {
  if (!e || e.target.classList.contains('auth-overlay')) {
    state._authModal = null;
    const app = document.getElementById('app');
    app.innerHTML = renderHomePage(null);
  }
}

// Render login/register — now shows home page with modal
function renderLogin()    { return renderHomePage('login'); }
function renderRegister() { return renderHomePage('register'); }
function renderLandingPage(m) { return renderHomePage(m); }
function attachLandingEvents() { attachAuthEvents(); }



async function doLogin() {
  const email = $('login-email')?.value;
  const password = $('login-pass')?.value;
  if(!email||!password) { showMsg('auth-msg','Please fill all fields','error'); return; }
  showMsg('auth-msg','<i class="fas fa-spinner fa-spin"></i> Verifying...','');

  let recaptchaToken = '';
  try {
    recaptchaToken = await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', { action: 'login' });
  } catch(e) { /* reCAPTCHA not loaded, proceed anyway in dev */ }

  showMsg('auth-msg','<i class="fas fa-spinner fa-spin"></i> Connecting...','');
  const data = await api('/auth/login','POST',{email,password,recaptchaToken});
  if(data.success) {
    localStorage.setItem('cf_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));
    state.user = data.user; state.token = data.token;
    navigate('home');
  } else showMsg('auth-msg', data.message || 'Login failed','error');
}

async function doRegister() {
  const username = $('reg-user')?.value;
  const email = $('reg-email')?.value;
  const password = $('reg-pass')?.value;
  if(!username||!email||!password) { showMsg('auth-msg','Please fill all fields','error'); return; }
  showMsg('auth-msg','<i class="fas fa-spinner fa-spin"></i> Verifying...','');

  let recaptchaToken = '';
  try {
    recaptchaToken = await grecaptcha.execute('YOUR_RECAPTCHA_SITE_KEY', { action: 'register' });
  } catch(e) { /* reCAPTCHA not loaded, proceed anyway in dev */ }

  showMsg('auth-msg','<i class="fas fa-spinner fa-spin"></i> Creating account...','');
  const data = await api('/auth/register','POST',{username,email,password,recaptchaToken});
  if(data.success) {
    localStorage.setItem('cf_token', data.token);
    localStorage.setItem('cf_user', JSON.stringify(data.user));
    state.user = data.user; state.token = data.token;
    navigate('home');
  } else showMsg('auth-msg', data.message || 'Registration failed','error');
}

function showMsg(id, msg, type) {
  const el = $(id); if(!el) return;
  el.innerHTML = msg ? `<div class="alert alert-${type}">${msg}</div>` : '';
}

async function doGoogleLogin() {
  const msgEl = $('auth-msg');
  if (msgEl) msgEl.innerHTML = '<div class="alert" style="background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.3);color:#c084fc"><i class="fas fa-spinner fa-spin"></i> Opening Google sign-in...</div>';

  if (!window.firebaseAuth || !window.googleProvider) {
    if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">Firebase not ready. Please add your Firebase web config to index.html.</div>';
    return;
  }

  try {
    const result = await window.signInWithPopup(window.firebaseAuth, window.googleProvider);
    const googleUser = result.user;

    // Send Google token to our backend
    const idToken = await googleUser.getIdToken();
    const data = await api('/auth/google', 'POST', {
      idToken,
      email: googleUser.email,
      username: googleUser.displayName?.replace(/\s+/g, '_').toLowerCase() || 'user_' + Date.now(),
      photoURL: googleUser.photoURL
    });

    if (data.success) {
      localStorage.setItem('cf_token', data.token);
      localStorage.setItem('cf_user', JSON.stringify(data.user));
      state.user = data.user;
      state.token = data.token;
      navigate('home');
    } else {
      if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
    }
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return;
    if (msgEl) msgEl.innerHTML = `<div class="alert alert-error">Google sign-in failed: ${err.message}</div>`;
  }
}

function logout() {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
  state.user = null; state.token = null;
  navigate('login');
}

// ---- CHALLENGES ----
function renderChallengesPage() {
  const cats = ['all','web','cryptography','forensics','reverse-engineering','pwn','osint','network','steganography','misc'];
  return `<div class="page-header">
    <div class="page-title">🚩 CTF <span>Challenges</span></div>
    <div class="page-sub">Solve real-world style cybersecurity challenges and earn XP</div>
  </div>
  <div class="challenges-filter">
    ${cats.map(c => `<button class="filter-btn ${state.challengeFilter===c?'active':''}" onclick="filterChallenges('${c}')">${c.toUpperCase()}</button>`).join('')}
  </div>
  <div id="challenges-grid" class="card-grid"><div class="loading"><i class="fas fa-spinner"></i> Loading challenges...</div></div>
  <div id="challenge-modal"></div>`;
}

async function loadChallenges() {
  const filter = state.challengeFilter !== 'all' ? `?category=${state.challengeFilter}` : '';
  const data = await api('/challenges' + filter);
  const grid = $('challenges-grid');
  if(!grid) return;
  if(!data.success) { grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${data.message}</p></div>`; return; }
  const c = data.challenges;
  if(!c||!c.length) { grid.innerHTML = `<div class="empty-state"><i class="fas fa-flag"></i><p>No challenges found. Try seeding: POST /api/challenges/seed/all</p></div>`; return; }
  grid.innerHTML = c.map(ch => `
    <div class="card challenge-card ${ch.solved?'solved':''}" onclick="openChallenge('${ch._id}')">
      <div><span class="diff-badge diff-${ch.difficulty}">${ch.difficulty}</span><span class="cat-badge">${ch.category}</span></div>
      <div class="card-title">${ch.title}</div>
      <div class="card-desc">${ch.description.slice(0,100)}...</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
        <div class="points-badge"><i class="fas fa-star" style="color:#ffcc00;font-size:0.8rem"></i> ${ch.points} pts</div>
        <div class="solve-count"><i class="fas fa-users"></i> ${ch.solveCount||0} solves</div>
      </div>
      <div style="margin-top:0.5rem">${(ch.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

function filterChallenges(cat) {
  state.challengeFilter = cat;
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(b => { b.classList.toggle('active', b.textContent.toLowerCase() === cat); });
  const grid = $('challenges-grid');
  if(grid) grid.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading...</div>';
  loadChallenges();
}

async function openChallenge(id) {
  const data = await api('/challenges/' + id);
  if(!data.success) return;
  const ch = data.challenge;
  const modal = $('challenge-modal');
  modal.innerHTML = `<div class="modal-overlay" onclick="closeChallengeModal(event)">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <span class="diff-badge diff-${ch.difficulty}">${ch.difficulty}</span>
          <span class="cat-badge">${ch.category}</span>
          <span style="margin-left:1rem;font-family:Orbitron,monospace;color:var(--accent-cyan)">${ch.points} pts</span>
        </div>
        <button class="modal-close" onclick="closeChallengeModal()">✕</button>
      </div>
      <h2 style="font-family:Orbitron,monospace;font-size:1.3rem;margin-bottom:1rem">${ch.title}</h2>
      <div class="challenge-desc">${ch.description}</div>
      ${ch.hints&&ch.hints.length?`<div class="hint-section"><div style="color:var(--accent-orange);font-weight:700;margin-bottom:0.5rem"><i class="fas fa-lightbulb"></i> Hints</div>${ch.hints.map(h=>`<div class="hint-item"><i class="fas fa-lightbulb"></i> ${h.text} <span style="float:right;color:#666">-${h.cost} XP</span></div>`).join('')}</div>`:''}
      <div style="margin-top:1.5rem">
        <label style="display:block;font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px"><i class="fas fa-flag" style="color:var(--accent-green)"></i> Submit Flag</label>
        <input class="flag-input" id="flag-input-${ch._id}" placeholder="CyberForge{your_flag_here}" />
        <div id="flag-msg-${ch._id}"></div>
        <button class="btn btn-green" style="width:100%" onclick="submitFlag('${ch._id}')"><i class="fas fa-paper-plane"></i> SUBMIT FLAG</button>
      </div>
    </div>
  </div>`;
  document.getElementById(`flag-input-${ch._id}`)?.addEventListener('keydown', e => { if(e.key==='Enter') submitFlag(ch._id); });
}

function closeChallengeModal(e) {
  if(!e || e.target.classList.contains('modal-overlay')) {
    const m = $('challenge-modal'); if(m) m.innerHTML = '';
  }
}

async function submitFlag(id) {
  const input = $('flag-input-'+id);
  const msg = $('flag-msg-'+id);
  if(!input||!msg) return;
  const flag = input.value.trim();
  if(!flag) return;
  msg.innerHTML = '<div class="alert" style="background:rgba(0,100,200,0.2);border-color:#0055aa;color:#66aaff"><i class="fas fa-spinner fa-spin"></i> Checking...</div>';
  const data = await api('/challenges/'+id+'/submit','POST',{flag});
  if(data.success) {
    msg.innerHTML = `<div class="success-msg"><i class="fas fa-check-circle"></i> ${data.message}</div>`;
    state.user.xp = data.newXP; state.user.rank = data.newRank;
    localStorage.setItem('cf_user', JSON.stringify(state.user));
    setTimeout(() => { closeChallengeModal(); loadChallenges(); }, 2000);
  } else {
    msg.innerHTML = `<div class="error-msg"><i class="fas fa-times-circle"></i> ${data.message}</div>`;
  }
}

// ---- LABS ----
function renderLabsPage() {
  return `<div class="page-header">
    <div class="page-title">🧪 Hacking <span>Labs</span></div>
    <div class="page-sub">Step-by-step guided hacking labs with real commands</div>
  </div>
  <div id="labs-grid" class="card-grid"><div class="loading"><i class="fas fa-spinner"></i> Loading labs...</div></div>
  <div id="lab-detail" style="display:none"></div>`;
}

async function loadLabs() {
  const data = await api('/labs');
  const grid = $('labs-grid');
  if(!grid) return;
  if(!data.success) { grid.innerHTML = `<div class="empty-state"><p>${data.message}</p></div>`; return; }
  const labs = data.labs;
  if(!labs||!labs.length) { grid.innerHTML = `<div class="empty-state"><i class="fas fa-flask"></i><p>No labs found. Seed: POST /api/labs/seed/all</p></div>`; return; }
  grid.innerHTML = labs.map(l => `
    <div class="card lab-card" onclick="openLab('${l._id}')">
      <div><span class="module-level level-${l.difficulty}">${l.difficulty}</span><span class="cat-badge">${l.category}</span></div>
      <div class="card-title">${l.title}</div>
      <div class="card-desc">${l.description}</div>
      <div style="display:flex;gap:1rem;margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">
        <span><i class="fas fa-clock"></i> ${l.duration}</span>
        <span><i class="fas fa-star" style="color:#ffcc00"></i> +${l.xpReward} XP</span>
        ${l.completed?'<span style="color:var(--accent-green)"><i class="fas fa-check-circle"></i> Completed</span>':''}
      </div>
      <div style="margin-top:0.75rem">${(l.tools||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

async function openLab(id) {
  const data = await api('/labs/'+id);
  if(!data.success) return;
  const l = data.lab;
  const grid = $('labs-grid');
  const detail = $('lab-detail');
  if(grid) grid.style.display='none';
  if(!detail) return;
  detail.style.display='';
  detail.innerHTML = `
    <button class="btn btn-outline" style="margin-bottom:1.5rem" onclick="backToLabs()"><i class="fas fa-arrow-left"></i> Back to Labs</button>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
        <div>
          <span class="module-level level-${l.difficulty}">${l.difficulty}</span>
          <span class="cat-badge">${l.category}</span>
          <h2 style="font-family:Orbitron,monospace;font-size:1.4rem;margin-top:0.75rem">${l.title}</h2>
          <p style="color:var(--text-muted);margin-top:0.5rem">${l.description}</p>
        </div>
        <div style="text-align:center;background:rgba(0,0,0,0.3);padding:1rem;border-radius:8px">
          <div style="font-family:Orbitron,monospace;font-size:1.5rem;color:var(--accent-cyan)">+${l.xpReward}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">XP REWARD</div>
        </div>
      </div>
      <div class="section-divider"><span>Objectives</span></div>
      <ul style="list-style:none;margin-bottom:1.5rem">${(l.objectives||[]).map(o=>`<li style="padding:0.4rem 0;color:#80c0a0"><i class="fas fa-check-circle" style="color:var(--accent-green);margin-right:0.5rem"></i>${o}</li>`).join('')}</ul>
      <div class="section-divider"><span>Lab Steps</span></div>
      ${(l.steps||[]).map(s=>`
        <div class="lab-step">
          <div class="lab-step-num">STEP ${s.stepNumber}</div>
          <div style="font-weight:700;font-size:1.05rem;margin-bottom:0.5rem">${s.title}</div>
          <div style="color:var(--text-muted);margin-bottom:0.75rem;line-height:1.6">${s.instruction}</div>
          ${s.command?`<div class="lab-cmd" onclick="copyCmd('${s.command.replace(/'/g,"\\'")}',this)" title="Click to copy">${s.command}</div>`:''}
          ${s.expectedOutput?`<div style="font-size:0.85rem;color:#3a5a4a;margin-top:0.5rem"><i class="fas fa-terminal"></i> Expected: <span style="color:#60a070;font-family:'Share Tech Mono',monospace">${s.expectedOutput}</span></div>`:''}
          ${s.hint?`<div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:rgba(255,102,0,0.1);border-left:3px solid var(--accent-orange);border-radius:4px;font-size:0.85rem;color:var(--accent-orange)"><i class="fas fa-lightbulb"></i> ${s.hint}</div>`:''}
        </div>`).join('')}
      <div style="margin-top:2rem;text-align:center">
        <button class="btn btn-green" onclick="completeLab('${l._id}')"><i class="fas fa-check-circle"></i> MARK AS COMPLETED (+${l.xpReward} XP)</button>
      </div>
      <div id="lab-msg-${l._id}" style="margin-top:1rem"></div>
    </div>`;
}

function backToLabs() {
  const grid = $('labs-grid');
  const detail = $('lab-detail');
  if(grid) grid.style.display='';
  if(detail) detail.style.display='none';
}

async function completeLab(id) {
  const data = await api('/labs/'+id+'/complete','POST');
  const msg = $('lab-msg-'+id);
  if(msg) msg.innerHTML = data.success
    ? `<div class="success-msg"><i class="fas fa-trophy"></i> ${data.message} You earned ${data.xpEarned} XP!</div>`
    : `<div class="error-msg">${data.message}</div>`;
  if(data.success) { state.user.xp = (state.user.xp||0)+data.xpEarned; localStorage.setItem('cf_user',JSON.stringify(state.user)); }
}

function copyCmd(cmd, el) {
  navigator.clipboard?.writeText(cmd).then(()=>{ el.style.borderColor='var(--accent-green)'; setTimeout(()=>el.style.borderColor='',1000); });
}

// ---- TOOLS ----
function renderToolsPage() {
  const cats = ['all','network','web','password','exploitation','wireless','forensics'];
  return `<div class="page-header">
    <div class="page-title">🛠️ Security <span>Tools</span></div>
    <div class="page-sub">Complete guide to cybersecurity tools - installation, usage, and examples</div>
  </div>
  <div class="challenges-filter" style="margin-bottom:1rem">
    ${cats.map(c=>`<button class="filter-btn ${state.toolFilter===c?'active':''}" onclick="filterTools('${c}')">${c.toUpperCase()}</button>`).join('')}
  </div>
  <input id="tool-search" class="form-input" style="max-width:400px;margin-bottom:1.5rem" placeholder="🔍 Search tools..." oninput="searchTools(this.value)"/>
  <div id="tools-grid" class="card-grid"><div class="loading"><i class="fas fa-spinner"></i> Loading tools...</div></div>
  <div id="tool-detail" style="display:none"></div>`;
}

async function loadTools() {
  const filter = state.toolFilter!=='all'?`?category=${state.toolFilter}`:'';
  const data = await api('/tools'+filter);
  const grid = $('tools-grid');
  if(!grid) return;
  if(!data.success) { grid.innerHTML = `<div class="empty-state"><p>${data.message}</p></div>`; return; }
  state.tools = data.tools;
  renderToolsGrid(data.tools);
}

function renderToolsGrid(tools) {
  const grid = $('tools-grid'); if(!grid) return;
  if(!tools.length) { grid.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>No tools found</p></div>'; return; }
  grid.innerHTML = tools.map(t=>`
    <div class="card tool-card" onclick="openTool(${t.id})">
      <div class="tool-icon">${t.icon}</div>
      <span class="tool-cat-badge">${t.category}</span>
      <div class="tool-name">${t.name}</div>
      <div class="card-desc">${t.description.slice(0,100)}...</div>
      <div style="margin-top:0.75rem">${(t.tags||[]).slice(0,3).map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
    </div>`).join('');
}

function filterTools(cat) {
  state.toolFilter = cat;
  document.querySelectorAll('.challenges-filter .filter-btn').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase()===cat));
  loadTools();
}

function searchTools(q) {
  if(!q) { renderToolsGrid(state.tools); return; }
  const filtered = state.tools.filter(t=>t.name.toLowerCase().includes(q.toLowerCase())||t.description.toLowerCase().includes(q.toLowerCase()));
  renderToolsGrid(filtered);
}

async function openTool(id) {
  const data = await api('/tools/'+id);
  if(!data.success) return;
  const t = data.tool;
  const grid = $('tools-grid');
  const detail = $('tool-detail');
  if(grid) grid.style.display='none';
  if(!detail) return;
  detail.style.display='';
  detail.innerHTML = `
    <button class="btn btn-outline" style="margin-bottom:1.5rem" onclick="backToTools()"><i class="fas fa-arrow-left"></i> Back to Tools</button>
    <div class="tool-detail">
      <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <div style="font-size:3.5rem">${t.icon}</div>
        <div>
          <h2 style="font-family:Orbitron,monospace;font-size:1.8rem">${t.name}</h2>
          <span class="tool-cat-badge">${t.category}</span>
          <span class="diff-badge ${t.difficulty==='beginner'?'diff-easy':t.difficulty==='intermediate'?'diff-medium':'diff-hard'}" style="margin-left:0.5rem">${t.difficulty}</span>
        </div>
      </div>
      <p style="color:var(--text-muted);line-height:1.7;margin-bottom:1.5rem">${t.description}</p>
      <div class="section-divider"><span>Installation</span></div>
      <div class="code-block"><span class="cmd">${t.install}</span></div>
      <div class="section-divider"><span>Basic Usage</span></div>
      <div class="code-block"><span class="cmd">${t.usage}</span></div>
      <div class="section-divider"><span>Examples</span></div>
      <div>${(t.examples||[]).map(ex=>`<div class="example-item"><div class="example-cmd">$ ${ex.cmd}</div><div class="example-desc">${ex.desc}</div></div>`).join('')}</div>
      <div class="section-divider"><span>Tags</span></div>
      <div>${(t.tags||[]).map(tag=>`<span class="tag">${tag}</span>`).join('')}</div>
    </div>`;
}

function backToTools() {
  const grid = $('tools-grid'); const detail = $('tool-detail');
  if(grid) grid.style.display=''; if(detail) detail.style.display='none';
}

// ---- TERMINAL ----
function renderTerminalPage() {
  return `<div class="page-header">
    <div class="page-title">💻 Live <span>Terminal</span></div>
    <div class="page-sub">Simulated Kali Linux terminal - practice commands safely</div>
  </div>
  <div style="background:rgba(0,255,65,0.05);border:1px solid rgba(0,255,65,0.3);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.85rem;color:var(--accent-green)">
    <i class="fas fa-shield-alt"></i> <strong>Safe Simulation Mode</strong> — No real system is affected. Practice Kali Linux commands in a sandboxed environment.
  </div>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
      <span class="terminal-title">kali@cyberforge:~ — bash</span>
      <button onclick="clearTerminal()" style="background:none;border:1px solid #333;color:#666;padding:0.2rem 0.6rem;border-radius:4px;cursor:pointer;font-size:0.75rem;margin-left:1rem">CLEAR</button>
    </div>
    <div class="terminal-output" id="term-output">
      <div class="term-line" style="color:#5a8a6a">CyberForge Academy - Kali Linux Terminal Simulator v2.0</div>
      <div class="term-line" style="color:#3a5a4a">Type 'help' to see available commands. Use arrow keys for history.</div>
      <div class="term-line" style="color:#2a4a3a">⚠️  Educational simulator only. Practice safely!</div>
      <div class="term-line"> </div>
    </div>
    <div class="terminal-input-row">
      <span class="term-prompt">┌──(kali㉿cyberforge)-[~]<br>└─$&nbsp;</span>
      <input class="term-input" id="term-input" placeholder="Enter command..." autocomplete="off" spellcheck="false"/>
    </div>
  </div>
  <div style="margin-top:1.5rem">
    <div class="page-title" style="font-size:1.1rem;margin-bottom:1rem">⚡ Quick Commands</div>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
      ${['ls -la','pwd','whoami','id','uname -a','ifconfig','nmap --help','nmap -sV 192.168.1.1','hashcat --help','hydra --help','help'].map(cmd=>
        `<button onclick="runQuickCmd('${cmd}')" style="background:var(--bg2);border:1px solid var(--border);color:var(--purple);padding:0.4rem 0.8rem;border-radius:6px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:0.8rem;transition:all 0.2s" onmouseover="this.style.borderColor='var(--purple)';this.style.background='rgba(124,58,237,.08)'" onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg2)'">${cmd}</button>`
      ).join('')}
    </div>
  </div>`;
}

let cmdHistory = []; let historyIdx = -1;

function initTerminal() {
  const input = $('term-input');
  if(!input) return;
  input.addEventListener('keydown', e => {
    if(e.key==='Enter') { const cmd=input.value.trim(); if(cmd) { execTermCmd(cmd); cmdHistory.unshift(cmd); historyIdx=-1; input.value=''; } }
    if(e.key==='ArrowUp') { historyIdx=Math.min(historyIdx+1,cmdHistory.length-1); input.value=cmdHistory[historyIdx]||''; e.preventDefault(); }
    if(e.key==='ArrowDown') { historyIdx=Math.max(historyIdx-1,-1); input.value=cmdHistory[historyIdx]||''; e.preventDefault(); }
    if(e.key==='Tab') { e.preventDefault(); autocomplete(input.value); }
  });
  input.focus();
  // Connect socket
  try {
    state.socket = io(window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
    state.socket.on('terminal-output', data => { appendTermOutput(data.command, data.output); });
  } catch(e) { console.log('Socket not available, using local simulation'); }
}

const localCmds = {
  'ls': 'Desktop  Documents  Downloads  Tools  ctf_workspace  wordlists',
  'ls -la': 'total 48\ndrwxr-xr-x 8 kali kali 4096 Jan  1 10:00 .\ndrwxr-xr-x 3 root root 4096 Jan  1 09:00 ..\n-rw-r--r-- 1 kali kali  220 Jan  1 09:00 .bash_logout\n-rw-r--r-- 1 kali kali 3526 Jan  1 09:00 .bashrc\ndrwxr-xr-x 2 kali kali 4096 Jan  1 10:00 Desktop\ndrwxr-xr-x 2 kali kali 4096 Jan  1 10:00 Tools\ndrwxr-xr-x 2 kali kali 4096 Jan  1 10:00 ctf_workspace',
  'pwd': '/home/kali',
  'whoami': 'kali',
  'id': 'uid=1000(kali) gid=1000(kali) groups=1000(kali),24(cdrom),27(sudo)',
  'uname -a': 'Linux kali 6.1.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.27-1kali1 x86_64 GNU/Linux',
  'ifconfig': 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 00:0c:29:ab:cd:ef\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0',
  'ip addr': '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 192.168.1.100/24 brd 192.168.1.255',
  'nmap --help': 'Nmap 7.94 ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target}\n  -sS : TCP SYN Scan (stealth)\n  -sV : Version detection\n  -sC : Default scripts\n  -O  : OS detection\n  -A  : Aggressive scan\n  -p  : Port ranges (-p 1-1000, -p-)\n  -T4 : Timing template (faster)',
  'nmap -sv 192.168.1.1': 'Starting Nmap 7.94\nNmap scan report for 192.168.1.1\nPORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.4p1 Debian\n80/tcp open  http    Apache httpd 2.4.51\nNmap done: 1 IP address (1 host up) scanned in 3.21s',
  'nmap -sv 192.168.1.1': 'Starting Nmap 7.94\nNmap scan report for 192.168.1.1\nPORT   STATE SERVICE VERSION\n22/tcp open  ssh     OpenSSH 8.4p1 Debian\n80/tcp open  http    Apache httpd 2.4.51\nNmap done: 1 IP address (1 host up) scanned in 3.21s',
  'hashcat --help': 'hashcat (v6.2.6)\nUsage: hashcat [options]... hash|hashfile [dictionary|mask]\n  -m : Hash-Type (0=MD5,100=SHA1,1000=NTLM,1800=sha512crypt)\n  -a : Attack-Mode (0=dict, 1=combo, 3=brute-force, 6=hybrid)\n  -o : Output file\n  --show : Show cracked hashes\nExample: hashcat -m 0 -a 0 hash.txt rockyou.txt',
  'hydra --help': 'Hydra v9.4\nSyntax: hydra [options] target service\n  -l LOGIN   : single login name\n  -L FILE    : login file\n  -p PASS    : single password\n  -P FILE    : password file\n  -t TASKS   : parallel connections (default: 16)\nExample: hydra -l admin -P rockyou.txt ssh://192.168.1.1',
  'help': 'Available Kali Linux commands (simulation):\nNavigation : ls, pwd, cd, mkdir, rm, cp, mv, cat, less\nNetwork    : ifconfig, ip addr, netstat, ss, ping, traceroute\nSecurity   : nmap, hydra, hashcat, sqlmap, gobuster, nikto\nSystem     : whoami, id, uname, ps, top, kill, sudo\nInfo       : help, man\nTip: Type any tool name + --help for usage info',
  'clear': 'CLEAR',
  'cat /etc/passwd': 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash',
  'sudo -l': 'Matching Defaults entries for kali:\n    env_reset, mail_badpass\nUser kali may run the following commands:\n    (ALL : ALL) ALL\n    (root) NOPASSWD: /usr/bin/nmap',
  'find / -perm -4000 2>/dev/null': '/usr/bin/sudo\n/usr/bin/passwd\n/usr/bin/newgrp\n/usr/bin/su\n/usr/bin/mount\n/usr/bin/nmap  <-- potential privesc!',
};

function execTermCmd(cmd) {
  const lower = cmd.toLowerCase().trim();
  let output = localCmds[lower] || localCmds[cmd.trim()] || `bash: ${cmd}: command not found\nHint: type 'help' for available commands`;
  if(output === 'CLEAR') { clearTerminal(); return; }
  appendTermOutput(cmd, output);
}

function appendTermOutput(cmd, output) {
  const out = $('term-output');
  if(!out) return;
  const div = document.createElement('div');
  div.innerHTML = `<div class="term-line"><span class="term-prompt">┌──(kali㉿cyberforge)-[~]<br>└─$ </span><span class="term-command">${cmd}</span></div><div class="term-line term-result">${output}</div><div class="term-line"> </div>`;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

function clearTerminal() {
  const out = $('term-output');
  if(out) out.innerHTML = '<div class="term-line" style="color:#3a5a4a">Terminal cleared. Type \'help\' for commands.</div>';
}

function runQuickCmd(cmd) {
  const input = $('term-input');
  if(input) { input.value = cmd; input.focus(); execTermCmd(cmd); cmdHistory.unshift(cmd); input.value=''; }
}

function autocomplete(partial) {
  const cmds = Object.keys(localCmds);
  const match = cmds.find(c => c.startsWith(partial));
  if(match) { const input = $('term-input'); if(input) input.value = match; }
}

// ---- LEARNING ----
function renderLearningPage() {
  return `<div class="page-header">
    <div class="page-title">📚 Learn <span>Hacking</span></div>
    <div class="page-sub">From absolute beginner to advanced ethical hacker</div>
  </div>
  <div id="learning-grid" class="card-grid"><div class="loading"><i class="fas fa-spinner"></i> Loading modules...</div></div>
  <div id="module-detail" style="display:none"></div>`;
}

async function loadLearning() {
  const data = await api('/learning');
  const grid = $('learning-grid');
  if(!grid) return;
  if(!data.success) { grid.innerHTML = `<div class="empty-state"><p>${data.message}</p></div>`; return; }
  grid.innerHTML = data.modules.map(m=>`
    <div class="card module-card" onclick="openModule(${m.id})">
      <div class="module-icon">${m.icon}</div>
      <span class="module-level level-${m.level}">${m.level}</span>
      <div class="card-title">${m.title}</div>
      <div style="display:flex;gap:1rem;margin-top:0.75rem;font-size:0.85rem;color:var(--text-muted)">
        <span><i class="fas fa-clock"></i> ${m.duration}</span>
        <span><i class="fas fa-star" style="color:#ffcc00"></i> +${m.xp} XP</span>
      </div>
      <span class="tag" style="margin-top:0.5rem">${m.category}</span>
    </div>`).join('');
}

async function openModule(id) {
  const data = await api('/learning/'+id);
  if(!data.success) return;
  const m = data.module;
  const grid = $('learning-grid'); const detail = $('module-detail');
  if(grid) grid.style.display='none';
  if(!detail) return;
  detail.style.display='';
  detail.innerHTML = `
    <button class="btn btn-outline" style="margin-bottom:1.5rem" onclick="backToLearning()"><i class="fas fa-arrow-left"></i> Back to Modules</button>
    <div class="module-content">
      <div style="display:flex;align-items:flex-start;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <div style="font-size:3rem">${m.icon}</div>
        <div style="flex:1">
          <span class="module-level level-${m.level}">${m.level}</span>
          <span class="tag">${m.category}</span>
          <h2 style="font-family:Orbitron,monospace;font-size:1.5rem;margin-top:0.5rem">${m.title}</h2>
          <div style="display:flex;gap:1.5rem;margin-top:0.5rem;color:var(--text-muted);font-size:0.9rem">
            <span><i class="fas fa-clock"></i> ${m.duration}</span>
            <span><i class="fas fa-star" style="color:#ffcc00"></i> +${m.xp} XP</span>
          </div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:1.2rem;margin-bottom:1.5rem;line-height:1.7;color:#90b0c0">
        ${m.content.overview}
      </div>
      ${(m.content.sections||[]).map(s=>`
        <div class="section-item">
          <div class="section-title"><i class="fas fa-chevron-right"></i> ${s.title}</div>
          <div class="section-body">${s.body}</div>
        </div>`).join('')}
    </div>`;
}

function backToLearning() {
  const grid = $('learning-grid'); const detail = $('module-detail');
  if(grid) grid.style.display=''; if(detail) detail.style.display='none';
}

// ---- LEADERBOARD ----
function renderLeaderboardPage() {
  return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;overflow:hidden">
    <div id="leaderboard-content"><div class="loading"><i class="fas fa-spinner"></i> Loading leaderboard...</div></div>
  </div>`;
}

async function loadLeaderboard() {
  const data = await api('/leaderboard');
  const el = $('leaderboard-content');
  if(!el) return;
  if(!data.success) { el.innerHTML = `<div class="empty-state"><p>${data.message}</p></div>`; return; }
  const lb = data.leaderboard;
  if(!lb||!lb.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>No players yet. Be the first!</p></div>'; return; }
  el.innerHTML = `<table class="leaderboard-table">
    <thead><tr><th>#</th><th>Hacker</th><th>Rank</th><th>XP</th><th>Level</th><th>Challenges</th><th>Badges</th></tr></thead>
    <tbody>${lb.map(p=>`
      <tr class="${p.position<=3?'pos-'+p.position:''}">
        <td><span class="pos-badge">${p.position===1?'🥇':p.position===2?'🥈':p.position===3?'🥉':'#'+p.position}</span></td>
        <td style="font-weight:700">${p.username}</td>
        <td style="font-size:0.85rem;color:#8080c0">${p.rank}</td>
        <td style="font-family:Orbitron,monospace;color:var(--accent-cyan)">${p.xp.toLocaleString()}</td>
        <td>Lv.${p.level}</td>
        <td><i class="fas fa-flag" style="color:var(--accent-green)"></i> ${p.challengesSolved}</td>
        <td><i class="fas fa-medal" style="color:#ffcc00"></i> ${p.badgeCount}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

// ---- TASKS ----
function renderTasksPage() {
  return `<div class="page-header">
    <div class="page-title">💻 Coding <span>Tasks</span></div>
    <div class="page-sub">Programming challenges with cybersecurity themes - Python, Bash, JavaScript</div>
  </div>
  <div id="tasks-grid" class="card-grid"><div class="loading"><i class="fas fa-spinner"></i> Loading tasks...</div></div>
  <div id="task-detail" style="display:none"></div>`;
}

async function loadTasks() {
  const data = await api('/tasks');
  const grid = $('tasks-grid');
  if(!grid) return;
  if(!data.success) { grid.innerHTML = `<div class="empty-state"><p>${data.message}</p></div>`; return; }
  const tasks = data.tasks;
  if(!tasks||!tasks.length) { grid.innerHTML = `<div class="empty-state"><i class="fas fa-code"></i><p>No tasks. Seed: POST /api/tasks/seed/all</p></div>`; return; }
  grid.innerHTML = tasks.map(t=>`
    <div class="card" onclick="openTask('${t._id}','${t.type}','${t.title.replace(/'/g,"\\'")}')">
      <div><span class="diff-badge diff-${t.difficulty}">${t.difficulty}</span><span class="cat-badge">${t.type}</span></div>
      <div class="card-title">${t.title}</div>
      <div class="card-desc">${t.description.slice(0,100)}...</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
        <span class="points-badge"><i class="fas fa-star" style="color:#ffcc00;font-size:0.8rem"></i> ${t.points} pts</span>
        ${t.completed?'<span style="color:var(--accent-green);font-size:0.85rem"><i class="fas fa-check-circle"></i> Completed</span>':''}
      </div>
    </div>`).join('');
}

async function openTask(id, type, title) {
  const data = await api('/tasks');
  const task = data.tasks?.find(t=>t._id===id);
  if(!task) return;
  const grid = $('tasks-grid'); const detail = $('task-detail');
  if(grid) grid.style.display='none';
  if(!detail) return;
  detail.style.display='';
  detail.innerHTML = `
    <button class="btn btn-outline" style="margin-bottom:1.5rem" onclick="backToTasks()"><i class="fas fa-arrow-left"></i> Back to Tasks</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;flex-wrap:wrap" id="task-layout">
      <div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1rem">
          <span class="diff-badge diff-${task.difficulty}">${task.difficulty}</span>
          <span class="cat-badge">${task.type}</span>
          <h3 style="font-size:1.2rem;font-weight:700;margin:0.75rem 0">${task.title}</h3>
          <p style="color:var(--text-muted);line-height:1.6">${task.description}</p>
          ${task.hints?.length?`<div style="margin-top:1rem"><strong style="color:var(--accent-orange)"><i class="fas fa-lightbulb"></i> Hints:</strong>${task.hints.map(h=>`<div class="hint-item">${h}</div>`).join('')}</div>`:''}
        </div>
      </div>
      <div>
        <div class="code-editor">
          <div class="code-editor-header">
            <span style="color:var(--text-muted);font-size:0.85rem"><i class="fas fa-code"></i> ${task.type}</span>
            <button class="btn btn-green" style="padding:0.4rem 1rem;font-size:0.85rem" onclick="submitTask('${task._id}')"><i class="fas fa-play"></i> Submit</button>
          </div>
          <textarea class="code-textarea" id="task-code-${task._id}">${task.starterCode||'# Write your solution here\n'}</textarea>
        </div>
        <div id="task-result-${task._id}" style="margin-top:1rem"></div>
      </div>
    </div>`;
  if(window.innerWidth < 900) {
    const layout = $('task-layout');
    if(layout) layout.style.gridTemplateColumns = '1fr';
  }
}

function backToTasks() {
  const grid = $('tasks-grid'); const detail = $('task-detail');
  if(grid) grid.style.display=''; if(detail) detail.style.display='none';
}

async function submitTask(id) {
  const code = $('task-code-'+id)?.value || '';
  const result = $('task-result-'+id);
  if(!result) return;
  result.innerHTML = '<div class="alert" style="background:rgba(0,100,200,0.2);border-color:#0055aa;color:#66aaff"><i class="fas fa-spinner fa-spin"></i> Evaluating...</div>';
  const data = await api('/tasks/'+id+'/submit','POST',{code});
  result.innerHTML = data.success
    ? `<div class="success-msg"><i class="fas fa-check-circle"></i> ${data.message} +${data.xpEarned} XP</div>`
    : `<div class="error-msg"><i class="fas fa-info-circle"></i> ${data.message}</div>`;
  if(data.success) { state.user.xp=(state.user.xp||0)+data.xpEarned; localStorage.setItem('cf_user',JSON.stringify(state.user)); }
}

// ---- NAVIGATION ----
function navigate(page) {
  state.page = page;
  state.selectedChallenge = null;
  state.selectedLab = null;
  state.selectedTool = null;
  state.selectedModule = null;
  render();
}

function attachNavEvents() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = $('challenge-modal');
      if (modal) modal.innerHTML = '';
    }
  });
}

function attachLandingEvents() { attachAuthEvents(); }
function attachAuthEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if ($('login-pass')) doLogin();
      else if ($('reg-pass')) doRegister();
    }
  }, { once: true });
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  state.token = getToken();
  state.user = getUser();
  // Start on home page (shows landing or dashboard)
  state.page = 'home';
  render();
});

function addMatrixBg() {
  const chars = '01アイウエオカキクケコサシスセソ';
  const bg = document.createElement('div');
  bg.className = 'matrix-bg';
  bg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:0;opacity:0.04;pointer-events:none;font-family:monospace;font-size:14px;line-height:1.5;color:#00ff41;';
  let content = '';
  for(let i=0; i<3000; i++) content += chars[Math.floor(Math.random()*chars.length)];
  bg.textContent = content;
  document.body.appendChild(bg);
}

// Make all functions global
window.navigate = navigate;
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doGoogleLogin = doGoogleLogin;
window.logout = logout;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.filterChallenges = filterChallenges;
window.openChallenge = openChallenge;
window.closeChallengeModal = closeChallengeModal;
window.submitFlag = submitFlag;
window.openLab = openLab;
window.backToLabs = backToLabs;
window.completeLab = completeLab;
window.copyCmd = copyCmd;
window.filterTools = filterTools;
window.searchTools = searchTools;
window.openTool = openTool;
window.backToTools = backToTools;
window.runQuickCmd = runQuickCmd;
window.clearTerminal = clearTerminal;
window.openModule = openModule;
window.backToLearning = backToLearning;
window.openTask = openTask;
window.backToTasks = backToTasks;
window.submitTask = submitTask;
