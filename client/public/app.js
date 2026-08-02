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
    <div class="logo" onclick="navigate('home')">CYBER<span>FORGE</span> <small style="font-size:0.6rem;color:var(--text-dim);font-family:Rajdhani">ACADEMY</small></div>
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
    <div style="padding:1.5rem; margin-top:auto; border-top:1px solid var(--border); margin-top:2rem;">
      <div style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">Logged in as</div>
      <div style="color:var(--purple); font-weight:700;">${state.user?state.user.username:'Unknown'}</div>
      <div style="font-size:0.8rem; color:var(--text-dim); margin-top:0.25rem;">Level ${state.user?state.user.level||1:1}</div>
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
      <div style="font-size:0.75rem;color:var(--text-dim);margin-top:0.3rem">${(u.xp||0)%500}/${500} to next level</div>
    </div>
    <div class="stat-card green"><div class="big-num">${u.level||1}</div><div class="stat-label">Level</div></div>
    <div class="stat-card red"><div class="big-num" id="dash-challenges">-</div><div class="stat-label">Challenges Solved</div></div>
    <div class="stat-card purple"><div class="big-num" id="dash-labs">-</div><div class="stat-label">Labs Completed</div></div>
  </div>
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <h3 style="font-family:Orbitron,monospace;font-size:1.1rem;color:var(--purple)"><i class="fas fa-rocket"></i> Quick Start</h3>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
      ${[
        {icon:'🎯',title:'Start a Challenge',sub:'Test your skills with CTF challenges',page:'challenges',color:'var(--purple)'},
        {icon:'🧪',title:'Enter a Lab',sub:'Guided hands-on hacking labs',page:'labs',color:'var(--cyan)'},
        {icon:'📚',title:'Learn Concepts',sub:'Theory and techniques explained',page:'learning',color:'var(--green)'},
        {icon:'💻',title:'Open Terminal',sub:'Simulate Kali Linux commands',page:'terminal',color:'var(--orange)'},
      ].map(q => `<div onclick="navigate('${q.page}')" style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1.2rem;cursor:pointer;transition:all 0.3s;border-left:3px solid ${q.color}" onmouseover="this.style.background='rgba(124,58,237,.05)';this.style.borderColor='${q.color}'" onmouseout="this.style.background='var(--bg2)';this.style.borderColor='var(--border)'">
        <div style="font-size:1.5rem;margin-bottom:0.5rem">${q.icon}</div>
        <div style="font-weight:700;margin-bottom:0.25rem;color:var(--text)">${q.title}</div>
        <div style="font-size:0.85rem;color:var(--text-dim)">${q.sub}</div>
      </div>`).join('')}
    </div>
  </div>
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;">
    <h3 style="font-family:Orbitron,monospace;font-size:1.1rem;color:var(--purple);margin-bottom:1rem"><i class="fas fa-bolt"></i> Platform Tip</h3>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:1rem;font-family:'Share Tech Mono',monospace;font-size:0.85rem;color:var(--text-mid);line-height:1.8" id="tip-box">
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
  if (msgEl) msgEl.innerHTML = '<div class="alert" style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);color:var(--purple)"><i class="fas fa-spinner fa-spin"></i> Redirecting to Google sign-in...</div>';

  if (!window.firebaseAuth || !window.googleProvider) {
    if (msgEl) msgEl.innerHTML = '<div class="alert alert-error">Firebase not ready. Please add your Firebase web config to index.html.</div>';
    return;
  }

  try {
    // Try popup first, fall back to redirect if blocked
    try {
      const result = await window.signInWithPopup(window.firebaseAuth, window.googleProvider);
      const googleUser = result.user;
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
    } catch (popupErr) {
      // Popup was blocked — fall back to redirect
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user') {
        await window.signInWithRedirect(window.firebaseAuth, window.googleProvider);
        // Page will reload after redirect — result handled in index.html
      } else {
        throw popupErr;
      }
    }
  } catch (err) {
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
          <span style="margin-left:1rem;font-family:Orbitron,monospace;color:var(--cyan)">${ch.points} pts</span>
        </div>
        <button class="modal-close" onclick="closeChallengeModal()">✕</button>
      </div>
      <h2 style="font-family:Orbitron,monospace;font-size:1.3rem;margin-bottom:1rem">${ch.title}</h2>
      <div class="challenge-desc">${ch.description}</div>
      ${ch.hints&&ch.hints.length?`<div class="hint-section"><div style="color:var(--orange);font-weight:700;margin-bottom:0.5rem"><i class="fas fa-lightbulb"></i> Hints</div>${ch.hints.map(h=>`<div class="hint-item"><i class="fas fa-lightbulb"></i> ${h.text} <span style="float:right;color:#666">-${h.cost} XP</span></div>`).join('')}</div>`:''}
      <div style="margin-top:1.5rem">
        <label style="display:block;font-size:0.85rem;color:var(--text-dim);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:1px"><i class="fas fa-flag" style="color:var(--green)"></i> Submit Flag</label>
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
      <div style="display:flex;gap:1rem;margin-top:1rem;font-size:0.85rem;color:var(--text-dim)">
        <span><i class="fas fa-clock"></i> ${l.duration}</span>
        <span><i class="fas fa-star" style="color:#ffcc00"></i> +${l.xpReward} XP</span>
        ${l.completed?'<span style="color:var(--green)"><i class="fas fa-check-circle"></i> Completed</span>':''}
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
          <p style="color:var(--text-dim);margin-top:0.5rem">${l.description}</p>
        </div>
        <div style="text-align:center;background:var(--bg2);padding:1rem;border-radius:8px">
          <div style="font-family:Orbitron,monospace;font-size:1.5rem;color:var(--cyan)">+${l.xpReward}</div>
          <div style="font-size:0.8rem;color:var(--text-dim)">XP REWARD</div>
        </div>
      </div>
      <div class="section-divider"><span>Objectives</span></div>
      <ul style="list-style:none;margin-bottom:1.5rem">${(l.objectives||[]).map(o=>`<li style="padding:0.4rem 0;color:var(--green)"><i class="fas fa-check-circle" style="color:var(--green);margin-right:0.5rem"></i>${o}</li>`).join('')}</ul>
      <div class="section-divider"><span>Lab Steps</span></div>
      ${(l.steps||[]).map(s=>`
        <div class="lab-step">
          <div class="lab-step-num">STEP ${s.stepNumber}</div>
          <div style="font-weight:700;font-size:1.05rem;margin-bottom:0.5rem">${s.title}</div>
          <div style="color:var(--text-dim);margin-bottom:0.75rem;line-height:1.6">${s.instruction}</div>
          ${s.command?`<div class="lab-cmd" onclick="copyCmd('${s.command.replace(/'/g,"\\'")}',this)" title="Click to copy">${s.command}</div>`:''}
          ${s.expectedOutput?`<div style="font-size:0.85rem;color:var(--text-dim);margin-top:0.5rem"><i class="fas fa-terminal"></i> Expected: <span style="color:var(--green);font-family:'Share Tech Mono',monospace">${s.expectedOutput}</span></div>`:''}
          ${s.hint?`<div style="margin-top:0.5rem;padding:0.5rem 0.75rem;background:rgba(255,102,0,0.1);border-left:3px solid var(--orange);border-radius:4px;font-size:0.85rem;color:var(--orange)"><i class="fas fa-lightbulb"></i> ${s.hint}</div>`:''}
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
  navigator.clipboard?.writeText(cmd).then(()=>{ el.style.borderColor='var(--green)'; setTimeout(()=>el.style.borderColor='',1000); });
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
      <p style="color:var(--text-dim);line-height:1.7;margin-bottom:1.5rem">${t.description}</p>
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
let termState = {
  cwd: '/home/kali',
  mode: 'bash', // 'bash', 'msfconsole', 'meterpreter'
  msfModule: '',
  meterpreterTarget: '',
  vfs: {
    '/home/kali': { type: 'dir' },
    '/home/kali/Desktop': { type: 'dir' },
    '/home/kali/Documents': { type: 'dir' },
    '/home/kali/Downloads': { type: 'dir' },
    '/home/kali/Tools': { type: 'dir' },
    '/home/kali/ctf_workspace': { type: 'dir' },
    '/home/kali/ctf_workspace/flag.txt': { type: 'file', content: 'CyberForge{k4l1_l1nux_m4st3r_2026}' },
    '/home/kali/ctf_workspace/target_notes.txt': { type: 'file', content: 'Target IP: 10.10.10.5\nVulnerable service: vsftpd 2.3.4 & Apache 2.4.51\nCheck /admin directory and database' },
    '/home/kali/ctf_workspace/hash.txt': { type: 'file', content: '5f4dcc3b5aa765d61d8327deb882cf99' },
    '/home/kali/wordlists': { type: 'dir' },
    '/home/kali/wordlists/rockyou.txt': { type: 'file', content: '123456\npassword\n12345678\nadmin\ncyberforge\nsupersecret\nletmein\nhacker\nmonster\nshadow\n123456789' },
    '/home/kali/wordlists/common.txt': { type: 'file', content: 'admin\nlogin\nsecret\nuploads\nconfig.php\napi\ndashboard\ndata\ndb\nbackup' },
    '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin' },
    '/etc/shadow': { type: 'file', content: 'root:$6$v1S2...:19000:0:99999:7:::\nkali:$6$x9K8...:19000:0:99999:7:::' },
    '/usr/bin': { type: 'dir' }
  },
  installedTools: new Set(['nmap', 'hydra', 'hashcat', 'whoami', 'ifconfig', 'ping', 'curl', 'wget', 'cat', 'ls', 'pwd', 'mkdir', 'touch', 'rm', 'cd', 'echo', 'chmod', 'nano', 'python3', 'help', 'git', 'apt', 'apt-get', 'msfconsole', 'gobuster', 'sqlmap', 'nikto', 'nc', 'john', 'airmon-ng', 'airodump-ng']),
  history: [],
  historyIdx: -1,
  isExecuting: false
};

function getPromptHTML() {
  if (termState.mode === 'msfconsole') {
    const modStr = termState.msfModule ? ` exploit(<span style="color:#ff2a85">${termState.msfModule}</span>)` : '';
    return `<span class="term-prompt-msf">msf6${modStr} &gt;&nbsp;</span>`;
  }
  if (termState.mode === 'meterpreter') {
    return `<span class="term-prompt-meterpreter">meterpreter &gt;&nbsp;</span>`;
  }
  let displayCwd = termState.cwd;
  if (displayCwd.startsWith('/home/kali')) {
    displayCwd = '~' + displayCwd.slice(10);
  }
  return `<span class="term-prompt-kali">┌──(kali㉿cyberforge)-[${displayCwd}]<br>└─$&nbsp;</span>`;
}

function updatePromptUI() {
  const p = $('term-prompt-el');
  if (p) p.innerHTML = getPromptHTML();
}

function renderTerminalPage() {
  const quickCmds = [
    'git clone https://github.com/sqlmapproject/sqlmap.git',
    'apt install gobuster',
    'nmap -sV -sC 10.10.10.5',
    'msfconsole',
    'gobuster dir -u http://10.10.10.5 -w wordlists/common.txt',
    'sqlmap -u "http://10.10.10.5/item?id=1" --dbs',
    'hydra -l admin -P wordlists/rockyou.txt ssh://10.10.10.5',
    'airmon-ng start wlan0',
    'cat ctf_workspace/flag.txt',
    'help'
  ];

  return `<div class="page-header">
    <div class="page-title">💻 Live <span>Terminal</span></div>
    <div class="page-sub">Interactive Kali Linux Terminal — Real-time tools, git cloning, nmap scanning & live hacking</div>
  </div>
  <div style="background:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.25);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.85rem;color:#00e5ff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem">
    <div><i class="fas fa-terminal"></i> <strong>Kali Linux Real-time Terminal Engine</strong> — Practice real hacking tools, VFS commands, git repo installs, and target scans in real-time.</div>
    <button onclick="resetVFSDialog()" class="btn btn-outline" style="padding:0.25rem 0.65rem;font-size:0.75rem;border-color:rgba(0,229,255,0.4);color:#00e5ff"><i class="fas fa-undo"></i> Reset VFS</button>
  </div>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
      <span class="terminal-title" id="term-title-text">kali@cyberforge: ${termState.cwd} — bash</span>
      <button onclick="clearTerminal()" style="background:none;border:1px solid #1f2a3c;color:#7b8ca5;padding:0.2rem 0.6rem;border-radius:4px;cursor:pointer;font-size:0.75rem;margin-left:1rem">CLEAR</button>
    </div>
    <div class="terminal-output" id="term-output">
      <div class="term-line" style="color:#00ff66;font-weight:700">CyberForge Academy - Kali Linux v2026.1 (x86_64)</div>
      <div class="term-line" style="color:#00e5ff">Type 'help' to view available tools & commands. Real-time scanning, git clone & msfconsole enabled.</div>
      <div class="term-line" style="color:#ffe600">🐉 Practice safely in this interactive sandbox environment.</div>
      <div class="term-line">&nbsp;</div>
    </div>
    <div class="terminal-input-row">
      <span id="term-prompt-el">${getPromptHTML()}</span>
      <input class="term-input" id="term-input" placeholder="Type a command (e.g. nmap -sV 10.10.10.5 or git clone ...)" autocomplete="off" spellcheck="false"/>
    </div>
  </div>
  <div style="margin-top:1.5rem">
    <div class="page-title" style="font-size:1.1rem;margin-bottom:0.75rem">⚡ Real-time Quick Commands</div>
    <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
      ${quickCmds.map(cmd =>
        `<button onclick="runQuickCmd('${cmd.replace(/'/g, "\\'")}')" style="background:rgba(15,21,32,0.8);border:1px solid #1f2a3c;color:#00e5ff;padding:0.4rem 0.8rem;border-radius:6px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:0.8rem;transition:all 0.2s" onmouseover="this.style.borderColor='#00e5ff';this.style.background='rgba(0,229,255,0.08)'" onmouseout="this.style.borderColor='#1f2a3c';this.style.background='rgba(15,21,32,0.8)'">${cmd}</button>`
      ).join('')}
    </div>
  </div>`;
}

function initTerminal() {
  const input = $('term-input');
  if (!input) return;

  updatePromptUI();

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      if (cmd) {
        input.value = '';
        termState.history.unshift(cmd);
        termState.historyIdx = -1;
        execTermCmd(cmd);
      }
    }
    if (e.key === 'ArrowUp') {
      termState.historyIdx = Math.min(termState.historyIdx + 1, termState.history.length - 1);
      input.value = termState.history[termState.historyIdx] || '';
      e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
      termState.historyIdx = Math.max(termState.historyIdx - 1, -1);
      input.value = termState.history[termState.historyIdx] || '';
      e.preventDefault();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete(input.value);
    }
  });

  input.focus();
}

function resolvePath(pathStr) {
  if (!pathStr || pathStr === '.') return termState.cwd;
  if (pathStr === '~' || pathStr === '~/') return '/home/kali';
  if (pathStr.startsWith('~/')) return '/home/kali/' + pathStr.slice(2);
  if (pathStr.startsWith('/')) return pathStr;
  
  let parts = termState.cwd.split('/').concat(pathStr.split('/'));
  let resolved = [];
  for (let p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (resolved.length > 0) resolved.pop();
    } else {
      resolved.push(p);
    }
  }
  return '/' + resolved.join('/');
}

function appendTermLine(cmd, outputHTML, isRaw = false) {
  const out = $('term-output');
  if (!out) return;
  const div = document.createElement('div');
  div.className = 'term-line';

  if (isRaw) {
    div.innerHTML = outputHTML;
  } else {
    div.innerHTML = `<div style="margin-top:0.4rem">${getPromptHTML()}<span class="term-command">${escapeHtml(cmd)}</span></div><div class="term-result">${outputHTML}</div>`;
  }
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

function streamLines(cmd, lines, delayPerLine = 300, onComplete = null) {
  termState.isExecuting = true;
  const out = $('term-output');
  if (!out) return;

  const headerDiv = document.createElement('div');
  headerDiv.className = 'term-line';
  headerDiv.innerHTML = `<div style="margin-top:0.4rem">${getPromptHTML()}<span class="term-command">${escapeHtml(cmd)}</span></div>`;
  out.appendChild(headerDiv);

  let i = 0;
  const interval = setInterval(() => {
    if (i < lines.length) {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'term-line term-result';
      lineDiv.innerHTML = lines[i];
      out.appendChild(lineDiv);
      out.scrollTop = out.scrollHeight;
      i++;
    } else {
      clearInterval(interval);
      termState.isExecuting = false;
      if (onComplete) onComplete();
    }
  }, delayPerLine);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function execTermCmd(cmdStr) {
  if (termState.isExecuting) return;
  const rawCmd = cmdStr.trim();
  if (!rawCmd) return;
  const parts = rawCmd.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // ---- METASPLOIT MODE ----
  if (termState.mode === 'msfconsole') {
    handleMsfCmd(rawCmd, cmd, args);
    return;
  }
  // ---- METERPRETER MODE ----
  if (termState.mode === 'meterpreter') {
    handleMeterpreterCmd(rawCmd, cmd, args);
    return;
  }

  // ---- BASH SHELL MODE ----
  switch (cmd) {
    case 'clear':
      clearTerminal();
      break;

    case 'pwd':
      appendTermLine(rawCmd, termState.cwd);
      break;

    case 'whoami':
      appendTermLine(rawCmd, '<span class="term-success">kali</span>');
      break;

    case 'id':
      appendTermLine(rawCmd, 'uid=1000(kali) gid=1000(kali) groups=1000(kali),24(cdrom),27(sudo),100(users)');
      break;

    case 'uname':
    case 'uname -a':
      appendTermLine(rawCmd, 'Linux kali 6.6.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.13-1kali1 (2026-01-15) x86_64 GNU/Linux');
      break;

    case 'ifconfig':
    case 'ip':
      appendTermLine(rawCmd, `<span class="term-info">eth0: flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt;  mtu 1500
        inet 10.10.14.2  netmask 255.255.255.0  broadcast 10.10.14.255
        ether 00:0c:29:8f:b3:a1  txqueuelen 1000  (Ethernet)

wlan0: flags=4099&lt;UP,BROADCAST,MULTICAST&gt;  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0
        ether a4:c3:f0:12:34:56  txqueuelen 1000  (Wireless)

lo: flags=73&lt;UP,LOOPBACK,RUNNING&gt;  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0</span>`);
      break;

    case 'cd':
      let targetDir = resolvePath(args[0] || '~');
      if (termState.vfs[targetDir] && termState.vfs[targetDir].type === 'dir') {
        termState.cwd = targetDir;
        updatePromptUI();
        const t = $('term-title-text');
        if (t) t.textContent = `kali@cyberforge: ${termState.cwd} — bash`;
        appendTermLine(rawCmd, '');
      } else {
        appendTermLine(rawCmd, `<span class="term-error">bash: cd: ${args[0] || ''}: No such file or directory</span>`);
      }
      break;

    case 'ls':
      let showAll = rawCmd.includes('-a') || rawCmd.includes('-la') || rawCmd.includes('-al');
      let longFmt = rawCmd.includes('-l') || rawCmd.includes('-la') || rawCmd.includes('-al');
      
      let dirPath = termState.cwd;
      const nonFlagArg = args.find(a => !a.startsWith('-'));
      if (nonFlagArg) dirPath = resolvePath(nonFlagArg);

      let items = Object.keys(termState.vfs).filter(p => {
        let parent = p.substring(0, p.lastIndexOf('/')) || '/';
        return parent === dirPath && p !== dirPath;
      });

      if (items.length === 0) {
        appendTermLine(rawCmd, '');
        break;
      }

      if (longFmt) {
        let res = `total ${items.length * 4}\n`;
        res += items.map(p => {
          let item = termState.vfs[p];
          let name = p.substring(p.lastIndexOf('/') + 1);
          let perm = item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
          let colorClass = item.type === 'dir' ? '#00e5ff' : '#00ff66';
          return `${perm} 1 kali kali 4096 Jan 15 12:00 <span style="color:${colorClass}">${name}${item.type === 'dir' ? '/' : ''}</span>`;
        }).join('\n');
        appendTermLine(rawCmd, res);
      } else {
        let res = items.map(p => {
          let item = termState.vfs[p];
          let name = p.substring(p.lastIndexOf('/') + 1);
          let colorClass = item.type === 'dir' ? '#00e5ff' : '#00ff66';
          return `<span style="color:${colorClass}">${name}${item.type === 'dir' ? '/' : ''}</span>`;
        }).join('  ');
        appendTermLine(rawCmd, res);
      }
      break;

    case 'mkdir':
      if (!args[0]) {
        appendTermLine(rawCmd, '<span class="term-error">mkdir: missing operand</span>');
        break;
      }
      let newDir = resolvePath(args[0]);
      termState.vfs[newDir] = { type: 'dir' };
      appendTermLine(rawCmd, `<span class="term-success">Directory created: ${newDir}</span>`);
      break;

    case 'touch':
      if (!args[0]) {
        appendTermLine(rawCmd, '<span class="term-error">touch: missing operand</span>');
        break;
      }
      let newFile = resolvePath(args[0]);
      termState.vfs[newFile] = { type: 'file', content: '' };
      appendTermLine(rawCmd, '');
      break;

    case 'cat':
      if (!args[0]) {
        appendTermLine(rawCmd, '<span class="term-error">cat: missing operand</span>');
        break;
      }
      let targetFile = resolvePath(args[0]);
      let fileObj = termState.vfs[targetFile];
      if (fileObj && fileObj.type === 'file') {
        let isFlag = fileObj.content.includes('CyberForge{');
        let contentFmt = isFlag ? `<span class="term-flag">${escapeHtml(fileObj.content)}</span>` : escapeHtml(fileObj.content);
        appendTermLine(rawCmd, contentFmt);
      } else {
        appendTermLine(rawCmd, `<span class="term-error">cat: ${args[0]}: No such file or directory</span>`);
      }
      break;

    case 'echo':
      let gtIdx = args.indexOf('>');
      let ggtIdx = args.indexOf('>>');
      if (gtIdx !== -1 || ggtIdx !== -1) {
        let isAppend = ggtIdx !== -1;
        let opIdx = isAppend ? ggtIdx : gtIdx;
        let textVal = args.slice(0, opIdx).join(' ').replace(/^['"]|['"]$/g, '');
        let destFile = resolvePath(args[opIdx + 1]);
        if (!termState.vfs[destFile]) {
          termState.vfs[destFile] = { type: 'file', content: '' };
        }
        if (isAppend) {
          termState.vfs[destFile].content += '\n' + textVal;
        } else {
          termState.vfs[destFile].content = textVal;
        }
        appendTermLine(rawCmd, '');
      } else {
        appendTermLine(rawCmd, escapeHtml(args.join(' ')));
      }
      break;

    case 'rm':
      if (!args[0]) {
        appendTermLine(rawCmd, '<span class="term-error">rm: missing operand</span>');
        break;
      }
      let targetRm = resolvePath(args.find(a => !a.startsWith('-')) || '');
      if (termState.vfs[targetRm]) {
        delete termState.vfs[targetRm];
        appendTermLine(rawCmd, '');
      } else {
        appendTermLine(rawCmd, `<span class="term-error">rm: cannot remove '${args[0]}': No such file or directory</span>`);
      }
      break;

    case 'nano':
    case 'vim':
      openNanoEditor(rawCmd, args[0]);
      break;

    // ---- REALTIME TOOL INSTALLATION: GIT CLONE ----
    case 'git':
      if (args[0] === 'clone') {
        let repoUrl = args[1] || 'https://github.com/sqlmapproject/sqlmap.git';
        let repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1).replace('.git', '') || 'repo';
        let repoPath = resolvePath(repoName);

        const gitLines = [
          `<span class="term-info">Cloning into '${repoName}'...</span>`,
          `remote: Enumerating objects: 12450, done.`,
          `remote: Counting objects: 100% (1450/1450), done.`,
          `remote: Compressing objects: 100% (520/520), done.`,
          `remote: Total 12450 (delta 910), reused 1350 (delta 840)`,
          `Receiving objects: 100% (12450/12450), 24.50 MiB | 18.20 MiB/s, done.`,
          `Resolving deltas: 100% (8900/8900), done.`,
          `<span class="term-success">✓ Repository '${repoName}' successfully cloned into ${repoPath}</span>`,
          `<span class="term-info">Tip: You can now 'cd ${repoName}' and execute tools directly!</span>`
        ];

        streamLines(rawCmd, gitLines, 250, () => {
          termState.vfs[repoPath] = { type: 'dir' };
          termState.vfs[repoPath + '/' + repoName + '.py'] = { type: 'file', content: `#!/usr/bin/env python3\nprint("[+] ${repoName} tool active and ready.")` };
          termState.vfs[repoPath + '/README.md'] = { type: 'file', content: `# ${repoName}\nInstalled via git clone on CyberForge Kali Linux.` };
          termState.installedTools.add(repoName.toLowerCase());
        });
      } else {
        appendTermLine(rawCmd, 'usage: git clone &lt;repository&gt;');
      }
      break;

    // ---- REALTIME TOOL INSTALLATION: APT INSTALL ----
    case 'apt':
    case 'apt-get':
      if (args[0] === 'install' || args[0] === 'update') {
        let pkgName = args[1] || 'tool';
        const aptLines = [
          `Reading package lists... Done`,
          `Building dependency tree... Done`,
          `Reading state information... Done`,
          args[0] === 'update' ? `<span class="term-success">All packages are up to date.</span>` : `The following NEW packages will be installed: <span class="term-info">${pkgName}</span>`,
          `Need to get 3,840 kB of archives.`,
          `Get:1 http://http.kali.org/kali kali-rolling/main amd64 ${pkgName} [3,840 kB]`,
          `Fetched 3,840 kB in 1s (3,840 kB/s)`,
          `Selecting previously unselected package ${pkgName}.`,
          `(Reading database ... 245120 files currently installed.)`,
          `Unpacking ${pkgName} ...`,
          `Setting up ${pkgName} ...`,
          `Processing triggers for man-db ...`,
          `<span class="term-success">✓ Package '${pkgName}' installed in /usr/bin/${pkgName}.</span>`
        ];

        streamLines(rawCmd, aptLines, 200, () => {
          termState.installedTools.add(pkgName.toLowerCase());
        });
      } else {
        appendTermLine(rawCmd, 'Usage: apt install &lt;package&gt; | apt update');
      }
      break;

    // ---- REALTIME NMAP SCANNING ENGINE ----
    case 'nmap':
      let targetIp = args.find(a => !a.startsWith('-')) || '10.10.10.5';
      let isAggr = rawCmd.includes('-A');
      let isVer = rawCmd.includes('-sV') || isAggr;
      let isScript = rawCmd.includes('-sC') || isAggr;

      const nmapLines = [
        `<span class="term-info">Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()}</span>`,
        `Initiating ARP Ping Scan at ${new Date().toLocaleTimeString()}`,
        `Scanning ${targetIp} [1 port]`,
        `Completed ARP Ping Scan at ${new Date().toLocaleTimeString()}, 0.03s elapsed (1 total hosts)`,
        `Initiating SYN Stealth Scan at ${new Date().toLocaleTimeString()}`,
        `Scanning ${targetIp} [1000 ports]`,
        `<span class="term-success">Discovered open port 21/tcp on ${targetIp}</span>`,
        `<span class="term-success">Discovered open port 22/tcp on ${targetIp}</span>`,
        `<span class="term-success">Discovered open port 80/tcp on ${targetIp}</span>`,
        `<span class="term-success">Discovered open port 3306/tcp on ${targetIp}</span>`,
        `Completed SYN Stealth Scan at ${new Date().toLocaleTimeString()}, 1.20s elapsed (1000 total ports)`,
      ];

      if (isVer) {
        nmapLines.push(`Initiating Service scan at ${new Date().toLocaleTimeString()}`);
        nmapLines.push(`Scanning 4 services on ${targetIp}`);
        nmapLines.push(`Completed Service scan at ${new Date().toLocaleTimeString()}, 0.85s elapsed`);
      }

      nmapLines.push(`Nmap scan report for <span class="term-info">${targetIp}</span>`);
      nmapLines.push(`Host is up (0.0012s latency).`);
      nmapLines.push(`PORT     STATE SERVICE    VERSION`);
      nmapLines.push(`21/tcp   open  ftp        <span class="term-warn">vsftpd 2.3.4 (VULNERABLE)</span>`);
      nmapLines.push(`22/tcp   open  ssh        OpenSSH 8.4p1 Debian 5`);
      nmapLines.push(`80/tcp   open  http       Apache httpd 2.4.51 ((Unix) OpenSSL/1.1.1k)`);
      if (isScript) {
        nmapLines.push(`|_http-title: CyberForge Target Server - Login`);
        nmapLines.push(`| http-methods: GET HEAD POST OPTIONS`);
      }
      nmapLines.push(`3306/tcp open  mysql      MySQL 8.0.27`);
      if (isAggr) {
        nmapLines.push(`OS details: Linux 5.4 - 5.15 (Debian 11)`);
        nmapLines.push(`Network Distance: 1 hop`);
      }
      nmapLines.push(`<span class="term-success">Nmap done: 1 IP address (1 host up) scanned in 2.84 seconds</span>`);

      streamLines(rawCmd, nmapLines, 220);
      break;

    // ---- REALTIME METASPLOIT FRAMEWORK ----
    case 'msfconsole':
    case 'metasploit':
      const msfLines = [
        `<span class="term-prompt-msf">
  ─────────────【 METASPLOIT FRAMEWORK v6.3.4 】─────────────
  + -- --=[ 2380 exploits - 1240 auxiliary - 415 post       ]
  + -- --=[ 970 payloads - 46 encoders - 11 nops           ]
  ───────────────────────────────────────────────────────────</span>`,
        `<span class="term-info">Type 'search &lt;name&gt;' or 'use &lt;exploit&gt;' to load exploit module.</span>`
      ];
      streamLines(rawCmd, msfLines, 150, () => {
        termState.mode = 'msfconsole';
        updatePromptUI();
      });
      break;

    // ---- REALTIME GOBUSTER / DIRB ----
    case 'gobuster':
    case 'dirb':
    case 'dirsearch':
      let urlTarget = args.find(a => a.startsWith('http')) || 'http://10.10.10.5';
      const gobusterLines = [
        `<span class="term-info">===============================================================</span>`,
        `<span class="term-info">Gobuster v3.6 - Directory Brute-forcing Engine</span>`,
        `<span class="term-info">===============================================================</span>`,
        `[+] Url:         ${urlTarget}`,
        `[+] Method:      GET`,
        `[+] Threads:     10`,
        `[+] Wordlist:    wordlists/common.txt`,
        `<span class="term-info">===============================================================</span>`,
        `Starting gobuster in directory enumeration mode`,
        `<span class="term-info">===============================================================</span>`,
        `<span class="term-success">/admin                (Status: 200) [Size: 4512]</span>`,
        `<span class="term-success">/login                (Status: 200) [Size: 2150]</span>`,
        `<span class="term-warn">/secret               (Status: 301) [Size: 180] [--&gt; /secret/]</span>`,
        `<span class="term-success">/uploads              (Status: 200) [Size: 1205]</span>`,
        `<span class="term-success">/config.php           (Status: 200) [Size: 840]</span>`,
        `<span class="term-flag">/flag.php             (Status: 200) [Size: 64]</span>`,
        `<span class="term-info">===============================================================</span>`,
        `<span class="term-success">Finished scanning 10 words in 1.25s</span>`
      ];
      streamLines(rawCmd, gobusterLines, 200);
      break;

    // ---- REALTIME SQLMAP ENGINE ----
    case 'sqlmap':
      const sqlmapLines = [
        `<span class="term-info">        ___</span>`,
        `<span class="term-info">       __H__</span>`,
        `<span class="term-info"> ___ ___["]_____ ___ ___  {1.7.11#stable}</span>`,
        `<span class="term-info">|_ -| . [']     | .'| . | https://sqlmap.org</span>`,
        `<span class="term-info">|___|_  ["]_|_|_|__,|  _|</span>`,
        `<span class="term-info">      |_|           |_|</span>`,
        `[12:34:00] [INFO] testing connection to the target URL`,
        `[12:34:01] [INFO] testing if GET parameter 'id' is dynamic`,
        `[12:34:01] [INFO] GET parameter 'id' appears to be dynamic`,
        `[12:34:02] [INFO] testing for SQL injection on GET parameter 'id'`,
        `<span class="term-success">[+] GET parameter 'id' is VULNERABLE to Boolean-based blind & UNION query injection!</span>`,
        `[12:34:03] [INFO] fetching database names`,
        `available databases [2]:`,
        `[*] information_schema`,
        `<span class="term-info">[*] cyber_db</span>`,
        `[12:34:04] [INFO] dumping table 'users'`,
        `+----+----------+----------------------------------+----------------------------------+`,
        `| id | username | password_hash                    | flag                             |`,
        `+----+----------+----------------------------------+----------------------------------+`,
        `| 1  | admin    | 5f4dcc3b5aa765d61d8327deb882cf99 | <span class="term-flag">CyberForge{sql_1nj3ct10n_m4st3r}</span>|`,
        `| 2  | root     | 21232f297a57a5a743894a0e4a801fc3 | NULL                             |`,
        `+----+----------+----------------------------------+----------------------------------+`
      ];
      streamLines(rawCmd, sqlmapLines, 200);
      break;

    // ---- REALTIME HYDRA PASS CRACKER ----
    case 'hydra':
      const hydraLines = [
        `<span class="term-info">Hydra v9.5 (c) 2026 by van Hauser/THC - Realtime Brute-force Engine</span>`,
        `[DATA] max 16 tasks per 1 server, 1 server, 10 login tries`,
        `[ATTACK] attacking ssh://10.10.10.5:22/`,
        `[STATUS] 4.00 tries/min, 4 tries total`,
        `<span class="term-success">[22][ssh] host: 10.10.10.5   login: admin   password: cyberforge</span>`,
        `<span class="term-success">✓ 1 of 1 target successfully completed, 1 password found</span>`
      ];
      streamLines(rawCmd, hydraLines, 250);
      break;

    // ---- REALTIME HASHCAT / JOHN ----
    case 'hashcat':
    case 'john':
      const hashLines = [
        `<span class="term-info">hashcat (v6.2.6) starting in autodetect mode...</span>`,
        `Hashtype: MD5 (Raw MD5)`,
        `Speed.#1.........:  45.2 MH/s (10.20ms)`,
        `Cracking: 5f4dcc3b5aa765d61d8327deb882cf99`,
        `<span class="term-success">5f4dcc3b5aa765d61d8327deb882cf99:password</span>`,
        `<span class="term-success">✓ Cracked 1/1 hashes in 0.42 seconds</span>`
      ];
      streamLines(rawCmd, hashLines, 200);
      break;

    // ---- REALTIME NIKTO SCANNER ----
    case 'nikto':
      const niktoLines = [
        `- Nikto v2.5.0`,
        `+ Target IP:          10.10.10.5`,
        `+ Target Hostname:    target.local`,
        `+ Target Port:        80`,
        `+ Server: Apache/2.4.51 (Unix) OpenSSL/1.1.1k`,
        `<span class="term-warn">+ /admin/: Directory indexing found or admin portal exposed.</span>`,
        `<span class="term-warn">+ Allowed HTTP Methods: GET, HEAD, POST, OPTIONS, TRACE</span>`,
        `<span class="term-warn">+ OSVDB-3092: /config.php: Configuration backup file accessible.</span>`,
        `<span class="term-success">+ 7815 requests made, 3 vulnerabilities found in 2.10s</span>`
      ];
      streamLines(rawCmd, niktoLines, 200);
      break;

    // ---- REALTIME WIRELESS HACKING (AIRMON / AIRODUMP) ----
    case 'airmon-ng':
    case 'airodump-ng':
      const wifiLines = [
        `<span class="term-info">PHY    Interface    Driver        Chipset</span>`,
        `phy0   wlan0        ath9k         Atheros AR9271 (Monitor mode enabled: <span class="term-success">wlan0mon</span>)`,
        `<span class="term-info">BSSID              PWR  Beacons  #Data  CH  MB   ENC  CIPHER  ESSID</span>`,
        `00:11:22:33:44:55  -42       45    120   6  54e  WPA2 CCMP    <span class="term-success">Target_WiFi_5G</span>`,
        `AA:BB:CC:DD:EE:FF  -65       20     40  11  54e  WPA2 CCMP    Corporate_HQ`,
        `12:34:56:78:90:AB  -78       12      5   1  54e  OPN  NONE    Public_Guest`
      ];
      streamLines(rawCmd, wifiLines, 200);
      break;

    case 'help':
      appendTermLine(rawCmd, `<span class="term-info">⚡ CyberForge Kali Linux Terminal Engine Help:</span>
<span class="term-success">VFS Navigation</span> : pwd, cd &lt;dir&gt;, ls [-la], mkdir &lt;dir&gt;, touch &lt;file&gt;, cat &lt;file&gt;, echo "txt" &gt; file, rm &lt;file&gt;, nano &lt;file&gt;
<span class="term-success">Real-time Installer</span>: git clone &lt;repo-url&gt;, apt install &lt;tool&gt;, apt update
<span class="term-success">Scanners & Exploits</span>: nmap [-sV -sC -A] &lt;ip&gt;, msfconsole, gobuster dir -u &lt;url&gt;, sqlmap -u &lt;url&gt; --dbs
<span class="term-success">Password & Wifi</span>    : hydra -l user -P list ssh://ip, hashcat hash.txt list, john, airmon-ng
<span class="term-success">System Info</span>        : whoami, id, uname -a, ifconfig, clear, help`);
      break;

    default:
      if (termState.installedTools.has(cmd)) {
        appendTermLine(rawCmd, `<span class="term-success">[+] Executed installed tool '${cmd}'. Type '${cmd} --help' for options.</span>`);
      } else {
        appendTermLine(rawCmd, `<span class="term-error">bash: ${cmd}: command not found. Tip: Type 'help' or try 'apt install ${cmd}' or 'git clone ...'</span>`);
      }
      break;
  }
}

// ---- METASPLOIT COMMAND HANDLER ----
function handleMsfCmd(rawCmd, cmd, args) {
  switch (cmd) {
    case 'help':
    case '?':
      appendTermLine(rawCmd, `<span class="term-info">Metasploit Console Commands:</span>
search &lt;query&gt;    - Search exploit modules
use &lt;exploit&gt;     - Load an exploit module (e.g. use exploit/multi/http/vsftpd_234_backdoor)
show options      - Display required module options
set RHOSTS &lt;ip&gt;   - Set target IP address
run / exploit     - Launch payload execution
exit              - Exit Metasploit console`);
      break;

    case 'search':
      const q = args.join(' ').toLowerCase();
      appendTermLine(rawCmd, `<span class="term-info">Matching Modules:</span>
#  Name                                      Disclosure Date  Rank       Check  Description
-  ----                                      ---------------  ----       -----  -----------
0  <span class="term-success">exploit/multi/http/vsftpd_234_backdoor</span>   2011-07-03       excellent  Yes    VSFTPD v2.3.4 Backdoor Command Execution
1  exploit/windows/smb/ms17_010_eternalblue  2017-03-14       average    Yes    MS17-010 EternalBlue SMB RCE
2  exploit/multi/http/apache_log4j_rce      2021-12-10       excellent  Yes    Apache Log4j RCE Remote Code Execution`);
      break;

    case 'use':
      termState.msfModule = args[0] || 'exploit/multi/http/vsftpd_234_backdoor';
      updatePromptUI();
      appendTermLine(rawCmd, `<span class="term-info">Using module: ${termState.msfModule}</span>`);
      break;

    case 'show':
      if (args[0] === 'options') {
        appendTermLine(rawCmd, `<span class="term-info">Module options (${termState.msfModule || 'vsftpd_234_backdoor'}):</span>
   Name     Current Setting  Required  Description
   ----     ---------------  --------  -----------
   RHOSTS   ${termState.meterpreterTarget || '10.10.10.5'}       yes       The target host(s)
   RPORT    21               yes       The target port
   LHOST    10.10.14.2       yes       Listen host`);
      } else {
        appendTermLine(rawCmd, 'Usage: show options');
      }
      break;

    case 'set':
      if (args[0] && args[0].toUpperCase() === 'RHOSTS') {
        termState.meterpreterTarget = args[1] || '10.10.10.5';
        appendTermLine(rawCmd, `RHOSTS =&gt; ${termState.meterpreterTarget}`);
      } else {
        appendTermLine(rawCmd, `${args[0]} =&gt; ${args[1] || 'set'}`);
      }
      break;

    case 'run':
    case 'exploit':
      const expLines = [
        `<span class="term-info">[*] Started reverse TCP handler on 10.10.14.2:4444</span>`,
        `[*] Executing automatic check on target ${termState.meterpreterTarget || '10.10.10.5'}...`,
        `<span class="term-success">[+] Target is vulnerable to VSFTPD v2.3.4 backdoor!</span>`,
        `[*] Sending stage (175284 bytes) to ${termState.meterpreterTarget || '10.10.10.5'}`,
        `<span class="term-flag">[*] Meterpreter session 1 opened (10.10.14.2:4444 -&gt; ${termState.meterpreterTarget || '10.10.10.5'}:49152)</span>`,
        `<span class="term-info">Welcome to Meterpreter session! Type 'sysinfo', 'hashdump', or 'shell'.</span>`
      ];
      streamLines(rawCmd, expLines, 200, () => {
        termState.mode = 'meterpreter';
        updatePromptUI();
      });
      break;

    case 'exit':
      termState.mode = 'bash';
      updatePromptUI();
      appendTermLine(rawCmd, `<span class="term-info">Exited Metasploit. Returned to Kali bash shell.</span>`);
      break;

    default:
      appendTermLine(rawCmd, `<span class="term-error">msf: Unknown command '${cmd}'. Type 'help' for Metasploit commands.</span>`);
      break;
  }
}

// ---- METERPRETER COMMAND HANDLER ----
function handleMeterpreterCmd(rawCmd, cmd, args) {
  switch (cmd) {
    case 'sysinfo':
      appendTermLine(rawCmd, `<span class="term-info">Computer        : CYBERFORGE-TARGET
OS              : Linux 5.4.0-105-generic (x86_64)
Architecture    : x64
Meterpreter     : php/linux</span>`);
      break;

    case 'getuid':
      appendTermLine(rawCmd, `<span class="term-flag">Server username: root (uid=0)</span>`);
      break;

    case 'hashdump':
      appendTermLine(rawCmd, `<span class="term-flag">Dumping SAM / /etc/shadow hashes:
root:$6$xK89sL21$rZ2...:0:0:root:/root:/bin/bash
admin:$5$mP90aL12$uY4...:1000:1000:Admin:/home/admin:/bin/bash
kali:$6$vS34bM90$pT1...:1001:1001:Kali:/home/kali:/bin/bash</span>`);
      break;

    case 'shell':
      appendTermLine(rawCmd, `<span class="term-flag">Process 4512 created. Spawning root shell...
root@cyberforge-target:~# cat /root/root.txt
CyberForge{m3t4spl01t_r00t_0wn3d_2026}</span>`);
      break;

    case 'cat':
      appendTermLine(rawCmd, `<span class="term-flag">CyberForge{m3t4spl01t_r00t_0wn3d_2026}</span>`);
      break;

    case 'exit':
      termState.mode = 'msfconsole';
      updatePromptUI();
      appendTermLine(rawCmd, `<span class="term-info">Closed Meterpreter session 1. Returned to msf6.</span>`);
      break;

    default:
      appendTermLine(rawCmd, `<span class="term-error">meterpreter: command '${cmd}' not found. Try 'sysinfo', 'getuid', 'hashdump', 'shell', 'exit'.</span>`);
      break;
  }
}

// ---- NANO INLINE TEXT EDITOR ----
function openNanoEditor(cmd, fileName) {
  if (!fileName) fileName = 'untitled.txt';
  let filePath = resolvePath(fileName);
  let fileContent = termState.vfs[filePath] ? termState.vfs[filePath].content : '';

  const out = $('term-output');
  if (!out) return;

  const box = document.createElement('div');
  box.className = 'nano-editor-box';
  box.id = 'active-nano-editor';
  box.innerHTML = `
    <div class="nano-header">
      <span>GNU nano 7.2 — ${fileName}</span>
      <span>[ Ctrl+O Save &nbsp;|&nbsp; Ctrl+X Exit ]</span>
    </div>
    <textarea class="nano-textarea" id="nano-content">${escapeHtml(fileContent)}</textarea>
    <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-green" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="saveNano('${filePath.replace(/'/g, "\\'")}')"><i class="fas fa-save"></i> Save (Ctrl+O)</button>
      <button class="btn btn-red" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="closeNano()"><i class="fas fa-times"></i> Exit (Ctrl+X)</button>
    </div>
  `;

  out.appendChild(box);
  out.scrollTop = out.scrollHeight;
}

function saveNano(filePath) {
  const txt = $('nano-content');
  if (txt) {
    termState.vfs[filePath] = { type: 'file', content: txt.value };
    appendTermLine('', `<span class="term-success">[ Wrote ${txt.value.length} bytes to ${filePath} ]</span>`, true);
  }
  closeNano();
}

function closeNano() {
  const box = $('active-nano-editor');
  if (box) box.remove();
}

function clearTerminal() {
  const out = $('term-output');
  if (out) {
    out.innerHTML = `<div class="term-line" style="color:#00e5ff">Terminal cleared. Mode: ${termState.mode}. Type 'help' for tools.</div>`;
  }
}

function resetVFSDialog() {
  termState.cwd = '/home/kali';
  termState.mode = 'bash';
  updatePromptUI();
  clearTerminal();
}

function runQuickCmd(cmd) {
  const input = $('term-input');
  if (input) {
    input.value = cmd;
    input.focus();
    execTermCmd(cmd);
    termState.history.unshift(cmd);
    input.value = '';
  }
}

function autocomplete(partial) {
  if (!partial) return;
  const bashCmds = ['nmap', 'msfconsole', 'gobuster', 'sqlmap', 'hydra', 'hashcat', 'nikto', 'git', 'apt', 'ls', 'cd', 'cat', 'nano', 'mkdir', 'touch', 'rm', 'whoami', 'id', 'ifconfig', 'ping', 'curl', 'clear', 'help'];
  
  // Find matching file or directory in cwd
  let items = Object.keys(termState.vfs).filter(p => {
    let parent = p.substring(0, p.lastIndexOf('/')) || '/';
    return parent === termState.cwd;
  }).map(p => p.substring(p.lastIndexOf('/') + 1));

  const candidates = bashCmds.concat(items);
  const match = candidates.find(c => c.startsWith(partial));

  if (match) {
    const input = $('term-input');
    if (input) {
      if (partial.includes(' ')) {
        let parts = partial.split(' ');
        parts[parts.length - 1] = match;
        input.value = parts.join(' ');
      } else {
        input.value = match;
      }
    }
  }
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
      <div style="display:flex;gap:1rem;margin-top:0.75rem;font-size:0.85rem;color:var(--text-dim)">
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
          <div style="display:flex;gap:1.5rem;margin-top:0.5rem;color:var(--text-dim);font-size:0.9rem">
            <span><i class="fas fa-clock"></i> ${m.duration}</span>
            <span><i class="fas fa-star" style="color:#ffcc00"></i> +${m.xp} XP</span>
          </div>
        </div>
      </div>
      <div style="background:var(--bg2);border-radius:8px;padding:1.2rem;margin-bottom:1.5rem;line-height:1.7;color:var(--text-mid)">
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
        <td style="font-size:0.85rem;color:var(--text-dim)">${p.rank}</td>
        <td style="font-family:Orbitron,monospace;color:var(--cyan)">${p.xp.toLocaleString()}</td>
        <td>Lv.${p.level}</td>
        <td><i class="fas fa-flag" style="color:var(--green)"></i> ${p.challengesSolved}</td>
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
        ${t.completed?'<span style="color:var(--green);font-size:0.85rem"><i class="fas fa-check-circle"></i> Completed</span>':''}
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
          <p style="color:var(--text-dim);line-height:1.6">${task.description}</p>
          ${task.hints?.length?`<div style="margin-top:1rem"><strong style="color:var(--orange)"><i class="fas fa-lightbulb"></i> Hints:</strong>${task.hints.map(h=>`<div class="hint-item">${h}</div>`).join('')}</div>`:''}
        </div>
      </div>
      <div>
        <div class="code-editor">
          <div class="code-editor-header">
            <span style="color:var(--text-dim);font-size:0.85rem"><i class="fas fa-code"></i> ${task.type}</span>
            <button class="btn btn-green" style="padding:0.4rem 1rem;font-size:0.85rem" onclick="submitTask('${task._id}')"><i class="fas fa-play"></i> Submit</button>
          </div>
          <textarea class="code-textarea" id="task-code-${task._id}" placeholder="# Write your Python code here...\n"></textarea>
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
