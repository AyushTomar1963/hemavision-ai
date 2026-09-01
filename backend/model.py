"""ConvNeXt-Tiny regression backbone (architecture demo).

Torch and torchvision are imported lazily inside `load_model` and
`tensor_from_bgr` so a torch-free production install (Render free tier,
say) can still run the DSP pipeline. If torch is missing, load_model
returns None and the chromophore path handles the request.
"""

from __future__ import annotations

from typing import Any, Optional

import numpy as np

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def load_model() -> Optional[Any]:
    try:
        import torch
        import torch.nn as nn
        from torchvision.models import ConvNeXt_Tiny_Weights, convnext_tiny
    except ImportError as exc:
        print(f"[HemaVision] torch not installed — ConvNeXt disabled ({exc})")
        return None

    class HemaVisionRegressor(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.backbone = convnext_tiny(weights=ConvNeXt_Tiny_Weights.DEFAULT)
            self.backbone.classifier[2] = nn.Sequential(
                nn.Dropout(p=0.4),
                nn.Linear(768, 256),
                nn.GELU(),
                nn.Linear(256, 1),
            )

        def forward(self, x):  # noqa: ANN001, ANN201 — torch types not always available
            return self.backbone(x)

    try:
        model = HemaVisionRegressor()
        model.eval()
        return model
    except Exception as exc:
        print(f"[HemaVision] ConvNeXt init skipped: {exc}")
        return None


def tensor_from_bgr(image_bgr: np.ndarray):
    import cv2
    import torch

    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    x = resized.astype(np.float32) / 255.0
    x = (x - IMAGENET_MEAN) / IMAGENET_STD
    x = np.transpose(x, (2, 0, 1))
    return torch.from_numpy(x).unsqueeze(0)
