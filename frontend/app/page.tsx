"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { ResultSheet } from "@/components/ResultSheet";
import { analyze } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { appendExam } from "@/lib/log";
import type { AnalyzeResult } from "@/lib/types";
import {
  applyHardwareZoom,
  cropCenterToZoom,
  dataUrlToBlob,
  DEFAULT_ZOOM_CAPS,
  readZoomCapabilities,
  type ZoomCaps,
} from "@/lib/zoom";

type Sex = "unspecified" | "female" | "male";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function ExamPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownTimer = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { token } = useAuth();

  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoom, setZoom] = useState(2.5);
  const [zoomCaps, setZoomCaps] = useState<ZoomCaps>(DEFAULT_ZOOM_CAPS);
  const [sex, setSex] = useState<Sex>("unspecified");
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    return () => {
      if (countdownTimer.current !== null) {
        window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
    };
  }, []);

  const primaryTrack = useCallback((): MediaStreamTrack | null => {
    return streamRef.current?.getVideoTracks()[0] ?? null;
  }, []);

  const onUserMedia = useCallback(
    (stream: MediaStream) => {
      streamRef.current = stream;
      setCameraReady(true);
      const caps = readZoomCapabilities(stream.getVideoTracks()[0] ?? null);
      setZoomCaps(caps);
      if (caps.supported) {
        const clamped = Math.min(Math.max(zoom, caps.min), caps.max);
        setZoom(clamped);
        void applyHardwareZoom(stream.getVideoTracks()[0] ?? null, clamped);
      }
    },
    [zoom],
  );

  useEffect(() => {
    if (!zoomCaps.supported) return;
    void applyHardwareZoom(primaryTrack(), zoom);
  }, [zoom, zoomCaps.supported, primaryTrack]);

  const analyzeBlob = useCallback(
    async (blob: Blob, source: "camera" | "upload") => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyze(blob, sex, token);
        setResult(data);
        appendExam({ ...data, source });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "The analysis service did not respond.",
        );
      } finally {
        setLoading(false);
        setCountdown(null);
      }
    },
    [sex, token],
  );

  const captureNow = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Camera is not ready. Allow access or upload a photograph.");
      setCountdown(null);
      return;
    }
    try {
      // Hardware zoom is already baked into the frame; only crop for the
      // canvas fallback path.
      const blob = zoomCaps.supported
        ? await dataUrlToBlob(imageSrc)
        : await cropCenterToZoom(imageSrc, zoom);
      await analyzeBlob(blob, "camera");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed.");
      setCountdown(null);
    }
  }, [analyzeBlob, zoom, zoomCaps.supported]);

  const startCapture = useCallback(() => {
    if (loading || countdown !== null) return;
    setError(null);
    setCountdown(3);
    let n = 3;
    countdownTimer.current = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (countdownTimer.current !== null) {
          window.clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
        setCountdown(0);
        void captureNow();
      } else {
        setCountdown(n);
      }
    }, 650);
  }, [captureNow, countdown, loading]);

  const onUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError(`Not an image file (${file.type || "unknown type"}).`);
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(
          `Image is ${(file.size / (1024 * 1024)).toFixed(1)} MB; max ${
            MAX_UPLOAD_BYTES / (1024 * 1024)
          } MB.`,
        );
        return;
      }
      await analyzeBlob(file, "upload");
    },
    [analyzeBlob],
  );

  const captureDisabled = loading || countdown !== null;
  const zoomMin = zoomCaps.supported ? zoomCaps.min : 1;
  const zoomMax = zoomCaps.supported ? zoomCaps.max : 5;
  const zoomStep = zoomCaps.supported ? zoomCaps.step : 0.1;
  const zoomTransform = zoomCaps.supported ? "none" : `scale(${zoom})`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-serif text-3xl text-[var(--ink)] sm:text-4xl">
          Lower-lid exam
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Evert the lower eyelid. Fill the oval with the inner pink mucosa —
          not the iris, not the white of the eye. Hold still through the count.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.85fr)]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden border border-[var(--line)] bg-black">
            <div className="flex h-full w-full items-center justify-center overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.95}
                className="h-full w-full object-cover transition-transform duration-150"
                style={{ transform: zoomTransform }}
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                }}
                onUserMedia={onUserMedia}
                onUserMediaError={() => {
                  setCameraReady(false);
                  setError("No webcam. Use a photograph of the inner eyelid.");
                }}
              />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-60 -translate-x-1/2 -translate-y-1/2 rounded-[100%] border border-[#f3e6c8]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" />
            <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.18em] text-white/80">
              Inner eyelid
            </p>
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35">
                <span className="font-serif text-7xl text-white">{countdown}</span>
              </div>
            )}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 bg-black/55 px-3 py-1.5 text-white">
              <span className="text-sm">−</span>
              <input
                type="range"
                min={zoomMin}
                max={zoomMax}
                step={zoomStep}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-28"
                aria-label="Digital zoom"
              />
              <span className="text-sm">+</span>
              <span className="font-mono text-[11px] text-white/70">
                {zoom.toFixed(1)}×
                {zoomCaps.supported ? " · optical" : " · digital"}
              </span>
            </div>
            {!cameraReady && (
              <p className="absolute left-3 top-3 bg-black/55 px-2 py-1 text-[11px] text-white/80">
                Waiting for camera
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startCapture}
              disabled={captureDisabled}
              className="bg-[var(--brick)] px-5 py-2.5 text-sm text-[var(--surface)] disabled:opacity-50"
            >
              {loading ? "Reading chromophores…" : "Capture exam"}
            </button>
            <button
              type="button"
              disabled={captureDisabled}
              onClick={() => fileInputRef.current?.click()}
              className="border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Upload photograph
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <h2 className="font-serif text-lg">Before you capture</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
              <li>Sit facing a window or lamp — no direct flash on the lid.</li>
              <li>Pull the lower lid down until the mucosa is visible.</li>
              <li>Zoom until the oval is mostly pink tissue.</li>
              <li>Keep the head still through the three-count.</li>
            </ol>
            <p className="mt-3 text-[12px] text-[var(--muted)]">
              Full steps are on{" "}
              <a href="/protocol" className="underline decoration-[var(--line)]">
                Protocol
              </a>
              .
            </p>
          </div>

          <fieldset className="border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <legend className="px-1 font-serif text-lg">WHO cutoff</legend>
            <p className="mb-3 text-[12px] text-[var(--muted)]">
              Used only for the anaemia label, not the Hb number.
            </p>
            {(
              [
                ["unspecified", "Unspecified (12.0 g/dL)"],
                ["female", "Female (12.0 g/dL)"],
                ["male", "Male (13.0 g/dL)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="mb-1.5 flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="sex"
                  checked={sex === value}
                  onChange={() => setSex(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </aside>
      </div>

      {error && (
        <p className="mt-6 border border-[var(--brick)]/30 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--brick)]">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8">
          <ResultSheet result={result} />
        </div>
      )}
    </div>
  );
}
