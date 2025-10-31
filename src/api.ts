import type {
  Alert,
  Camera,
  Zone,
  User,
  Incident,
  AnalyticsBucket,
  SystemSettings,
  OverviewStats,
} from './types';

const API_BASE = '/api';

// Helper for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Authentication
export const login = (email: string, password: string) =>
  fetchAPI<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

// Stats
export const getOverviewStats = () => fetchAPI<OverviewStats>('/stats/overview');

// Cameras
export const getCameras = () => fetchAPI<Camera[]>('/cameras');
export const getCamera = (id: string) => fetchAPI<Camera>(`/cameras/${id}`);

// Zones
export const getZones = () => fetchAPI<Zone[]>('/zones');

// Alerts
export interface AlertsParams {
  status?: string;
  event?: string;
  zoneId?: string;
  cameraId?: string;
  q?: string;
  from?: string;
  to?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
}

export const getAlerts = (params?: AlertsParams) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
  }
  return fetchAPI<{ alerts: Alert[]; total: number; page: number; pageSize: number }>(
    `/alerts?${query.toString()}`
  );
};

export const getAlert = (id: string) => fetchAPI<Alert>(`/alerts/${id}`);

export const updateAlert = (id: string, data: Partial<Alert>) =>
  fetchAPI<Alert>(`/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Incidents
export interface IncidentsParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'resolved';
}

export const getIncidents = (params?: IncidentsParams) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
  }
  return fetchAPI<{
    incidents: Incident[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/incidents?${query.toString()}`);
};

export const getIncident = (id: string) => fetchAPI<Incident>(`/incidents/${id}`);

export const createIncident = (data: Partial<Incident>) =>
  fetchAPI<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateIncident = (id: string, data: Partial<Incident>) =>
  fetchAPI<Incident>(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Analytics
export const getHourlyAnalytics = (from?: string, to?: string) => {
  const query = new URLSearchParams();
  if (from) query.append('from', from);
  if (to) query.append('to', to);
  return fetchAPI<AnalyticsBucket[]>(`/analytics/hourly?${query.toString()}`);
};

// Settings
export const getSettings = () => fetchAPI<SystemSettings>('/settings');

export const updateSettings = (data: Partial<SystemSettings>) =>
  fetchAPI<SystemSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Users
export const getUsers = () => fetchAPI<User[]>('/users');
