# HemaVision

Palpebral conjunctiva haemoglobin screening. A webcam or photograph of the inner eyelid is processed with OpenCV, mapped to an estimated Hb, and labelled with WHO / AABB bands.

**Screening aid only. A laboratory CBC remains the reference standard.**

## Run

Backend, port 8000:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend, port 3000:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pages: **Exam**, **Protocol**, **Evidence**, **Log**.

## Implemented features

**Capture**
- Front-facing 1080p webcam, 1–5× digital zoom, palpebral reticle
- Three-count capture; still-photo upload
- Optional sex for WHO 2024 cutoffs

**Signal processing**
- Centre-crop of the reticle
- Specular glare mask (L > 235) + Telea inpaint
- Vascular high-pass kernel
- CIELAB L*, a* (OpenCV a − 128), b*
- Erythema index EI = 100 · (log₁₀ R − log₁₀ G)
- Quality: glare %, luminance, ROI size, confidence flags

**Estimation**
- Hb ≈ 7.6 + 0.18·a* + 0.11·EI g/dL (clipped 3–18)
- ConvNeXt-Tiny + dropout/GELU regression head (architecture live; ImageNet weights are not the reported Hb)
- Quality-scaled uncertainty band

**Triage**
- WHO 2024 adult cutoffs (women 12.0, men 13.0 g/dL)
- AABB 2023 restrictive transfusion band at 7 g/dL
- Zhao 2024 high-AUC 7 and 9 g/dL operating points on the sheet

**Workstation**
- Exam / Protocol / Evidence / Log
- Lab-style report; browser-only exam log
- FastAPI: `POST /analyze`, `GET /papers`, `GET /features`, `GET /health`

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

Same list, with “how it is used,” lives on the **Evidence** page.
