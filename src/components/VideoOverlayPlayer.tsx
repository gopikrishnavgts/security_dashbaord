import { useEffect, useMemo, useRef } from "react";

type BBox = [number, number, number, number];
type Detection = { tracker_id: number; class_name: string; bbox: BBox };

// Per-video annotations: timestamp (seconds) -> detections for that frame window
export type PerVideoAnnotations = Record<number, Detection[]>;

export function VideoOverlayPlayer({
  videoSrc,
  annotations,
  showLabels = true,
  onStats,
}: {
  videoSrc: string;
  annotations: PerVideoAnnotations | null; // CHANGED: per-video map
  showLabels?: boolean;
  onStats?: (stats: {
    timestamp: number;
    wearingCap: number;
    customers: number;
    uncappedWorkers: number;
    totalDetections: number;
  }) => void;
}) {
  // Refs that TS complained were missing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDrawTimeRef = useRef<number>(0);

  // Sorted numeric timestamps from the per-video annotations
  const sortedKeys = useMemo(() => {
    if (!annotations) return [] as number[];
    return Object.keys(annotations)
      .map((k) => parseFloat(k))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
  }, [annotations]);

  function findNearestTimestamp(ts: number): number | null {
    if (sortedKeys.length === 0) return null;
    let lo = 0;
    let hi = sortedKeys.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const mv = sortedKeys[mid];
      if (mv === ts) return mv;
      if (mv < ts) lo = mid + 1;
      else hi = mid - 1;
    }
    const cand: number[] = [];
    if (lo < sortedKeys.length) cand.push(sortedKeys[lo]);
    if (hi >= 0) cand.push(sortedKeys[hi]);
    cand.sort((a, b) => Math.abs(a - ts) - Math.abs(b - ts));
    return cand.length ? cand[0] : null;
  }

  function colorForClass(name: string): string {
    switch (name) {
      case "Employee":
        return "#32CD32";
      case "Customer":
        return "#00FFFF";
      default:
        return "#FFD700";
    }
  }

  function resizeCanvasToVideo(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const vw = video.clientWidth;
    const vh = video.clientHeight;
    canvas.width = Math.max(1, Math.floor(vw * dpr));
    canvas.height = Math.max(1, Math.floor(vh * dpr));
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const now = performance.now();
    if (now - lastDrawTimeRef.current < 16) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    lastDrawTimeRef.current = now;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    resizeCanvasToVideo(video, canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!annotations || sortedKeys.length === 0) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const step = 0.07;
    const current = video.currentTime;
    const snapped = Math.round(current / step) * step;
    const key = findNearestTimestamp(snapped);
    if (key == null) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    const detections = annotations[key] ?? [];

    const vw = video.videoWidth || canvas.width;
    const vh = video.videoHeight || canvas.height;
    if (vw === 0 || vh === 0) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    let coordW = vw;
    let coordH = vh;
    if (detections.length > 0) {
      const [sx1, sy1, sx2, sy2] = detections[0].bbox;
      const looksNormalized = sx2 <= 1 && sy2 <= 1 && sx1 >= 0 && sy1 >= 0;
      if (looksNormalized) {
        coordW = 1;
        coordH = 1;
      } else if (sx2 > vw || sy2 > vh) {
        let maxX = 0;
        let maxY = 0;
        for (const d of detections) {
          if (d.bbox[2] > maxX) maxX = d.bbox[2];
          if (d.bbox[3] > maxY) maxY = d.bbox[3];
        }
        if (maxX > 0 && maxY > 0) {
          coordW = maxX;
          coordH = maxY;
        }
      }
    }

    const elemW = video.clientWidth;
    const elemH = video.clientHeight;
    const scale = Math.min(elemW / vw, elemH / vh);
    const drawW = vw * scale;
    const drawH = vh * scale;
    const offsetX = (elemW - drawW) / 2;
    const offsetY = (elemH - drawH) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.lineWidth = 2;
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

    for (const det of detections) {
      const [bx1, by1, bx2, by2] = det.bbox;
      const color = colorForClass(det.class_name);
      const x1 = (bx1 / coordW) * vw;
      const y1 = (by1 / coordH) * vh;
      const x2 = (bx2 / coordW) * vw;
      const y2 = (by2 / coordH) * vh;
      const w = (x2 - x1) * scale;
      const h = (y2 - y1) * scale;
      const x = x1 * scale;
      const y = y1 * scale;

      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);

      if (showLabels) {
        const label = `${det.class_name} #${det.tracker_id}`;
        const paddingX = 4;
        const paddingY = 2;
        const metrics = ctx.measureText(label);
        const textW = metrics.width;
        const textH = 12;
        const bgX = x;
        const bgY = Math.max(0, y - (textH + paddingY * 2 + 2));
        ctx.fillStyle = color;
        ctx.fillRect(bgX, bgY, textW + paddingX * 2, textH + paddingY * 2);
        ctx.fillStyle = "#000";
        ctx.fillText(label, bgX + paddingX, bgY + paddingY + textH - 2);
      }
    }
    ctx.restore();

    if (onStats) {
      const lower = (s: string) => s.toLowerCase();
      let wearingCap = 0;
      let employees = 0;
      let customers = 0;
      for (const d of detections) {
        if (d.class_name === "Wearing Cap") wearingCap += 1;
        if (d.class_name === "Employee") employees += 1;
      }

      const uncappedWorkers = Math.max(0, employees - wearingCap);
      onStats({
        timestamp: key,
        wearingCap,
        customers,
        uncappedWorkers,
        totalDetections: detections.length,
      });
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }

  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const onPlay = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawFrame);
    };
    const onPause = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const onResize = () => resizeCanvasToVideo(v, c);
    const onLoadedMetadata = () => resizeCanvasToVideo(v, c);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", onLoadedMetadata);
    window.addEventListener("resize", onResize);
    if (!v.paused) onPlay();

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, sortedKeys.join("|")]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
      <video
        ref={videoRef}
        src={videoSrc}
        className="h-full w-full object-contain"
        controls
        muted
        autoPlay
        playsInline
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (!v) return;
          const tryPlay = () => v.play().catch(() => {});
          tryPlay();
          v.addEventListener("canplay", tryPlay, { once: true });
        }}
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
