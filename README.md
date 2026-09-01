# HemaVision

Palpebral conjunctiva haemoglobin screening. A webcam or photograph of the inner eyelid is processed with OpenCV, mapped to an estimated Hb, and labelled with WHO / AABB bands.

**Screening aid only. A laboratory CBC remains the reference standard.**

## Run

### Backend, port 8000

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env  # optional — every setting has a sensible default
.venv/bin/uvicorn main:app --reload --port 8000
```

Run the tests:

```bash
.venv/bin/pytest
```

### Frontend, port 3000

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pages: **Exam**, **Protocol**, **Evidence**, **Log**, **Login**, **Signup**.

The frontend proxies `/api/*` to FastAPI so the browser only ever talks same-origin (no CORS shenanigans in the browser).

## Environment (backend)

All settings take the `HEMAVISION_` prefix. Full list in `backend/.env.example`. Highlights:

| Key                                 | Default                                     | Purpose                                            |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| `HEMAVISION_CORS_ORIGINS`           | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins                    |
| `HEMAVISION_AUTH_REQUIRED`          | `false`                                     | If `true`, `/analyze` needs a Bearer token         |
| `HEMAVISION_RUN_CONVNEXT`           | `false`                                     | Gate the ImageNet ConvNeXt-Tiny forward pass       |
| `HEMAVISION_MAX_UPLOAD_BYTES`       | `12582912` (12 MB)                          | Server-side upload cap                             |
| `HEMAVISION_RATE_LIMIT_ANALYZE`     | `30/minute`                                 | Per-IP rate limit                                  |
| `HEMAVISION_DEMO_USER_EMAIL`        | `demo@hemavision.ai`                        | Seeded at first startup                            |
| `HEMAVISION_DEMO_USER_PASSWORD`     | `demo1234`                                  | Seeded at first startup                            |

## Implemented features

**Capture**
- Front-facing 1080p webcam with a palpebral reticle.
- Native `MediaStreamTrack.applyConstraints({ advanced: [{ zoom }] })` when the camera exposes a zoom capability (Chromium on capable hardware); canvas-crop fallback everywhere else. Either way the JPEG we send matches the pixels the operator sees.
- Three-count capture; still-photo upload.
- Optional sex for WHO 2024 cutoffs.

**Signal processing**
- Centre-crop of the reticle.
- Specular glare mask (L > 235) + Telea inpaint.
- Vascular high-pass kernel.
- CIELAB L*, a* (OpenCV a − 128), b*.
- Erythema index EI = 100 · (log₁₀ R − log₁₀ G).
- Quality: glare %, luminance, ROI size, confidence flags.

**Estimation**
- Hb ≈ 7.6 + 0.18·a* + 0.11·EI g/dL (clipped 3–18).
- ConvNeXt-Tiny + dropout/GELU regression head (architecture live behind `HEMAVISION_RUN_CONVNEXT=1`; ImageNet weights are not the reported Hb).
- Quality-scaled uncertainty band.

**Triage**
- WHO 2024 adult cutoffs (women 12.0, men 13.0 g/dL).
- AABB 2023 restrictive transfusion band at 7 g/dL.
- Zhao 2024 high-AUC 7 and 9 g/dL operating points on the sheet.

**Workstation**
- Six pages: Exam, Protocol, Evidence, Log, Login, Signup.
- Lab-style report; browser-only exam log.
- FastAPI: `POST /analyze`, `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `GET /papers`, `GET /features`, `GET /health`.

## Backend architecture

```
backend/
├── main.py              # ASGI entry: middleware, error handlers, lifespan
├── config.py            # Pydantic-Settings, env-driven, cached
├── logging_setup.py     # stdlib logging + per-request UUID via contextvars
├── rate_limit.py        # shared slowapi Limiter
├── auth.py              # /auth/signup, /auth/login, /auth/me
├── analyze.py           # POST /analyze — validation, DSP, triage
├── meta.py              # /, /health, /papers, /features
├── db.py                # sqlite user store (one table, no ORM)
├── security.py          # bcrypt + python-jose helpers
├── schemas.py           # Pydantic response models
├── pipeline.py          # OpenCV DSP
├── clinical.py          # Hb map + WHO / AABB triage
├── model.py             # ConvNeXt-Tiny wrapper (opt-in)
├── catalog.py           # bibliography + feature catalog
└── tests/               # pytest — clinical, meta, analyze, auth
```

Security notes:
- Bearer-token JWT (HS256) via `python-jose`; passwords hashed with `bcrypt`.
- Uploads: size cap, header + real-bytes MIME sniffing via `filetype`.
- Per-request UUIDs on every response and log line.
- Per-IP rate limiting via `slowapi` on `/analyze` and both auth endpoints.
- CORS narrowed to the configured origin list; no `*`.

## Research papers used

1. Dawson JB, et al. Phys Med Biol. 1980;25(4):695-709. [10.1088/0031-9155/25/4/008](https://doi.org/10.1088/0031-9155/25/4/008) — erythema index physics.
2. Collings S, et al. PLoS One. 2016;11(4):e0153286. [10.1371/journal.pone.0153286](https://doi.org/10.1371/journal.pone.0153286) — palpebral EI vs Hb.
3. Dimauro G, et al. IEEE Access. 2018;6:46968-46975. [10.1109/ACCESS.2018.2867110](https://doi.org/10.1109/ACCESS.2018.2867110) — CIELAB a*.
4. Mannino RG, et al. Nat Commun. 2018;9:4924. [10.1038/s41467-018-07262-2](https://doi.org/10.1038/s41467-018-07262-2) — phone-only Hb (nailbed; related).
5. Dimauro G, et al. IEEE Access. 2019;7:113488-113498. [10.1109/ACCESS.2019.2932274](https://doi.org/10.1109/ACCESS.2019.2932274) — a* + EI jointly.
6. Zhao L, et al. PLoS One. 2021;16(7):e0253495. [10.1371/journal.pone.0253495](https://doi.org/10.1371/journal.pone.0253495) — smartphone conjunctival Hb in ED.
7. Ghosal S, et al. IEEE Sens J. 2021. [10.1109/JSEN.2020.3044386](https://doi.org/10.1109/JSEN.2020.3044386) — sHEMO spectroscopy.
8. Liu Z, et al. CVPR. 2022. [10.1109/CVPR52688.2022.01167](https://doi.org/10.1109/CVPR52688.2022.01167) — ConvNeXt.
9. Carson JL, et al. JAMA. 2023;330(19):1892-1902. [10.1001/jama.2023.12914](https://doi.org/10.1001/jama.2023.12914) — AABB 7 g/dL.
10. Zhao L, et al. PLoS One. 2024;19(5):e0302883. [10.1371/journal.pone.0302883](https://doi.org/10.1371/journal.pone.0302883) — real-time app; AUC 0.92/0.90 at 7/9 g/dL.
11. Kato S, et al. Br J Haematol. 2024;205(4):1590-1598. [10.1111/bjh.19621](https://doi.org/10.1111/bjh.19621) — DL Hb regression.
12. WHO. Guideline on haemoglobin cutoffs… Geneva: WHO; 2024. [9789240088542](https://www.who.int/publications/i/item/9789240088542).
13. Asare JW, et al. Healthc Inform Res. 2025;31(1):57-70. [PMC11854623](https://pmc.ncbi.nlm.nih.gov/articles/PMC11854623/) — conjunctiva CNN ensemble, AUC 0.97.

Same list, with "how it is used," lives on the **Evidence** page.
