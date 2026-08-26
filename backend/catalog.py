"""Bibliography and implemented-feature catalog served to the Evidence page."""

PAPERS = [
    {
        "id": "collings-2016",
        "year": 2016,
        "citation": (
            "Collings S, Thompson O, Hirst E, Goossens L, George A, Weinkove R. "
            "Non-Invasive Detection of Anaemia Using Digital Photographs of the Conjunctiva. "
            "PLoS One. 2016;11(4):e0153286."
        ),
        "doi": "10.1371/journal.pone.0153286",
        "url": "https://doi.org/10.1371/journal.pone.0153286",
        "used_for": "Palpebral erythema index (log-ratio of red to green) as a hemoglobin correlate; ambient-light photography protocol.",
    },
    {
        "id": "dimauro-2018",
        "year": 2018,
        "citation": (
            "Dimauro G, Caivano D, Girardi F. A New Method and a Non-Invasive Device to Estimate "
            "Anemia Based on Digital Images of the Conjunctiva. IEEE Access. 2018;6:46968-46975."
        ),
        "doi": "10.1109/ACCESS.2018.2867110",
        "url": "https://doi.org/10.1109/ACCESS.2018.2867110",
        "used_for": "CIELAB a* as the redness axis of palpebral mucosa; kNN-style transfusion-need screening.",
    },
    {
        "id": "mannino-2018",
        "year": 2018,
        "citation": (
            "Mannino RG, Myers DR, Tyburski EA, et al. Smartphone app for non-invasive detection of "
            "anemia using only patient-sourced photos. Nat Commun. 2018;9:4924."
        ),
        "doi": "10.1038/s41467-018-07262-2",
        "url": "https://doi.org/10.1038/s41467-018-07262-2",
        "used_for": "Proof that smartphone photography can estimate Hb without extra hardware (fingernail bed; cited as related method, not our ROI).",
    },
    {
        "id": "dimauro-2019",
        "year": 2019,
        "citation": (
            "Dimauro G, Guarini A, Caivano D, Girardi F, Pasciolla C, Iacobazzi A. Detecting Clinical "
            "Signs of Anaemia From Digital Images of the Palpebral Conjunctiva. IEEE Access. "
            "2019;7:113488-113498."
        ),
        "doi": "10.1109/ACCESS.2019.2932274",
        "url": "https://doi.org/10.1109/ACCESS.2019.2932274",
        "used_for": "Joint use of erythema index and CIELAB a* on palpebral conjunctiva; Hb absorption in green vs reflection in red.",
    },
    {
        "id": "zhao-2021",
        "year": 2021,
        "citation": (
            "Zhao L, Vidwans A, Bearnot CJ, et al. Prediction of anemia and estimation of hemoglobin "
            "concentration using a smartphone camera. PLoS One. 2021;16(7):e0253495."
        ),
        "doi": "10.1371/journal.pone.0253495",
        "url": "https://doi.org/10.1371/journal.pone.0253495",
        "used_for": "ED derivation/validation of conjunctival Hb (HBc); accuracy around transfusion cutoffs; skin-tone invariance note.",
    },
    {
        "id": "ghoshal-2021",
        "year": 2021,
        "citation": (
            "Ghosal S, et al. sHEMO: Smartphone Spectroscopy for Blood Hemoglobin Level Monitoring "
            "in Smart Anemia-Care. IEEE Sens J. 2021;21(7):8520-8529."
        ),
        "doi": "10.1109/JSEN.2020.3044386",
        "url": "https://doi.org/10.1109/JSEN.2020.3044386",
        "used_for": "Autonomous conjunctival ROI + color spectroscopy on a phone camera.",
    },
    {
        "id": "liu-2022",
        "year": 2022,
        "citation": (
            "Liu Z, Mao H, Wu CY, Feichtenhofer C, Darrell T, Xie S. A ConvNet for the 2020s. "
            "Proc IEEE/CVF CVPR. 2022:11976-11986."
        ),
        "doi": "10.1109/CVPR52688.2022.01167",
        "url": "https://doi.org/10.1109/CVPR52688.2022.01167",
        "used_for": "ConvNeXt-Tiny backbone used as the regression architecture.",
    },
    {
        "id": "carson-2023",
        "year": 2023,
        "citation": (
            "Carson JL, Guyatt G, Heddle NM, et al. Red Blood Cell Transfusion: 2023 AABB "
            "International Guidelines. JAMA. 2023;330(19):1892-1902."
        ),
        "doi": "10.1001/jama.2023.12914",
        "url": "https://doi.org/10.1001/jama.2023.12914",
        "used_for": "Restrictive transfusion threshold of 7 g/dL for hemodynamically stable adults.",
    },
    {
        "id": "zhao-2024",
        "year": 2024,
        "citation": (
            "Zhao L, Vidwans A, Bearnot CJ, Rayner J, Lin T, Baird J, et al. Prediction of anemia "
            "in real-time using a smartphone camera processing conjunctival images. PLoS One. "
            "2024;19(5):e0302883."
        ),
        "doi": "10.1371/journal.pone.0302883",
        "url": "https://doi.org/10.1371/journal.pone.0302883",
        "used_for": "On-device palpebral imaging; AUC maximized at 7 and 9 g/dL (0.92 / 0.90); 435 ED patients.",
    },
    {
        "id": "kato-2024",
        "year": 2024,
        "citation": (
            "Kato S, Chagi K, Takagi Y, et al. Machine/deep learning-assisted hemoglobin level "
            "prediction using palpebral conjunctival images. Br J Haematol. 2024;205(4):1590-1598."
        ),
        "doi": "10.1111/bjh.19621",
        "url": "https://doi.org/10.1111/bjh.19621",
        "used_for": "DL regression of continuous Hb from palpebral frames rather than binary anemia labels.",
    },
    {
        "id": "who-2024",
        "year": 2024,
        "citation": (
            "World Health Organization. Guideline on haemoglobin cutoffs to define anaemia in "
            "individuals and populations. Geneva: WHO; 2024."
        ),
        "doi": "9789240088542",
        "url": "https://www.who.int/publications/i/item/9789240088542",
        "used_for": "Adult haemoglobin cutoffs (women 12.0 g/dL, men 13.0 g/dL) used in WHO class.",
    },
    {
        "id": "asare-2025",
        "year": 2025,
        "citation": (
            "Asare JW, Appiahene P, Donkoh ET, et al. Deep Learning Model-Based Detection of Anemia "
            "from Conjunctiva Images. Healthc Inform Res. 2025;31(1):57-70."
        ),
        "doi": "10.4258/hir.2025.31.1.57",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11854623/",
        "used_for": "CNN ensembles on palpebral images; reported stacking AUC 0.97 for anemia detection.",
    },
    {
        "id": "dawson-1980",
        "year": 1980,
        "citation": (
            "Dawson JB, Barker DJ, Ellis DJ, et al. A theoretical and experimental study of light "
            "absorption and scattering by in vivo skin. Phys Med Biol. 1980;25(4):695-709."
        ),
        "doi": "10.1088/0031-9155/25/4/008",
        "url": "https://doi.org/10.1088/0031-9155/25/4/008",
        "used_for": "Physical basis of the erythema index: differential absorption of green vs red light by haemoglobin.",
    },
]

FEATURES = [
    {
        "group": "Capture",
        "items": [
            "Front-facing webcam at up to 1080p, with a digital zoom slider (1–5×) so the palpebral conjunctiva fills the reticle.",
            "Dashed oval reticle sized for the inner eyelid, not the iris or sclera.",
            "Three-count capture to reduce motion blur before the JPEG is sent.",
            "Upload path for a still photograph when no camera is available.",
            "Optional sex (unspecified / female / male) so WHO 2024 cutoffs can be applied.",
        ],
    },
    {
        "group": "Signal processing",
        "items": [
            "Center crop of the reticle region so background skin and room light do not dominate the mean.",
            "Specular-glare mask (luminance > 235) and Telea inpainting for sunlight / flash hotspots.",
            "3×3 high-pass kernel to lift capillary contrast before colour stats.",
            "CIELAB split: L* (luminance), a* (red–green, melanin-sparse on palpebral mucosa), b*.",
            "Erythema index EI = 100 · (log10 R − log10 G) on the restored ROI.",
            "Quality gates: glare fraction, mean L*, ROI pixel count, and a confidence score.",
        ],
    },
    {
        "group": "Estimation",
        "items": [
            "Linear chromophore map from true a* (OpenCV a − 128) and EI to Hb in g/dL, clipped to 3–18.",
            "ConvNeXt-Tiny with a dropout → 256-d GELU → scalar head (architecture live; ImageNet weights are not the reported Hb).",
            "± uncertainty band scaled from image quality (not a lab CV).",
        ],
    },
    {
        "group": "Triage",
        "items": [
            "WHO 2024 adult anaemia cutoffs (12.0 g/dL women, 13.0 g/dL men; 12.0 if sex unspecified).",
            "AABB 2023 restrictive transfusion band at 7 g/dL.",
            "Zhao et al. 2024 high-AUC operating points at 7 and 9 g/dL called out on the result sheet.",
        ],
    },
    {
        "group": "Workstation",
        "items": [
            "Four-page nav: Exam, Protocol, Evidence, Log.",
            "Lab-style result sheet (Hb, WHO class, quality, chromophores).",
            "Local exam log in the browser (not uploaded).",
            "Same-origin /api/analyze proxy to FastAPI on port 8000.",
        ],
    },
]
