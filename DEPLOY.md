# Deploying HemaVision

Two services:

| Service         | Host    | Root       | Env var it needs                                        |
| --------------- | ------- | ---------- | ------------------------------------------------------- |
| FastAPI backend | Railway | `backend/` | (see below)                                             |
| Next.js frontend| Vercel  | `frontend/`| `BACKEND_URL` = your Railway URL, no trailing slash     |

Deploy the backend first, copy its URL, then paste it into Vercel as `BACKEND_URL`.

---

## 1. Backend on Railway

Two options — pick one.

### Option A — Dashboard (no CLI needed)

1. Push the repo to GitHub (already done).
2. Log into <https://railway.com>.
3. **New Project → Deploy from GitHub repo** → pick `AyushTomar1963/hemavision-ai`.
4. When the service is created, open it and go to **Settings**:
   - **Root Directory**: `backend`
   - Nixpacks reads `backend/nixpacks.toml` and `backend/railway.toml` automatically.
   - **Health Check Path**: `/health` (auto-picked from `railway.toml`)
5. **Variables** tab → paste the block below (edit values you care about).
6. **Networking → Public Networking → Generate Domain**. You get:

   ```
   https://hemavision-api-production.up.railway.app
   ```

   **Copy that URL.** It's what Vercel needs.

### Option B — Railway CLI

```bash
npm i -g @railway/cli
railway login
cd backend
railway init            # or: railway link  (if the project already exists)
railway up              # builds + deploys the current directory
railway domain          # generate a public URL
railway variables set HEMAVISION_JWT_SECRET=$(openssl rand -hex 32)
railway variables set HEMAVISION_CORS_ORIGINS=https://YOUR-APP.vercel.app
railway logs
```

### Environment variables (Railway)

Paste as a block in Variables → Raw Editor:

```
HEMAVISION_LOG_LEVEL=INFO
HEMAVISION_RUN_CONVNEXT=false
HEMAVISION_AUTH_REQUIRED=false
HEMAVISION_CORS_ORIGINS=https://YOUR-APP.vercel.app,http://localhost:3000
HEMAVISION_JWT_SECRET=REPLACE-ME-WITH-A-LONG-RANDOM-STRING
HEMAVISION_JWT_EXPIRE_MINUTES=1440
HEMAVISION_DEMO_USER_EMAIL=demo@hemavision.ai
HEMAVISION_DEMO_USER_PASSWORD=demo1234
HEMAVISION_RATE_LIMIT_ANALYZE=30/minute
HEMAVISION_RATE_LIMIT_AUTH=10/minute
HEMAVISION_DB_PATH=/tmp/hemavision.db
```

- **`HEMAVISION_JWT_SECRET`**: generate with `openssl rand -hex 32` or `python -c "import secrets; print(secrets.token_hex(32))"`. Never ship the default.
- **`HEMAVISION_CORS_ORIGINS`**: fill in after Vercel gives you a URL. `http://localhost:3000` is fine to keep for local dev.
- Railway auto-injects `PORT`, so no need to set it — `uvicorn ... --port ${PORT}` in `railway.toml` picks it up.

### Verify

```
GET  https://<your>.up.railway.app/health
# → {"ok":true,"model_loaded":false,"version":"2.1.0"}

GET  https://<your>.up.railway.app/papers

POST https://<your>.up.railway.app/auth/login
     Content-Type: application/json
     {"email":"demo@hemavision.ai","password":"demo1234"}
# → {"access_token":"...","token_type":"bearer","expires_in":86400,"email":"..."}
```

Railway caveats:
- No sleep on the Hobby plan; the free trial gets $5 of usage.
- Sqlite lives on `/tmp` and resets on redeploy. Attach a Volume (Settings → Storage → Mount at `/data`, set `HEMAVISION_DB_PATH=/data/hemavision.db`) if you want persistent accounts. For a hackathon demo, `/tmp` is fine — the seeded demo user re-seeds on every boot.
- Torch/torchvision are NOT installed in production (they'd blow build time and RAM). ConvNeXt stays off in production; local dev can add `pip install -r requirements-ml.txt`.

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
   BACKEND_URL = https://<your>.up.railway.app
   ```

   No trailing slash. Apply to Production, Preview, and Development.
5. **Deploy**. First build ~2 min.
6. Vercel gives you `https://hemavision-<slug>.vercel.app`. Open it.

### Wire CORS back into Railway

Once you have the Vercel URL, edit `HEMAVISION_CORS_ORIGINS` on Railway → Variables:

```
HEMAVISION_CORS_ORIGINS=https://hemavision-<your-slug>.vercel.app
```

Railway redeploys automatically. Done.

---

## Turning auth on for production

Default is anonymous — anyone can hit `/analyze`. To require login:

1. Railway → set `HEMAVISION_AUTH_REQUIRED=true`.
2. Rotate `HEMAVISION_JWT_SECRET` to a real random string.
3. Change `HEMAVISION_DEMO_USER_PASSWORD` (or disable the seed by editing `db.ensure_demo_user`).

---

## Quick checklist for the demo

- [ ] `https://<your>.up.railway.app/health` returns `{"ok":true,...}`.
- [ ] Vercel URL loads and the Exam page shows the webcam preview.
- [ ] Capture a frame — result sheet renders, no 4xx/5xx in the network tab.
- [ ] `/login` accepts `demo@hemavision.ai / demo1234`.
- [ ] `/protocol`, `/evidence`, `/log` all load without a white screen.
- [ ] `POST /api/analyze` with no file → 400 or 422 (not 500).

---

## Appendix — Render (previous plan)

The repo still contains `render.yaml` and `backend/runtime.txt` for a Render Blueprint deploy if you ever want to switch back. See `render.yaml` at the repo root; the env vars are the same as the Railway block above.
