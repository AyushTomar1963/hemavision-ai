"""ConvNeXt-Tiny regression backbone (architecture demo)."""

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
from torchvision.models import ConvNeXt_Tiny_Weights, convnext_tiny

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


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

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)


def load_model() -> HemaVisionRegressor | None:
    try:
        model = HemaVisionRegressor()
        model.eval()
        return model
    except Exception as exc:
        print(f"[HemaVision] ConvNeXt init skipped: {exc}")
        return None


def tensor_from_bgr(image_bgr: np.ndarray) -> torch.Tensor:
    import cv2

    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    x = resized.astype(np.float32) / 255.0
    x = (x - IMAGENET_MEAN) / IMAGENET_STD
    x = np.transpose(x, (2, 0, 1))
    return torch.from_numpy(x).unsqueeze(0)
