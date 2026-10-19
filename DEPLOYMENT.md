# 🚀 Deployment Guide — KIIT Dating App (100% Free)

> [!IMPORTANT]
> You need: GitHub account · Cloudinary free account · Neon free account · Render free account

---

## Step 1 — Get Free Accounts (all 5 min setup, no credit card)

| Service | What For | Link |
|---|---|---|
| **Neon** | Free PostgreSQL database | https://neon.tech |
| **Cloudinary** | Free photo storage | https://cloudinary.com |
| **Render** | Deploy Java backend (free) | https://render.com |
| **Vercel** | Deploy Angular frontend (free) | https://vercel.com |

---

## Step 2 — Set Up Neon Database

1. Go to https://neon.tech → **Sign in with GitHub**
2. Create a project called `kiit-dating`
3. Copy the **Connection String** — looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save it for Step 4

---

## Step 3 — Set Up Cloudinary

1. Go to https://cloudinary.com → **Sign up free**
2. From Dashboard, note these 3 values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## Step 4 — Push to GitHub

```bash
# In the project root folder (Dating Website Project)
git init
git add .
git commit -m "Initial commit — KIIT Dating App"

# Create a repo on GitHub (go to github.com/new)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/kiit-dating.git
git push -u origin main
```

---

## Step 5 — Deploy Backend on Render (Free)

1. Go to https://render.com → **Login with GitHub**
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in:
   - **Name**: `kiit-dating-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Plan**: `Free`
5. Add **Environment Variables**:

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | Your Neon connection string |
| `SPRING_DATASOURCE_USERNAME` | From Neon |
| `SPRING_DATASOURCE_PASSWORD` | From Neon |
| `JWT_SECRET` | Any 64-char random string (use https://randomkeygen.com) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `ALLOWED_ORIGIN` | Your Vercel URL (e.g. `https://kiit-dating.vercel.app`) |

6. Click **Deploy** — Render builds the Docker image automatically
7. After deploy, copy your backend URL like: `https://kiit-dating-api.onrender.com`

> [!NOTE]
> Free Render instances sleep after 15 min of inactivity — first request takes ~30s to wake up. This is normal on free tier.

---

## Step 6 — Update Frontend Environment

Open [`frontend/src/environments/environment.prod.ts`](file:///C:/Users/KIIT0001/OneDrive/Desktop/Dating%20Website%20Project/frontend/src/environments/environment.prod.ts) and replace `YOUR-APP-NAME`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://kiit-dating-api.onrender.com/api',  // ← your Render URL
  wsUrl:  'https://kiit-dating-api.onrender.com/ws'    // ← same
};
```

Commit and push this change.

---

## Step 7 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → **Login with GitHub**
2. Click **Add New Project**
3. Import your GitHub repo
4. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Angular`
   - **Build Command**: `npm run build -- --configuration production`
   - **Output Directory**: `dist/frontend/browser`
5. Click **Deploy**
6. Your app is live at `https://kiit-dating-XXXX.vercel.app` 🎉

---

## Step 8 — Create Admin Account

After deployment, register normally with any `@kiit.ac.in` email, then in Neon console run:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@kiit.ac.in';
```

---

## ✅ Architecture Summary

```
Browser (Vercel)
    │  HTTPS REST + WebSocket
    ▼
Spring Boot (Render.com)
    │           │
    ▼           ▼
Neon DB    Cloudinary
(SQL)      (Photos)
```

---

## Local Development

**Backend:**
```bash
cd backend
# Fill in src/main/resources/application.properties or set env vars
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm start
# Runs on http://localhost:4200
```
