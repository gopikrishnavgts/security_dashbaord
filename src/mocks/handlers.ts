import { http, HttpResponse, delay } from 'msw';
import type {
  Alert,
  Camera,
  Zone,
  User,
  Incident,
  SystemSettings,
  AnalyticsBucket,
  OverviewStats,
} from '../types';

// Load mock data
let alerts: Alert[] = [];
let cameras: Camera[] = [];
let zones: Zone[] = [];
let users: User[] = [];
let incidents: Incident[] = [];
let analytics: AnalyticsBucket[] = [];
let settings: SystemSettings = {
  alertThreshold: 0.65,
  cooldownWindow: 45,
  autoArchiveDays: 90,
  notificationChannels: [],
  enableRealtime: true,
  enableAudioAlerts: true,
};

// Initialize data
async function loadMockData() {
  try {
    const [
      alertsRes,
      camerasRes,
      zonesRes,
      usersRes,
      incidentsRes,
      analyticsRes,
      settingsRes,
    ] = await Promise.all([
      fetch('/mock/alerts.json'),
      fetch('/mock/cameras.json'),
      fetch('/mock/zones.json'),
      fetch('/mock/users.json'),
      fetch('/mock/incidents.json'),
      fetch('/mock/analytics.json'),
      fetch('/mock/settings.json'),
    ]);

    alerts = await alertsRes.json();
    cameras = await camerasRes.json();
    zones = await zonesRes.json();
    users = await usersRes.json();
    incidents = await incidentsRes.json();
    analytics = await analyticsRes.json();
    settings = await settingsRes.json();

    console.log('✅ Mock data loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load mock data:', error);
  }
}

// Call loadMockData immediately
loadMockData();

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    await delay(300);
    const body = await request.json() as { email: string; password: string };
    const user = users.find((u) => u.email === body.email);

    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ user });
  }),

  // Stats Overview
  http.get('/api/stats/overview', async () => {
    await delay(200);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const alerts24h = alerts.filter(
      (a) => new Date(a.startedAt) >= oneDayAgo
    );

    const pending = alerts24h.filter((a) => a.status === 'pending').length;
    const verified = alerts24h.filter((a) => a.status === 'verified').length;
    const dismissed = alerts24h.filter((a) => a.status === 'dismissed').length;

    const accuracy = verified + dismissed > 0
      ? verified / (verified + dismissed)
      : 0;

    const lossPrevented = incidents
      .filter((i) => i.disposition === 'loss_prevented' && i.estimatedLoss)
      .reduce((sum, i) => sum + (i.estimatedLoss || 0), 0);

    const onlineCameras = cameras.filter((c) => c.status === 'online').length;
    const cameraUptime = cameras.length > 0 ? onlineCameras / cameras.length : 0;

    const highRiskZones = zones.filter((z) => z.riskLevel === 'high').length;

    // Calculate average response time (mock)
    const avgResponseTime = 8.5;

    // Find top threat type
    const eventCounts: Record<string, number> = {};
    alerts24h.forEach((alert) => {
      eventCounts[alert.event] = (eventCounts[alert.event] || 0) + 1;
    });

    const topThreat = Object.entries(eventCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as any;

    const stats: OverviewStats = {
      totalAlerts24h: alerts24h.length,
      pendingReview: pending,
      detectionAccuracy: accuracy,
      lossPrevention: lossPrevented,
      cameraUptime,
      highRiskZones,
      avgResponseTime,
      topThreat: topThreat || null,
    };

    return HttpResponse.json(stats);
  }),

  // Cameras
  http.get('/api/cameras', async () => {
    await delay(150);
    return HttpResponse.json(cameras);
  }),

  http.get('/api/cameras/:id', async ({ params }) => {
    await delay(100);
    const camera = cameras.find((c) => c.id === params.id);
    if (!camera) {
      return HttpResponse.json({ error: 'Camera not found' }, { status: 404 });
    }
    return HttpResponse.json(camera);
  }),

  // Zones
  http.get('/api/zones', async () => {
    await delay(100);
    return HttpResponse.json(zones);
  }),

  // Alerts
  http.get('/api/alerts', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);

    let filtered = [...alerts];

    // Filter by status
    const status = url.searchParams.get('status');
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    // Filter by event type
    const event = url.searchParams.get('event');
    if (event) {
      filtered = filtered.filter((a) => a.event === event);
    }

    // Filter by zone
    const zoneId = url.searchParams.get('zoneId');
    if (zoneId) {
      filtered = filtered.filter((a) => a.zoneId === zoneId);
    }

    // Filter by camera
    const cameraId = url.searchParams.get('cameraId');
    if (cameraId) {
      filtered = filtered.filter((a) => a.cameraId === cameraId);
    }

    // Filter by date range
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    if (from) {
      filtered = filtered.filter((a) => new Date(a.startedAt) >= new Date(from));
    }
    if (to) {
      filtered = filtered.filter((a) => new Date(a.startedAt) <= new Date(to));
    }

    // Filter by min score
    const minScore = url.searchParams.get('minScore');
    if (minScore) {
      filtered = filtered.filter((a) => a.score >= parseFloat(minScore));
    }

    // Search by ID or track ID
    const q = url.searchParams.get('q');
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.id.toLowerCase().includes(query) ||
          a.trackId?.toLowerCase().includes(query)
      );
    }

    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedAlerts = filtered.slice(start, end);

    return HttpResponse.json({
      alerts: paginatedAlerts,
      total,
      page,
      pageSize,
    });
  }),

  http.get('/api/alerts/:id', async ({ params }) => {
    await delay(100);
    const alert = alerts.find((a) => a.id === params.id);
    if (!alert) {
      return HttpResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    return HttpResponse.json(alert);
  }),

  http.patch('/api/alerts/:id', async ({ request, params }) => {
    await delay(200);
    const body = await request.json() as Partial<Alert>;
    const index = alerts.findIndex((a) => a.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    alerts[index] = { ...alerts[index], ...body };
    return HttpResponse.json(alerts[index]);
  }),

  // Incidents
  http.get('/api/incidents', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);

    let filtered = [...incidents];

    const status = url.searchParams.get('status');
    if (status === 'active') {
      filtered = filtered.filter((i) => !i.resolvedAt);
    } else if (status === 'resolved') {
      filtered = filtered.filter((i) => i.resolvedAt);
    }

    // Pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedIncidents = filtered.slice(start, end);

    return HttpResponse.json({
      incidents: paginatedIncidents,
      total,
      page,
      pageSize,
    });
  }),

  http.get('/api/incidents/:id', async ({ params }) => {
    await delay(100);
    const incident = incidents.find((i) => i.id === params.id);
    if (!incident) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 });
    }
    return HttpResponse.json(incident);
  }),

  http.post('/api/incidents', async ({ request }) => {
    await delay(300);
    const body = await request.json() as Partial<Incident>;
    const newIncident: Incident = {
      id: `inc_${Math.random().toString(36).substring(2, 10)}`,
      alertIds: body.alertIds || [],
      createdAt: new Date().toISOString(),
      disposition: body.disposition || 'under_investigation',
      notes: body.notes,
      videoUrl: body.videoUrl,
      estimatedLoss: body.estimatedLoss,
      assignedTo: body.assignedTo,
    };

    incidents = [newIncident, ...incidents];
    return HttpResponse.json(newIncident);
  }),

  http.patch('/api/incidents/:id', async ({ request, params }) => {
    await delay(200);
    const body = await request.json() as Partial<Incident>;
    const index = incidents.findIndex((i) => i.id === params.id);

    if (index === -1) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    incidents[index] = { ...incidents[index], ...body };
    return HttpResponse.json(incidents[index]);
  }),

  // Analytics
  http.get('/api/analytics/hourly', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);

    let filtered = [...analytics];

    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (from) {
      filtered = filtered.filter((a) => new Date(a.ts) >= new Date(from));
    }
    if (to) {
      filtered = filtered.filter((a) => new Date(a.ts) <= new Date(to));
    }

    return HttpResponse.json(filtered);
  }),

  // Settings
  http.get('/api/settings', async () => {
    await delay(100);
    return HttpResponse.json(settings);
  }),

  http.patch('/api/settings', async ({ request }) => {
    await delay(200);
    const body = await request.json() as Partial<SystemSettings>;
    settings = { ...settings, ...body };
    return HttpResponse.json(settings);
  }),

  // Users
  http.get('/api/users', async () => {
    await delay(100);
    return HttpResponse.json(users);
  }),
];
