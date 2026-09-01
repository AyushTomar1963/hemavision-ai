# Deploying HemaVision

Two services:

| Service         | Host   | Root       | Env var it needs                                        |
| --------------- | ------ | ---------- | ------------------------------------------------------- |
| FastAPI backend | Render | `backend/` | (see below)                                             |
| Next.js frontend| Vercel | `frontend/`| `BACKEND_URL` = your Render URL, no trailing slash      |

Deploy the backend first, copy its URL, then paste it into Vercel as `BACKEND_URL`.

---

## 1. Backend on Render

Two options — pick one.

### Option A — Blueprint (one click, reads `render.yaml`)

1. Push this repo to GitHub (already done).
2. Log into <https://dashboard.render.com>.
3. **New +** → **Blueprint** → connect the `hemavision-ai` repo.
4. Render reads `render.yaml` at the repo root and creates one Web Service:
   - Name: `hemavision-api`
   - Runtime: Python 3.11.9
   - Root dir: `backend`
   - Build: `pip install --upgrade pip && pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health check: `/health`
   - `HEMAVISION_JWT_SECRET` is auto-generated.
5. Click **Apply**. First build takes 3–5 min (opencv-python-headless is the slow bit).
6. When it goes live you get a URL like `https://hemavision-api.onrender.com`. **Copy it.**

### Option B — Manual Web Service

If you don't want to use the Blueprint:

1. **New +** → **Web Service** → connect the repo.
2. Fill in:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
3. Environment tab — add every variable from the table below.

### Environment variables (Render)

Paste these under **Environment → Environment Variables** (skip on Blueprint — already there):

```
PYTHON_VERSION=3.11.9
HEMAVISION_LOG_LEVEL=INFO
HEMAVISION_RUN_CONVNEXT=false
HEMAVISION_AUTH_REQUIRED=false
HEMAVISION_CORS_ORIGINS=https://YOUR-APP.vercel.app,https://YOUR-APP-*.vercel.app,http://localhost:3000
HEMAVISION_JWT_SECRET=<generate a long random string>
HEMAVISION_JWT_EXPIRE_MINUTES=1440
HEMAVISION_DEMO_USER_EMAIL=demo@hemavision.ai
HEMAVISION_DEMO_USER_PASSWORD=demo1234
HEMAVISION_RATE_LIMIT_ANALYZE=30/minute
HEMAVISION_RATE_LIMIT_AUTH=10/minute
HEMAVISION_DB_PATH=/tmp/hemavision.db
```

`HEMAVISION_CORS_ORIGINS` you'll fill in after Vercel gives you a URL — it's fine to leave `http://localhost:3000` and edit later.

### Verify

```
GET  https://hemavision-api.onrender.com/health
# → {"ok":true,"model_loaded":false,"version":"2.1.0"}

GET  https://hemavision-api.onrender.com/papers
POST https://hemavision-api.onrender.com/auth/login
     Content-Type: application/json
     {"email":"demo@hemavision.ai","password":"demo1234"}
```

Free-tier caveats:
- Render sleeps after 15 min idle → first request wakes it (~30 s cold start).
- Sqlite lives on `/tmp` and resets on every deploy or sleep. Attach a Render Disk if you need persistence, or switch to Postgres.
- Torch/torchvision are NOT installed here (they'd blow the 512 MB slug). ConvNeXt stays off in production; local dev can add `pip install -r requirements-ml.txt`.

---

## 2. Frontend on Vercel

1. Log into <https://vercel.com>.
2. **Add New → Project** → import the `hemavision-ai` repo.
3. Vercel auto-detects Next.js. Set:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto)
   - **Install Command**: `npm install` (default)
   - **Build Command**: `next build` (default)
4. **Environment Variables** — add just this one:

   ```
   BACKEND_URL = https://hemavision-api.onrender.com
   ```

   No trailing slash. Apply to Production, Preview, and Development.
5. **Deploy**. First build ~2 min.
6. Vercel gives you `https://hemavision-<something>.vercel.app`. Open it.

### Wire CORS back into Render

Once you have the Vercel URL, edit `HEMAVISION_CORS_ORIGINS` on Render:

```
HEMAVISION_CORS_ORIGINS=https://hemavision-<your-slug>.vercel.app,https://hemavision-*.vercel.app
```

Render redeploys automatically. Done.

---

## Turning auth on for production

Default is anonymous — anyone can hit `/analyze`. To require login:

1. Render → set `HEMAVISION_AUTH_REQUIRED=true`.
2. Rotate `HEMAVISION_JWT_SECRET` to a real random string (Render's `generateValue` handles this on Blueprint deploys).
3. Change `HEMAVISION_DEMO_USER_PASSWORD` or delete the seeded demo user in the sqlite file.

---

## Quick checklist for the demo

- [ ] Backend URL responds to `/health` in the browser.
- [ ] Vercel URL loads and the Exam page shows the webcam preview.
- [ ] Capture a frame — result sheet renders, no 4xx/5xx in the network tab.
- [ ] `/login` accepts `demo@hemavision.ai / demo1234`.
- [ ] `/protocol`, `/evidence`, `/log` all load without a white screen.
- [ ] Hit `/api/analyze` directly from browser → 405 or 422 (not 500). Confirms the proxy is alive.
