import type { Alert } from '../types';

const STORAGE_KEYS = {
  ALERTS: 'safebake_alerts',
  ALERT_COUNT: 'safebake_alert_count',
  INITIALIZED: 'safebake_initialized',
  LAST_ALERT_ID: 'safebake_last_alert_id',
};

export interface PersistentAlert extends Alert {
  videoTimestamp: number;
  cameraId: string;
  frameData?: {
    employeeCount: number;
    customerCount: number;
    capsWorn: number;
    capsNotWorn: number;
  };
}

class PersistenceService {
  // Initialize with pre-existing alerts (first time only)
  initializeIfNeeded(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!initialized) {
      console.log('🔧 First time initialization - creating pre-existing alerts');

      // Create 50 pre-existing dismissed alerts from past 2 months
      const preExistingAlerts = this.generatePreExistingAlerts(50);
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(preExistingAlerts));
      localStorage.setItem(STORAGE_KEYS.ALERT_COUNT, '50');
      localStorage.setItem(STORAGE_KEYS.LAST_ALERT_ID, '50');
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

      console.log('✅ Initialized with 50 pre-existing dismissed alerts');
    } else {
      console.log('✅ Already initialized, loading existing data');
    }
  }

  private generatePreExistingAlerts(count: number): PersistentAlert[] {
    const alerts: PersistentAlert[] = [];
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days

    const cameras = ['cam-1a', 'cam-2b', 'cam-3a', 'cam-4', 'cam-5a'];
    const zones = ['zone-production', 'zone-cashier', 'zone-customer'];

    for (let i = 0; i < count; i++) {
      // Random date in past 60 days
      const randomTime = twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime());
      const alertDate = new Date(randomTime);

      const cameraId = cameras[Math.floor(Math.random() * cameras.length)];
      const zoneId = zones[Math.floor(Math.random() * zones.length)];

      alerts.push({
        id: `alert_pre_${i + 1}`,
        cameraId,
        zoneId,
        event: 'cap_non_compliance',
        score: 0.7 + Math.random() * 0.25,
        startedAt: alertDate.toISOString(),
        endedAt: new Date(alertDate.getTime() + 30000).toISOString(),
        status: Math.random() > 0.5 ? 'verified' : 'dismissed', // 50% verified, 50% dismissed - ALL completed
        videoTimestamp: Math.random() * 300, // Random timestamp in first 5 minutes
        metadata: {
          uncappedWorkers: Math.floor(Math.random() * 3) + 1,
          employeeCount: Math.floor(Math.random() * 8) + 2,
        },
        frameData: {
          employeeCount: Math.floor(Math.random() * 8) + 2,
          customerCount: Math.floor(Math.random() * 10),
          capsWorn: Math.floor(Math.random() * 5),
          capsNotWorn: Math.floor(Math.random() * 3) + 1,
        },
      });
    }

    // Sort by date (newest first)
    return alerts.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  // Get all alerts
  getAllAlerts(): PersistentAlert[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ALERTS);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // Add new alert
  addAlert(alert: PersistentAlert): void {
    const alerts = this.getAllAlerts();
    alerts.unshift(alert); // Add to beginning (newest first)

    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));

    // Update count
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.ALERT_COUNT) || '0');
    localStorage.setItem(STORAGE_KEYS.ALERT_COUNT, (count + 1).toString());

    console.log(`✅ Alert saved: ${alert.id} - Total alerts: ${count + 1}`);
  }

  // Update alert status
  updateAlertStatus(alertId: string, status: 'pending' | 'verified' | 'dismissed'): void {
    const alerts = this.getAllAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.status = status;
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      console.log(`✅ Alert ${alertId} updated to ${status}`);
    }
  }

  // Get next alert ID
  getNextAlertId(): string {
    const lastId = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ALERT_ID) || '50');
    const nextId = lastId + 1;
    localStorage.setItem(STORAGE_KEYS.LAST_ALERT_ID, nextId.toString());
    return `alert_${nextId}`;
  }

  // Get alert count
  getAlertCount(): number {
    return parseInt(localStorage.getItem(STORAGE_KEYS.ALERT_COUNT) || '0');
  }

  // Get pending alerts count
  getPendingCount(): number {
    return this.getAllAlerts().filter(a => a.status === 'pending').length;
  }

  // Get alert by ID
  getAlertById(alertId: string): PersistentAlert | null {
    return this.getAllAlerts().find(a => a.id === alertId) || null;
  }

  // Clear all data (for debug)
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.ALERT_COUNT);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.LAST_ALERT_ID);
    console.log('🗑️ All data cleared');
  }

  // Get stats for dashboard
  getStats() {
    const alerts = this.getAllAlerts();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const alerts24h = alerts.filter(a => new Date(a.startedAt) > oneDayAgo).length;
    const pending = alerts.filter(a => a.status === 'pending').length;
    const verified = alerts.filter(a => a.status === 'verified').length;
    const dismissed = alerts.filter(a => a.status === 'dismissed').length;
    const total = alerts.length;

    const accuracy = total > 0 ? verified / (verified + dismissed) : 0.95;

    return {
      totalAlerts24h: alerts24h,
      pendingReview: pending,
      detectionAccuracy: accuracy,
      totalAlerts: total,
      verifiedAlerts: verified,
      dismissedAlerts: dismissed,
    };
  }
}

export const persistenceService = new PersistenceService();
