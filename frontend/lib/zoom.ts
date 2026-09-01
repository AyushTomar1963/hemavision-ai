/**
 * Robust webcam zoom.
 *
 * Path A — hardware/optical zoom: on Chromium-family browsers where the
 * camera exposes a `zoom` capability we drive it through the standard
 * `MediaStreamTrack.applyConstraints`. The captured JPEG already carries
 * the zoomed pixels, so no CSS transform and no client-side crop is
 * needed.
 *
 * Path B — canvas fallback: for cameras or browsers without a zoom
 * capability (most laptop webcams, Safari today) we crop the raw frame
 * to 1/zoom of its dimensions on a canvas. The user still sees a CSS
 * scale for feedback, but the bytes we send match what the operator
 * sees.
 *
 * Refs:
 *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities
 *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
 */

type ZoomCapability = { min: number; max: number; step?: number };

type ExtendedCapabilities = MediaTrackCapabilities & { zoom?: ZoomCapability };
type ExtendedConstraint = MediaTrackConstraintSet & { zoom?: number };

export type ZoomCaps = {
  supported: boolean;
  min: number;
  max: number;
  step: number;
};

export const DEFAULT_ZOOM_CAPS: ZoomCaps = {
  supported: false,
  min: 1,
  max: 5,
  step: 0.1,
};

export function readZoomCapabilities(track: MediaStreamTrack | null): ZoomCaps {
  if (!track || typeof track.getCapabilities !== "function") {
    return DEFAULT_ZOOM_CAPS;
  }
  const caps = track.getCapabilities() as ExtendedCapabilities;
  const zoom = caps.zoom;
  if (!zoom || typeof zoom.min !== "number" || typeof zoom.max !== "number") {
    return DEFAULT_ZOOM_CAPS;
  }
  return {
    supported: true,
    min: zoom.min,
    max: zoom.max,
    step: zoom.step ?? 0.1,
  };
}

export async function applyHardwareZoom(
  track: MediaStreamTrack | null,
  zoom: number,
): Promise<boolean> {
  if (!track || typeof track.applyConstraints !== "function") return false;
  try {
    const constraint: ExtendedConstraint = { zoom };
    await track.applyConstraints({ advanced: [constraint] });
    return true;
  } catch {
    return false;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode captured frame."));
    img.src = src;
  });
}

/**
 * Path B: crop the raw screenshot to 1/zoom of its dimensions.
 * Called when hardware zoom is not available.
 */
export async function cropCenterToZoom(
  dataUrl: string,
  zoom: number,
): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const safeZoom = Math.max(1, zoom);
  const cropW = Math.max(64, Math.floor(img.width / safeZoom));
  const cropH = Math.max(64, Math.floor(img.height / safeZoom));
  const sx = Math.floor((img.width - cropW) / 2);
  const sy = Math.floor((img.height - cropH) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available in this browser.");
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG encode failed."))),
      "image/jpeg",
      0.95,
    ),
  );
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
