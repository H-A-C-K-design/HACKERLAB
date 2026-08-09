/**
 * ============================================================
 *  HONEYPOT MIDDLEWARE — CyberForge Academy
 * ============================================================
 *  Catches common attacker probe paths (admin, dashboard,
 *  wp-admin, phpmyadmin, env files, shell uploads, etc.)
 *  and serves convincing fake pages while logging every hit
 *  to Firebase with full attacker metadata.
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const admin = require('firebase-admin');

// ── Honeypot path patterns ────────────────────────────────
// These are all paths that real attackers probe.
// None of these are real pages on this app.
const HONEYPOT_PATHS = [
  // Admin / dashboard probes
  '/admin', '/admin/', '/administrator', '/administrator/',
  '/dashboard', '/dashboard/', '/manage', '/manage/',
  '/control', '/control-panel', '/controlpanel',
  '/backend', '/backend/', '/backoffice', '/backoffice/',
  '/cms', '/cms/', '/cpanel', '/cpanel/', '/wp-admin',
  '/wp-admin/', '/wp-login.php', '/xmlrpc.php',
  '/wp-json', '/wp-content', '/wp-includes',
  '/panel', '/panel/', '/site-admin', '/sys-admin',
  '/superadmin', '/superadmin/', '/root',

  // Login / auth probes
  '/login', '/signin', '/sign-in', '/auth', '/authenticate',
  '/user/login', '/users/login', '/account/login',
  '/portal', '/portal/', '/secure', '/secure/',
  '/member', '/members', '/private', '/account',

  // Config / env file leaks
  '/.env', '/.env.local', '/.env.backup', '/.env.bak',
  '/.env.old', '/.env.prod', '/.env.production',
  '/config.php', '/configuration.php', '/config.ini',
  '/config.yaml', '/config.yml', '/settings.php',
  '/app/config', '/application.properties',
  '/web.config', '/appsettings.json', '/secrets.json',
  '/database.yml', '/database.php',
  '/local.settings.json', '/.htpasswd', '/.htaccess',

  // Sensitive file probes
  '/.git', '/.git/HEAD', '/.git/config', '/.git/COMMIT_EDITMSG',
  '/.svn', '/.DS_Store', '/Thumbs.db',
  '/composer.json', '/package.json.bak',
  '/phpinfo.php', '/info.php', '/test.php', '/php.php',
  '/status', '/server-status', '/server-info',
  '/health', '/ping', '/version',

  // Shell / RCE upload paths
  '/shell.php', '/cmd.php', '/c99.php', '/r57.php',
  '/webshell.php', '/backdoor.php', '/exploit.php',
  '/upload.php', '/uploads/shell.php', '/files/shell.php',
  '/tools.php', '/gate.php', '/eval.php',

  // Database tools
  '/phpmyadmin', '/phpmyadmin/', '/pma', '/pma/',
  '/mysql', '/mysqladmin', '/dbadmin', '/db/',
  '/adminer.php', '/adminer/', '/sql.php',

  // API key / credential probes
  '/api/keys', '/api/secrets', '/api/config',
  '/api/v1/users/admin', '/api/v2/admin',
  '/_profiler', '/__debug__', '/debug',
  '/trace', '/actuator', '/actuator/env',
  '/actuator/health', '/actuator/metrics',
  '/jolokia', '/solr/admin', '/elasticsearch',
  '/swagger', '/swagger-ui', '/swagger-ui.html',
  '/api-docs', '/openapi.json', '/graphql',

  // Path traversal attempts
  '/etc/passwd', '/etc/shadow', '/windows/win.ini',
  '/../../../etc/passwd', '/%2e%2e/etc/passwd',

  // Other common scanner bait
  '/robots.txt.bak', '/sitemap.xml.bak',
  '/backup', '/backup/', '/bak', '/bak/',
  '/old', '/old/', '/archive', '/temp',
  '/test', '/testing', '/staging',
  '/cgi-bin', '/cgi-bin/', '/scripts',
  '/vendor', '/vendor.php', '/node_modules',
  '/aws', '/.aws/credentials', '/.ssh/id_rsa',
  '/.ssh/authorized_keys', '/.bash_history',
  '/wp-cron.php', '/license.txt', '/readme.html',
  '/setup.php', '/install.php', '/installer.php',
];

// ── Fake page generators ──────────────────────────────────
// Each generator returns { status, contentType, body }
// They look convincing enough to waste attacker time.

function fakeAdminLogin(req) {
  return {
    status: 200,
    contentType: 'text/html',
    body: `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Admin Panel — CyberForge</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#1a1a2e;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .box{background:#16213e;border:1px solid #0f3460;border-radius:8px;padding:2.5rem;width:380px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
  h2{color:#e94560;font-size:1.4rem;margin-bottom:0.3rem}
  .sub{color:#7b8ca5;font-size:0.85rem;margin-bottom:1.8rem}
  label{display:block;color:#a0aec0;font-size:0.82rem;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:.5px}
  input{width:100%;background:#0f3460;border:1px solid #1a4a8a;border-radius:4px;padding:0.65rem 0.9rem;color:#fff;font-size:0.95rem;margin-bottom:1.1rem;outline:none}
  input:focus{border-color:#e94560}
  .btn{width:100%;background:#e94560;border:none;color:#fff;padding:0.75rem;border-radius:4px;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:.5px}
  .btn:hover{background:#c73652}
  .err{background:rgba(233,69,96,.1);border:1px solid rgba(233,69,96,.3);color:#e94560;padding:0.6rem 0.9rem;border-radius:4px;font-size:0.85rem;margin-bottom:1rem;display:none}
  .logo{color:#e94560;font-size:1.6rem;font-weight:900;letter-spacing:2px;margin-bottom:1rem}
</style>
</head><body>
<div class="box">
  <div class="logo">⚡ CYBERFORGE</div>
  <h2>Administrator Access</h2>
  <div class="sub">Restricted area — authorised personnel only</div>
  <div class="err" id="err-msg">Invalid credentials. Access denied.</div>
  <form onsubmit="tryLogin(event)">
    <label>Username</label>
    <input type="text" id="hp-user" autocomplete="off" placeholder="admin"/>
    <label>Password</label>
    <input type="password" id="hp-pass" placeholder="••••••••"/>
    <button class="btn" type="submit">Sign In</button>
  </form>
</div>
<script>
function tryLogin(e){
  e.preventDefault();
  const u=document.getElementById('hp-user').value;
  const p=document.getElementById('hp-pass').value;
  // Report the attempt then show error
  fetch('/api/honeypot/attempt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,username:u,password:p,type:'login_attempt'})}).catch(()=>{});
  setTimeout(()=>{document.getElementById('err-msg').style.display='block';},700);
}
</script>
</body></html>`
  };
}

function fakeEnvFile() {
  return {
    status: 200,
    contentType: 'text/plain',
    body: `# Environment Configuration
# Generated: ${new Date().toISOString()}

APP_NAME=CyberForge
APP_ENV=production
APP_KEY=base64:HONEYPOT_FAKE_KEY_DO_NOT_USE_xK9mL2pQ7rN4sV8
APP_DEBUG=false
APP_URL=https://cyberforge.academy

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=honeypot_bait_db
DB_USERNAME=root
DB_PASSWORD=HONEYPOT_FAKE_PASS_xM9kL3nQ

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=FAKE_REDIS_PASS
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=fake@honeypot.invalid
MAIL_PASSWORD=FAKE_MAIL_PASS

AWS_ACCESS_KEY_ID=HONEYPOT_FAKE_KEY_AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=HONEYPOT/FAKE/wJalrXUtnFEMI/K7MDENG/bPxRfiCY
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=honeypot-fake-bucket

JWT_SECRET=HONEYPOT_FAKE_JWT_SECRET_7f8g9h0i1j2k3l4m
ADMIN_TOKEN=HONEYPOT_FAKE_ADMIN_TOKEN_a1b2c3d4e5f6
`
  };
}

function fakePhpMyAdmin() {
  return {
    status: 200,
    contentType: 'text/html',
    body: `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>phpMyAdmin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f0f0;font-family:sans-serif}
.header{background:#3a6ea5;padding:.5rem 1rem;color:#fff;font-size:1.1rem;font-weight:bold}
.wrap{display:flex;align-items:center;justify-content:center;height:90vh}
.box{background:#fff;border:1px solid #ccc;padding:2rem;width:340px;border-radius:4px}
h2{font-size:1rem;color:#333;margin-bottom:1rem}
label{font-size:.85rem;color:#555;display:block;margin-bottom:.2rem}
input{width:100%;border:1px solid #ccc;padding:.45rem .6rem;margin-bottom:.9rem;border-radius:3px;font-size:.9rem}
.btn{background:#3a6ea5;color:#fff;border:none;padding:.55rem 1.5rem;border-radius:3px;cursor:pointer;font-size:.9rem}
.err{color:#c0392b;font-size:.82rem;margin-bottom:.8rem;display:none}
.ver{color:#888;font-size:.75rem;margin-top:1rem}
</style></head><body>
<div class="header">phpMyAdmin</div>
<div class="wrap">
<div class="box">
  <h2>Welcome to phpMyAdmin</h2>
  <div class="err" id="pma-err">Access denied for user 'root'@'localhost'</div>
  <form onsubmit="pmaLogin(event)">
    <label>Username:</label><input type="text" id="pma-u" value="root"/>
    <label>Password:</label><input type="password" id="pma-p"/>
    <button class="btn" type="submit">Go</button>
  </form>
  <div class="ver">phpMyAdmin 5.2.1 / MySQL 8.0.27</div>
</div>
</div>
<script>
function pmaLogin(e){
  e.preventDefault();
  fetch('/api/honeypot/attempt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,username:document.getElementById('pma-u').value,password:document.getElementById('pma-p').value,type:'phpmyadmin_attempt'})}).catch(()=>{});
  setTimeout(()=>{document.getElementById('pma-err').style.display='block';},600);
}
</script>
</body></html>`
  };
}

function fakeWordPressLogin() {
  return {
    status: 200,
    contentType: 'text/html',
    body: `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>Log In — WordPress</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f0f1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.login{margin:8% auto 0;width:320px}
h1 a{display:block;text-align:center;margin-bottom:1.5rem;font-size:2rem;color:#3858e9;text-decoration:none}
.form-wrap{background:#fff;border:1px solid #c3c4c7;padding:1.5rem 1.5rem 1.2rem;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
label{display:block;font-size:.875rem;color:#1d2327;margin-bottom:.2rem;font-weight:600}
input[type=text],input[type=password]{width:100%;padding:.55rem .75rem;border:1px solid #8c8f94;border-radius:3px;font-size:.875rem;margin-bottom:1rem;background:#fff}
input:focus{border-color:#2271b1;outline:none;box-shadow:0 0 0 1px #2271b1}
.button{width:100%;background:#2271b1;border:none;color:#fff;padding:.6rem;border-radius:3px;font-size:.875rem;font-weight:600;cursor:pointer}
.button:hover{background:#135e96}
.msg{background:#fcf9e8;border-left:4px solid #dba617;padding:.6rem .8rem;font-size:.8rem;color:#3c434a;margin-bottom:.8rem;display:none}
.back{text-align:center;margin-top:1rem;font-size:.8rem}
.back a{color:#2271b1;text-decoration:none}
</style></head><body>
<div class="login">
  <h1><a>W</a></h1>
  <div class="msg" id="wp-msg">ERROR: The password you entered for the username <strong id="wp-un-display"></strong> is incorrect.</div>
  <div class="form-wrap">
    <form onsubmit="wpLogin(event)">
      <label for="user_login">Username or Email Address</label>
      <input type="text" id="user_login" name="log" autocomplete="username"/>
      <label for="user_pass">Password</label>
      <input type="password" id="user_pass" name="pwd" autocomplete="current-password"/>
      <button type="submit" class="button">Log In</button>
    </form>
  </div>
  <div class="back"><a href="#">Back to CyberForge</a></div>
</div>
<script>
function wpLogin(e){
  e.preventDefault();
  const u=document.getElementById('user_login').value;
  fetch('/api/honeypot/attempt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname,username:u,password:document.getElementById('user_pass').value,type:'wordpress_attempt'})}).catch(()=>{});
  document.getElementById('wp-un-display').textContent=u||'admin';
  setTimeout(()=>{document.getElementById('wp-msg').style.display='block';},600);
}
</script>
</body></html>`
  };
}

function fakeGitHead() {
  return {
    status: 200,
    contentType: 'text/plain',
    body: `ref: refs/heads/main\n`
  };
}

function fakeShellPhp() {
  // Simulate a "forbidden" response to make the attacker think they found something
  return {
    status: 403,
    contentType: 'text/html',
    body: `<html><body><h1>403 Forbidden</h1><p>You don't have permission to access this resource.</p><hr/><address>Apache/2.4.51 (Unix) Server</address></body></html>`
  };
}

function fakeJsonConfig() {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      environment: 'production',
      debug: false,
      database: {
        host: '127.0.0.1',
        port: 3306,
        name: 'honeypot_bait_db',
        user: 'root',
        password: 'HONEYPOT_FAKE_DB_PASS_9kM3nL7qP2'
      },
      jwt_secret: 'HONEYPOT_FAKE_JWT_a1b2c3d4e5f6g7h8i9j0',
      admin_key: 'HONEYPOT_FAKE_ADMIN_KEY_xK9mL2pQ7rN4sV',
      redis_url: 'redis://:FAKE_PASS@127.0.0.1:6379/0'
    }, null, 2)
  };
}

function fakeActuator() {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'UP',
      components: {
        db: { status: 'UP', details: { database: 'H2', validationQuery: 'isValid()' } },
        diskSpace: { status: 'UP', details: { total: 499963174912, free: 299963174912, threshold: 10485760 } },
        ping: { status: 'UP' }
      },
      env: {
        'server.port': '8080',
        'spring.datasource.url': 'jdbc:h2:mem:honeypot_bait',
        'spring.datasource.username': 'sa',
        'spring.datasource.password': 'HONEYPOT_FAKE_SPRING_PASS'
      }
    }, null, 2)
  };
}

// ── Decide which fake response to return ─────────────────
function buildFakeResponse(reqPath) {
  const p = reqPath.toLowerCase().split('?')[0];

  if (p === '/.env' || p.includes('.env') || p.includes('environment'))
    return fakeEnvFile();

  if (p.includes('phpmyadmin') || p.includes('/pma') || p.includes('/adminer') || p.includes('/sql'))
    return fakePhpMyAdmin();

  if (p.includes('wp-login') || p.includes('wp-admin') || p.includes('xmlrpc') || p.includes('wp-json') || p.includes('wp-content'))
    return fakeWordPressLogin();

  if (p.includes('.git/head') || p.includes('.git/config') || p === '/.git')
    return fakeGitHead();

  if (p.includes('shell.php') || p.includes('cmd.php') || p.includes('c99') || p.includes('r57') || p.includes('webshell') || p.includes('backdoor'))
    return fakeShellPhp();

  if (p.includes('actuator') || p.includes('jolokia'))
    return fakeActuator();

  if (p.includes('.json') || p.includes('config') || p.includes('settings') || p.includes('appsettings') || p.includes('secrets'))
    return fakeJsonConfig();

  // Default: generic admin login page
  return fakeAdminLogin({ path: reqPath });
}

// ── Logging helper ────────────────────────────────────────
async function logHoneypotHit(req, extra = {}) {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const ua = req.headers['user-agent'] || 'unknown';
    const ref = req.headers['referer'] || '';

    const timestamp = (admin.apps && admin.apps.length && admin.firestore)
      ? admin.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();

    const entry = {
      timestamp,
      ip,
      userAgent: ua,
      referer: ref,
      method: req.method,
      path: req.path,
      query: JSON.stringify(req.query),
      headers: {
        accept: req.headers['accept'] || '',
        acceptLanguage: req.headers['accept-language'] || '',
        xForwardedFor: req.headers['x-forwarded-for'] || '',
        cfConnectingIp: req.headers['cf-connecting-ip'] || '',
      },
      ...extra
    };

    if (db) {
      await db.collection('honeypot_logs').add(entry);
    }

    // Always print to server console so you see it live
    console.warn(`\n🍯 [HONEYPOT HIT] ─────────────────────────────`);
    console.warn(`   IP       : ${ip}`);
    console.warn(`   Method   : ${req.method}`);
    console.warn(`   Path     : ${req.path}`);
    console.warn(`   UA       : ${ua.slice(0, 80)}`);
    if (extra.username) console.warn(`   Username : ${extra.username}`);
    if (extra.type)     console.warn(`   Type     : ${extra.type}`);
    console.warn(`────────────────────────────────────────────────\n`);
  } catch (e) {
    // Never crash the app over logging failure
    console.warn('[HONEYPOT] Failed to write log:', e.message);
  }
}

// ── Main honeypot handler middleware ──────────────────────
// Called from index.js BEFORE the SPA catch-all.
// Returns true if the request was a honeypot hit.
async function honeypotMiddleware(req, res, next) {
  const p = req.path.toLowerCase();

  const isHit = HONEYPOT_PATHS.some(pattern => {
    const lower = pattern.toLowerCase();
    return p === lower || p.startsWith(lower + '/') || p.startsWith(lower + '?');
  });

  if (!isHit) return next();

  // Log async — don't await so response is instant
  logHoneypotHit(req, { type: 'path_probe' }).catch(() => {});

  // Slow down automated scanners — 800ms artificial delay
  await new Promise(r => setTimeout(r, 800));

  const { status, contentType, body } = buildFakeResponse(req.path);
  res.status(status).type(contentType).send(body);
}

// ── /api/honeypot/attempt — receives login data from fake pages ──
router.post('/attempt', async (req, res) => {
  const { path: hpPath, username, password, type } = req.body || {};
  await logHoneypotHit(req, {
    type: type || 'form_submit',
    path: hpPath || req.path,
    username: username ? String(username).slice(0, 100) : undefined,
    // Never store raw password — store hash indicator only
    passwordLength: password ? String(password).length : 0,
    passwordHint: password ? String(password).slice(0, 2) + '***' : undefined,
  }).catch(() => {});
  // Respond with a fake "loading" to keep the attacker waiting
  res.json({ status: 'loading', redirect: '/dashboard/verify', token: null });
});

// ── /api/honeypot/logs — admin view of all honeypot hits ──
router.get('/logs', async (req, res) => {
  try {
    const snap = await db.collection('honeypot_logs')
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, total: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = { router, honeypotMiddleware };
