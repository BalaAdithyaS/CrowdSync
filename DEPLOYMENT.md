# CrowdSync Production Deployment Guide 🚀

This guide provides step-by-step instructions for deploying CrowdSync to public cloud providers (Vercel, Render, Railway, Docker, AWS, etc.).

---

## 🏗️ Deployment Architecture

In public production, CrowdSync operates in a decoupled architecture:

* **Frontend:** Static React Single Page Application deployed to a CDN edge platform (e.g. **Vercel**, **Netlify**, **Cloudflare Pages**, or **AWS S3/CloudFront**).
* **Backend:** FastAPI async application deployed on a container/Python cloud runner (e.g. **Render**, **Railway**, **Fly.io**, or **Docker**).
* **Database:** Managed PostgreSQL instance (e.g. **Neon**, **Supabase**, **Render Postgres**, **Railway**, or **AWS RDS**).
* **Real-Time Communication:** Native WebSockets connected with `wss://` over HTTPS.

```
[ Browser / Mobile Client ]
       │                │
       │ HTTPS          │ WSS (WebSockets)
       ▼                ▼
[ Vercel / Netlify ]   [ Render / Railway Backend ]
(Frontend SPA)                  │
                                ▼
                       [ Managed PostgreSQL ]
```

---

## 🔑 Required Environment Variables

### 1. Backend Environment Variables

Configure these in your backend hosting platform dashboard (e.g., Render, Railway):

| Variable | Required | Default | Description / Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `sqlite:///./crowdsync.db` | PostgreSQL connection string. Example: `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `SECRET_KEY` | **Yes** | *Dev Key* | High-entropy secret key for JWT signing. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | JWT token lifetime (default: 24 hours). |
| `CORS_ORIGINS` | **Yes** | `["http://localhost:5173"]` | Comma-separated or JSON list of allowed frontend domains. Example: `https://crowdsync.vercel.app,https://yourcustomdomain.com` |
| `PORT` | No | `8000` | Port assigned by hosting provider (Render and Railway set this automatically). |
| `PYTHONPATH` | **Yes** | `backend` | Sets Python import path so FastAPI modules resolve cleanly. |
| `DEMO_MODE` | No | `true` | Enables demonstration helper accounts and simulation tags. |

### 2. Frontend Environment Variables

Configure these in your frontend hosting platform dashboard (e.g., Vercel, Netlify):

| Variable | Required | Description / Example |
|---|---|---|
| `VITE_API_URL` | **Yes** | Public HTTPS URL of your deployed FastAPI backend. Example: `https://crowdsync-api.onrender.com` |
| `VITE_WS_URL` | Optional | Dedicated WSS WebSocket URL. If omitted, CrowdSync automatically derives `wss://...` from `VITE_API_URL`. Example: `wss://crowdsync-api.onrender.com` |

---

## 🚀 Option A: Deploy Frontend to Vercel (Recommended)

1. Push your repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `CrowdSync` repository.
4. In the Project Configuration:
   * **Root Directory:** Click Edit and select `frontend`.
   * **Framework Preset:** `Vite` (automatically detected).
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Install Command:** `npm install`
5. Under **Environment Variables**, add:
   * `VITE_API_URL`: Your deployed backend URL (e.g., `https://crowdsync-api.onrender.com`).
6. Click **Deploy**. Vercel will build and assign your production URL (e.g. `https://crowdsync.vercel.app`).

---

## 🐍 Option B: Deploy Backend to Render (Recommended)

1. Log in to [Render](https://render.com) and click **New + $\to$ Web Service**.
2. Connect your GitHub repository.
3. In the Web Service settings:
   * **Name:** `crowdsync-api`
   * **Region:** Select closest region to your database (e.g., Oregon or Frankfurt).
   * **Branch:** `main` (or `master`)
   * **Root Directory:** Leave blank (root).
   * **Runtime:** `Python 3`
   * **Build Command:**
     ```bash
     pip install -r backend/requirements.txt && alembic upgrade head && python scripts/seed_demo.py
     ```
   * **Start Command:**
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
4. In **Environment Variables**:
   * `PYTHONPATH`: `backend`
   * `DATABASE_URL`: Your managed PostgreSQL URL.
   * `SECRET_KEY`: Generate a random 64-character hex string.
   * `CORS_ORIGINS`: Your Vercel frontend domain (e.g. `https://crowdsync.vercel.app`).
5. In **Health Check Path**, enter: `/health`.
6. Click **Create Web Service**.

---

## 🗄️ Option C: Setting Up a Managed Database

CrowdSync is tested and compatible with:
* **Neon (Serverless Postgres):** [https://neon.tech](https://neon.tech) (Free tier available)
* **Supabase:** [https://supabase.com](https://supabase.com)
* **Railway Postgres / Render Postgres**

### Running Migrations & Seeding Remote Database:
You can initialize your remote database directly from your local terminal:
```bash
# Set your production database URL temporarily
$env:DATABASE_URL="postgresql://user:pass@ep-sample-12345.us-east-1.aws.neon.tech/crowdsync?sslmode=require"

# Run migrations to create schema
alembic upgrade head

# Seed initial campus locations, counters, and admin accounts
python scripts/seed_demo.py
```

---

## 🐳 Option D: Docker Compose Full-Stack Deployment

To run the complete production stack (PostgreSQL + Redis + FastAPI Backend + Nginx Frontend) on a single VPS or server:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Adjust .env with your domain and secure passwords
nano .env

# 3. Build and launch all containers in detached mode
docker-compose up --build -d
```

### Checking Container Health:
```bash
docker-compose ps
curl http://localhost:8000/health
```

---

## 🔍 Verification & Health Checks

Once deployed, verify your public endpoints:

1. **Backend Health Check:**
   ```bash
   curl https://crowdsync-api.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "service": "CrowdSync",
     "version": "1.0.0",
     "demo_mode": true
   }
   ```

2. **Swagger API Documentation:**
   Visit: `https://crowdsync-api.onrender.com/docs`

3. **Frontend Application:**
   Visit: `https://crowdsync.vercel.app`
   * Test user login (Student demo account).
   * Join a queue and verify the WebSocket indicator stays connected.
   * Open the admin portal to summon tickets and inspect live real-time synchronization.
