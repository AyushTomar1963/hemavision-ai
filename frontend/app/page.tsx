"use client";

import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { AlertCircle, Activity, Camera, Upload } from "lucide-react";

type AnalyzeResult = {
  hemoglobin_g_dL: number;
  status: string;
  metrics: {
    cielab_a_star: number;
    erythema_index: number;
  };
};

export default function HemaVisionScanner() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(2.5);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const analyzeBlob = useCallback(async (blob: Blob) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Analysis failed (${response.status})`);
      }

      const data: AnalyzeResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Inference Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the HemaVision backend.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("Camera is not ready. Allow webcam access or upload a photo.");
      return;
    }
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    await analyzeBlob(blob);
  }, [analyzeBlob]);

  const onUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) await analyzeBlob(file);
      event.target.value = "";
    },
    [analyzeBlob],
  );

  const isCritical = result !== null && result.hemoglobin_g_dL < 9.0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center p-6 sm:p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400/80 font-semibold">
            Point-of-care screening
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-red-500">
            HemaVision AI
          </h1>
          <p className="text-neutral-400">
            Non-Invasive Conjunctival Anemia Screener
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-neutral-800">
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.95}
              className="w-full h-full object-cover transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              videoConstraints={{
                facingMode: "user",
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }}
              onUserMedia={() => setCameraReady(true)}
              onUserMediaError={() => {
                setCameraReady(false);
                setError(
                  "Webcam unavailable. Upload a conjunctiva photo instead.",
                );
              }}
            />
          </div>

          <div className="absolute inset-0 border-4 border-red-500/30 rounded-2xl pointer-events-none" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-32 border-2 border-dashed border-red-500/80 rounded-[100%] flex items-center justify-center bg-red-500/10 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <span className="text-xs text-white font-bold tracking-widest drop-shadow-md">
              ALIGN EYE
            </span>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-md z-10">
            <span className="text-white/70 text-xl font-bold leading-none">
              −
            </span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32 accent-red-500"
              aria-label="Digital zoom"
            />
            <span className="text-white/70 text-xl font-bold leading-none">
              +
            </span>
          </div>

          {!cameraReady && (
            <div className="absolute top-3 left-3 text-[11px] text-neutral-400 bg-black/60 px-2 py-1 rounded z-10">
              Waiting for camera…
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={captureAndAnalyze}
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Activity className="animate-spin" /> : <Camera />}
            {loading ? "Processing RAW Signal..." : "Scan Hemoglobin"}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border border-neutral-700"
          >
            <Upload size={18} />
            Upload conjunctiva photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-700 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-neutral-400 font-medium uppercase tracking-wider text-sm">
                  Estimated Hb
                </h3>
                <div className="text-5xl font-black text-white">
                  {result.hemoglobin_g_dL}{" "}
                  <span className="text-xl text-neutral-500">g/dL</span>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                  isCritical
                    ? "bg-red-500/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                <AlertCircle size={16} />
                {result.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700">
              <div>
                <div className="text-xs text-neutral-500">CIELAB a* Vector</div>
                <div className="font-mono">{result.metrics.cielab_a_star}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Erythema Index</div>
                <div className="font-mono">{result.metrics.erythema_index}</div>
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Screening aid only. Not a diagnostic substitute for a complete
              blood count. Triage bands follow 7–9 g/dL clinical thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
