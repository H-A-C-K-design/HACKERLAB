# 🔐 CyberForge Academy

> A comprehensive cybersecurity learning platform for students — CTF challenges, hacking labs, tool guides, a live terminal simulator, coding tasks, and leaderboard.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [MongoDB](https://mongodb.com) (local or Atlas)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` if needed:
```
MONGO_URI=mongodb://localhost:27017/cyberforge
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Seed the Database
With the server running, open a new terminal:
```bash
node server/seed.js
```

### 5. Open the Frontend
Open `client/public/index.html` in your browser.
Or serve it:
```bash
npx serve client/public
```

### Default Login
- **Email:** admin@cyberforge.io
- **Password:** admin123

---

## 🧩 Features

| Feature | Description |
|---------|-------------|
| 🚩 CTF Challenges | 12+ real-world style challenges (web, crypto, forensics, pwn, OSINT...) |
| 🧪 Hacking Labs | Step-by-step guided labs (Kali install, Nmap, web hacking...) |
| 🛠️ Tool Library | 12+ tools with install commands and examples |
| 💻 Live Terminal | Simulated Kali Linux terminal with real command responses |
| 📚 Learning Modules | Theory from basics to penetration testing methodology |
| 🏆 Leaderboard | Global XP leaderboard with ranks |
| 💻 Coding Tasks | Python/Bash/JS security programming challenges |
| 🎖️ XP & Ranks | Gamified progression from Script Kiddie to Cyber God |

---

## 🗂️ Project Structure

```
platform/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── seed.js           # Database seeder
│   ├── models/
│   │   ├── User.js
│   │   ├── Challenge.js
│   │   ├── Lab.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── challenges.js
│   │   ├── labs.js
│   │   ├── tools.js
│   │   ├── learning.js
│   │   ├── leaderboard.js
│   │   ├── tasks.js
│   │   └── users.js
│   └── middleware/
│       └── auth.js
├── client/
│   └── public/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── .env
└── package.json
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/challenges | List all challenges |
| POST | /api/challenges/:id/submit | Submit flag |
| GET | /api/labs | List all labs |
| POST | /api/labs/:id/complete | Mark lab complete |
| GET | /api/tools | List all tools |
| GET | /api/learning | List learning modules |
| GET | /api/leaderboard | Global leaderboard |
| GET | /api/tasks | List coding tasks |
| POST | /api/challenges/seed/all | Seed challenges |
| POST | /api/labs/seed/all | Seed labs |
| POST | /api/tasks/seed/all | Seed tasks |

---

## ⚠️ Legal Disclaimer

This platform is for **educational purposes only**. All hacking techniques taught here must only be practiced on systems you own or have explicit written permission to test. Unauthorized hacking is illegal.

---

## 🛡️ Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Socket.io
- **Frontend:** Vanilla JS (SPA), CSS3, Font Awesome, Google Fonts
- **Security:** Helmet, CORS, Rate limiting, bcryptjs
