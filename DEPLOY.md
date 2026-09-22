# CyberForge Academy — Vercel Deployment Guide

## Prerequisites
- Vercel account at https://vercel.com
- GitHub/GitLab repo (or use Vercel CLI)

---

## Step 1 — Push code to GitHub

```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2 — Import project on Vercel

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your repo
4. **Framework Preset**: Other
5. **Root Directory**: `.` (leave blank / root)
6. **Build Command**: leave blank (or `echo done`)
7. **Output Directory**: leave blank
8. Click **Deploy**

---

## Step 3 — Set Environment Variables

In Vercel dashboard → Project → **Settings** → **Environment Variables**, add ALL of these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate a secure 64-character random string, e.g.: `openssl rand -base64 32`)* |
| `JWT_EXPIRE` | `7d` |
| `ADMIN_PANEL_TOKEN` | *(generate a strong random secret token, e.g.: `openssl rand -hex 16`)* |
| `RECAPTCHA_SECRET_KEY` | *(your Google reCAPTCHA secret key)* |
| `FIREBASE_PROJECT_ID` | `your-firebase-project-id` |
| `FIREBASE_PRIVATE_KEY_ID` | `your-firebase-private-key-id` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com` |
| `FIREBASE_CLIENT_ID` | `your-firebase-client-id` |
| `FIREBASE_PRIVATE_KEY` | *(paste full private key including `-----BEGIN...END-----`)* |

> ⚠️ **Security Notice**: Never commit concrete private keys, JWT secrets, or administrative tokens into Git repositories.
> For `FIREBASE_PRIVATE_KEY` paste the full multi-line key. Vercel handles newlines automatically.

---

## Step 4 — Redeploy

After setting env vars click **Redeploy** (top right in Vercel).

---

## Notes

- **Socket.io**: Works on Vercel with long-polling fallback (websocket upgrades need Pro plan)
- **Video file**: The `INTRODUCTION OF CYBER SECURITY.mp4` in `client/public/` is served as a static asset automatically
- **Honeypot logs**: Stored in Firebase `honeypot_logs` collection, viewable in Firebase console
- **Admin panel**: Visit `https://your-domain.vercel.app/admin.html`
