// Event types specific to bakery/cafe security
export type EventType =
  | "cap_non_compliance"        // Employee without required cap/hat
  | "zone_violation"            // Unauthorized person in restricted area
  | "after_hours_activity"      // Motion detection during closed hours
  | "multiple_violations"       // Repeated safety rule breaks
  | "missing_employee"          // Expected employee count mismatch
  | "theft_suspicious"          // Unusual behavior near cash/storage
  | "loitering"                 // Extended presence in one area
  | "suspicious_behavior"       // Unusual movement patterns
  | "crowd_detection"           // Unusual crowd gathering
  | "slip_fall_risk";           // Safety hazard detected

export type AlertStatus = "pending" | "verified" | "dismissed";

export type CameraStatus = "online" | "offline" | "maintenance";

export type RiskLevel = "low" | "med" | "high";

export type UserRole = "admin" | "security" | "viewer";

export type IncidentDisposition =
  | "loss_prevented"
  | "no_event"
  | "theft_occurred"
  | "safety_violation"
  | "under_investigation"
  | "unknown";

export interface Alert {
  id: string;
  cameraId: string;
  zoneId: string;
  event: EventType;
  score: number; // AI confidence 0-1
  startedAt: string; // ISO timestamp
  endedAt?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  status: AlertStatus;
  assignedTo?: string; // user ID
  trackId?: string;
  metadata?: {
    personCount?: number;
    employeeCount?: number;
    customersCount?: number;
    uncappedWorkers?: number;
    objectsDetected?: string[];
    duration?: number; // seconds
    nvrChannel?: number;
  };
}

export interface Incident {
  id: string;
  alertIds: string[]; // linked alerts
  createdAt: string;
  resolvedAt?: string;
  disposition: IncidentDisposition;
  notes?: string;
  videoUrl?: string;
  estimatedLoss?: number;
  assignedTo?: string;
}

export interface Camera {
  id: string;
  name: string;
  zoneId: string;
  status: CameraStatus;
  rtspUrl?: string;
  lastSeen?: string;
  nvrChannel?: number;
  videoFile?: string; // path to NVR video file
}

export interface Zone {
  id: string;
  name: string; // e.g., "Cashier Zone", "Employee Zone", etc.
  riskLevel: RiskLevel;
  cameraCount?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
}

export interface AnalyticsBucket {
  ts: string; // ISO timestamp for hourly bucket
  alerts: number;
  verified: number;
  falsePositives: number;
  dismissed: number;
  byEvent: Record<string, number>;
  byZone?: Record<string, number>;
}

export interface SystemSettings {
  alertThreshold: number; // min confidence score 0-1
  cooldownWindow: number; // seconds between duplicate alerts
  autoArchiveDays: number;
  notificationChannels: string[];
  enableRealtime: boolean;
  enableAudioAlerts: boolean;
}

export interface OverviewStats {
  totalAlerts24h: number;
  pendingReview: number;
  detectionAccuracy: number;
  lossPrevention: number;
  cameraUptime: number;
  highRiskZones: number;
  avgResponseTime: number; // minutes
  topThreat: EventType | null;
}

export interface Toast {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
}
