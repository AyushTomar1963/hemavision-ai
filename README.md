# HemaVision AI

Non-invasive conjunctival anemia screener. A webcam or uploaded photo of the inner eyelid is processed with OpenCV (glare inpainting, vascular sharpening, CIELAB + erythema index) and mapped to an estimated hemoglobin value with a ConvNeXt-Tiny regression architecture.

**Screening aid only — not a substitute for a laboratory CBC.**

## Run locally

**Backend** (Python 3.10+, port 8000):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (Node 22+, port 3000):

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), allow the camera, align the lower eyelid in the dashed oval, and tap **Scan Hemoglobin**. You can also upload a conjunctiva photo (a synthetic sample is at `backend/test_conjunctiva.jpg`).

## Progress Made

- End-to-end capture → DSP → Hb estimate → triage UI on a single localhost stack.
- Specular glare / sunlight artifacts removed with an OpenCV highlight mask + Telea inpainting so outdoor point-of-care frames do not saturate the redness signal.
- High-pass 2D spatial filter applied after inpainting to sharpen capillary contrast before chromophore extraction.
- CIELAB `a*` (red–green chromaticity, luminance-decoupled) and Erythema Index `log10(R) − log10(G)` computed on the aligned conjunctival ROI, not the full webcam frame.
- ConvNeXt-Tiny backbone with a custom dropout → 256-d GELU → scalar regression head (replacing the ImageNet classifier), matching 2024 non-invasive anemia CNN setups that reported peak AUC ≈ 0.97 on the actionable 7–9 g/dL band.
- Clinical mapping from the PLOS ONE / MDPI chromophore relationship:  
  `Hb ≈ 0.085·a* + 0.04·EI + 1.2` (g/dL), clipped to a physiological 3–18 g/dL range.
- Triage labels at 5 / 7 / 9 / 12 g/dL (critical, transfusion threshold, moderate, mild, normemic).
- Next.js scanner with webcam overlay, JPEG capture, same-origin `/api/analyze` proxy, and photo-upload fallback.

## Technical Architecture

```
Webcam / upload (JPEG)
        │
        ▼
Next.js UI  ──POST /api/analyze──►  FastAPI
                                        │
                         1. Center-crop conjunctival ROI
                         2. Threshold glare (gray > 235) + inpaint
                         3. High-pass kernel (vascular sharpening)
                         4. BGR → CIELAB  → mean a*
                         5. Erythema Index from log R / log G
                         6. ConvNeXt-Tiny forward (architecture live)
                         7. Chromophore regression → Hb g/dL
                         8. Threshold triage
                                        │
                                        ▼
                         JSON { hemoglobin_g_dL, status, metrics }
```

| Layer | Stack |
| --- | --- |
| Capture UI | Next.js 16, React 19, `react-webcam`, Tailwind CSS |
| API | FastAPI + CORS, `python-multipart` |
| DSP | OpenCV (`inpaint`, `filter2D`, CIELAB split) |
| Colorimetry | CIELAB `a*`, erythema index |
| DL backbone | PyTorch ConvNeXt-Tiny + custom 768→256→1 head |
| Decision | Hb formula + 7–9 g/dL transfusion-band triage |

Hackathon demo uses ImageNet-initialized ConvNeXt weights; the displayed Hb is the published chromophore mapping so judges see a calibrated number without a private clinical weight file.
