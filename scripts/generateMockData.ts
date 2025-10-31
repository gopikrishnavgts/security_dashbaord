import { faker } from '@faker-js/faker';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuration for mock data generation
const CONFIG = {
  cameras: 6,
  zones: 5,
  alerts: 4500, // 2 months of data
  incidents: 200,
  users: 5,
  analyticsDays: 60, // 2 months
};

// Zone names for bakery/cafe
const ZONE_NAMES = [
  'Cashier Zone',
  'Employee Zone',
  'Customer Seating',
  'Main Entrance',
  'Display Counter',
];

// Event types for bakery/cafe
const EVENT_TYPES = [
  'cap_non_compliance',
  'zone_violation',
  'after_hours_activity',
  'multiple_violations',
  'missing_employee',
  'theft_suspicious',
  'loitering',
  'suspicious_behavior',
  'crowd_detection',
  'slip_fall_risk',
];

// Helper to generate unique IDs
const id = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

// Generate zones
function generateZones() {
  const riskLevels: Array<'low' | 'med' | 'high'> = [
    'high', // Cashier
    'med', // Employee
    'low', // Customer Seating
    'med', // Main Entrance
    'med', // Display Counter
  ];

  return ZONE_NAMES.map((name, i) => ({
    id: id('zone'),
    name,
    riskLevel: riskLevels[i],
  }));
}

// Generate cameras
function generateCameras(zones: ReturnType<typeof generateZones>) {
  const cameras = [];
  const videoMappings = [
    {
      channel: 1,
      file: '/videos/ram_nagar_3/RamNagar_3_1.mp4',
    },
    {
      channel: 2,
      file: '/videos/saibaba_nagar_1a/saibaba_nagar_1a_1.mp4',
    },
    {
      channel: 3,
      file: '/videos/sivanandha_nagar_1a/sivanandha_nagar_1a_1.mp4',
    },
    {
      channel: 4,
      file: '/videos/sivanandha_nagar_1b/sivanandha_nagar_1b_1.mp4',
    },
    {
      channel: 5,
      file: '/videos/ram_nagar_3/RamNagar_3_2.mp4',
    },
    {
      channel: 6,
      file: '/videos/saibaba_nagar_1a/saibaba_nagar_1a_2.mp4',
    },
  ];

  for (let i = 0; i < CONFIG.cameras; i++) {
    const zoneId = faker.helpers.arrayElement(zones).id;
    const videoMapping = videoMappings[i];
    const status = faker.helpers.weightedArrayElement([
      { value: 'online', weight: 85 },
      { value: 'offline', weight: 5 },
      { value: 'maintenance', weight: 10 },
    ]);

    cameras.push({
      id: id('cam'),
      name: `Camera ${String(i + 1).padStart(2, '0')}`,
      zoneId,
      status,
      rtspUrl: `rtsp://camera${i + 1}.local/stream`,
      lastSeen: faker.date.recent({ days: 1 }).toISOString(),
      nvrChannel: videoMapping.channel,
      videoFile: videoMapping.file,
    });
  }

  return cameras;
}

// Generate users
function generateUsers() {
  return [
    {
      id: id('usr'),
      name: 'Admin User',
      email: 'admin@safebake.com',
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    {
      id: id('usr'),
      name: 'Security Manager',
      email: 'security@safebake.com',
      role: 'security',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=security1',
    },
    {
      id: id('usr'),
      name: 'Floor Supervisor',
      email: 'supervisor@safebake.com',
      role: 'security',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=security2',
    },
    {
      id: id('usr'),
      name: 'Shift Manager',
      email: 'shift@safebake.com',
      role: 'security',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=security3',
    },
    {
      id: id('usr'),
      name: 'Store Owner',
      email: 'owner@safebake.com',
      role: 'viewer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
    },
  ];
}

// Generate alerts
function generateAlerts(
  cameras: ReturnType<typeof generateCameras>,
  zones: ReturnType<typeof generateZones>,
  users: ReturnType<typeof generateUsers>
) {
  const alerts = [];
  const now = new Date();
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  for (let i = 0; i < CONFIG.alerts; i++) {
    // Distribute alerts over 60 days
    const startDate = faker.date.between({ from: sixtyDaysAgo, to: now });
    const duration = faker.number.int({ min: 5, max: 180 });
    const endDate = new Date(startDate.getTime() + duration * 1000);
    const daysAgo = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const camera = faker.helpers.arrayElement(cameras);
    const zone = zones.find((z) => z.id === camera.zoneId)!;
    const event = faker.helpers.arrayElement(EVENT_TYPES);
    const score = faker.number.float({ min: 0.55, max: 0.99, fractionDigits: 2 });

    // Recent alerts (< 3 days) are mostly pending
    let status: 'pending' | 'verified' | 'dismissed';
    if (daysAgo < 3) {
      status = faker.helpers.weightedArrayElement([
        { value: 'pending', weight: 60 },
        { value: 'verified', weight: 25 },
        { value: 'dismissed', weight: 15 },
      ]);
    } else {
      // Older alerts are mostly resolved
      status = faker.helpers.weightedArrayElement([
        { value: 'pending', weight: 10 },
        { value: 'verified', weight: 50 },
        { value: 'dismissed', weight: 40 },
      ]);
    }

    const assignedTo =
      status !== 'pending'
        ? faker.helpers.arrayElement(users.filter((u) => u.role !== 'viewer')).id
        : undefined;

    // Event-specific metadata
    let metadata: any = {
      personCount: faker.number.int({ min: 1, max: 5 }),
      nvrChannel: camera.nvrChannel,
      duration,
    };

    if (event === 'cap_non_compliance') {
      metadata.employeeCount = faker.number.int({ min: 1, max: 4 });
      metadata.uncappedWorkers = faker.number.int({ min: 1, max: metadata.employeeCount });
      metadata.objectsDetected = ['person', 'employee'];
    } else if (event === 'theft_suspicious') {
      metadata.objectsDetected = faker.helpers.arrayElements(
        ['bag', 'hand', 'cash', 'item'],
        faker.number.int({ min: 1, max: 3 })
      );
    } else if (event === 'zone_violation') {
      metadata.objectsDetected = ['person', 'unauthorized'];
    } else if (event === 'crowd_detection') {
      metadata.personCount = faker.number.int({ min: 6, max: 15 });
      metadata.customersCount = metadata.personCount;
    } else if (event === 'missing_employee') {
      metadata.employeeCount = faker.number.int({ min: 0, max: 3 });
      metadata.expectedCount = faker.number.int({
        min: metadata.employeeCount + 1,
        max: 6,
      });
    } else {
      metadata.objectsDetected = faker.helpers.arrayElements(
        ['person', 'bag', 'hand'],
        faker.number.int({ min: 1, max: 2 })
      );
    }

    alerts.push({
      id: id('alert'),
      cameraId: camera.id,
      zoneId: zone.id,
      event,
      score,
      startedAt: startDate.toISOString(),
      endedAt: endDate.toISOString(),
      thumbnailUrl: `/mock/thumbnails/thumb_${faker.number.int({ min: 1, max: 20 })}.jpg`,
      videoUrl: camera.videoFile,
      status,
      assignedTo,
      trackId: id('trk'),
      metadata,
    });
  }

  // Sort by date descending (newest first)
  return alerts.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

// Generate incidents
function generateIncidents(
  alerts: ReturnType<typeof generateAlerts>,
  users: ReturnType<typeof generateUsers>
) {
  const incidents = [];
  const verifiedAlerts = alerts.filter((a) => a.status === 'verified');

  for (let i = 0; i < CONFIG.incidents && verifiedAlerts.length > 0; i++) {
    // Pick 1-5 verified alerts for this incident
    const alertCount = faker.number.int({ min: 1, max: 5 });
    const incidentAlerts = faker.helpers.arrayElements(verifiedAlerts, alertCount);

    // Remove used alerts
    incidentAlerts.forEach((alert) => {
      const index = verifiedAlerts.indexOf(alert);
      if (index > -1) verifiedAlerts.splice(index, 1);
    });

    const createdAt = incidentAlerts[0].startedAt;
    const isResolved = faker.datatype.boolean({ probability: 0.7 });
    const disposition = faker.helpers.arrayElement([
      'loss_prevented',
      'no_event',
      'theft_occurred',
      'safety_violation',
      'under_investigation',
    ]);

    incidents.push({
      id: id('inc'),
      alertIds: incidentAlerts.map((a) => a.id),
      createdAt,
      resolvedAt: isResolved
        ? faker.date
            .between({
              from: new Date(createdAt),
              to: new Date(),
            })
            .toISOString()
        : undefined,
      disposition,
      notes: faker.helpers.maybe(
        () => faker.lorem.sentence({ min: 5, max: 15 }),
        { probability: 0.6 }
      ),
      videoUrl: incidentAlerts[0].videoUrl,
      estimatedLoss:
        disposition === 'theft_occurred'
          ? faker.number.int({ min: 20, max: 500 })
          : disposition === 'loss_prevented'
          ? faker.number.int({ min: 50, max: 800 })
          : undefined,
      assignedTo: faker.helpers.arrayElement(
        users.filter((u) => u.role !== 'viewer')
      ).id,
    });
  }

  return incidents.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Generate analytics
function generateAnalytics(alerts: ReturnType<typeof generateAlerts>) {
  const buckets: any[] = [];
  const now = new Date();

  // Generate hourly buckets for the past 60 days
  for (let day = 0; day < CONFIG.analyticsDays; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const bucketDate = new Date(now);
      bucketDate.setDate(bucketDate.getDate() - day);
      bucketDate.setHours(hour, 0, 0, 0);

      // Get alerts in this hour
      const hourAlerts = alerts.filter((alert) => {
        const alertDate = new Date(alert.startedAt);
        return (
          alertDate.getFullYear() === bucketDate.getFullYear() &&
          alertDate.getMonth() === bucketDate.getMonth() &&
          alertDate.getDate() === bucketDate.getDate() &&
          alertDate.getHours() === bucketDate.getHours()
        );
      });

      const byEvent: Record<string, number> = {};
      EVENT_TYPES.forEach((event) => {
        byEvent[event] = hourAlerts.filter((a) => a.event === event).length;
      });

      buckets.push({
        ts: bucketDate.toISOString(),
        alerts: hourAlerts.length,
        verified: hourAlerts.filter((a) => a.status === 'verified').length,
        falsePositives: hourAlerts.filter((a) => a.status === 'dismissed').length,
        dismissed: hourAlerts.filter((a) => a.status === 'dismissed').length,
        byEvent,
      });
    }
  }

  return buckets.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

// Generate settings
function generateSettings() {
  return {
    alertThreshold: 0.65,
    cooldownWindow: 45,
    autoArchiveDays: 90,
    notificationChannels: ['email', 'sms', 'push'],
    enableRealtime: true,
    enableAudioAlerts: true,
  };
}

// Main generation function
function generateAll() {
  console.log('🏭 Generating mock data for SafeBake Security Dashboard...\n');

  const zones = generateZones();
  console.log(`✓ Generated ${zones.length} zones`);

  const cameras = generateCameras(zones);
  console.log(`✓ Generated ${cameras.length} cameras`);

  const users = generateUsers();
  console.log(`✓ Generated ${users.length} users`);

  const alerts = generateAlerts(cameras, zones, users);
  console.log(`✓ Generated ${alerts.length} alerts`);

  const incidents = generateIncidents(alerts, users);
  console.log(`✓ Generated ${incidents.length} incidents`);

  const analytics = generateAnalytics(alerts);
  console.log(`✓ Generated ${analytics.length} analytics buckets`);

  const settings = generateSettings();
  console.log(`✓ Generated system settings\n`);

  // Create output directory
  const outputDir = join(process.cwd(), 'public', 'mock');
  mkdirSync(outputDir, { recursive: true });

  // Write files
  writeFileSync(
    join(outputDir, 'zones.json'),
    JSON.stringify(zones, null, 2)
  );
  writeFileSync(
    join(outputDir, 'cameras.json'),
    JSON.stringify(cameras, null, 2)
  );
  writeFileSync(
    join(outputDir, 'users.json'),
    JSON.stringify(users, null, 2)
  );
  writeFileSync(
    join(outputDir, 'alerts.json'),
    JSON.stringify(alerts, null, 2)
  );
  writeFileSync(
    join(outputDir, 'incidents.json'),
    JSON.stringify(incidents, null, 2)
  );
  writeFileSync(
    join(outputDir, 'analytics.json'),
    JSON.stringify(analytics, null, 2)
  );
  writeFileSync(
    join(outputDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );

  console.log(`📁 Mock data saved to ${outputDir}\n`);
  console.log('✅ Done!\n');
}

// Run
generateAll();
