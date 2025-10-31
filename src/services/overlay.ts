import api from "../lib/axios";

export type OverlayDetection = {
  tracker_id: number;
  class_name: string;
  bbox: [number, number, number, number];
};

export type OverlayPayload = {
  videoUrl: string;
  annotations: Record<string, OverlayDetection[]>;
};

const sourceEndpoint =
  (import.meta.env.VITE_VIDEO_SOURCE_ENDPOINT as string | undefined) ||
  "/api/overlay";

export async function fetchOverlay(): Promise<OverlayPayload> {
  const res = await api.get<OverlayPayload>(sourceEndpoint);
  return res.data;
}
