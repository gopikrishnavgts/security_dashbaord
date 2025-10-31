import type { Zone, Camera } from '../types';

export const MOCK_ZONES: Zone[] = [
  {
    id: 'zone-production',
    name: 'Production Area',
    riskLevel: 'high',
    cameraCount: 2,
  },
  {
    id: 'zone-cashier',
    name: 'Cashier Zone',
    riskLevel: 'med',
    cameraCount: 2,
  },
  {
    id: 'zone-customer',
    name: 'Customer Zone',
    riskLevel: 'low',
    cameraCount: 1,
  },
];

export const MOCK_CAMERAS: Camera[] = [
  {
    id: 'cam-1a',
    name: 'Camera 1A',
    zoneId: 'zone-production',
    status: 'online',
    videoFile: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam4_h264.mp4',
  },
  {
    id: 'cam-3a',
    name: 'Camera 3A',
    zoneId: 'zone-production',
    status: 'online',
    videoFile: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam5_h264.mp4',
  },
  {
    id: 'cam-2b',
    name: 'Camera 2B',
    zoneId: 'zone-cashier',
    status: 'online',
    videoFile: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam2_h264.mp4',
  },
  {
    id: 'cam-5a',
    name: 'Camera 5A',
    zoneId: 'zone-cashier',
    status: 'online',
    videoFile: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam3_h264.mp4',
  },
  {
    id: 'cam-4',
    name: 'Camera 4',
    zoneId: 'zone-customer',
    status: 'online',
    videoFile: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam1_h264.mp4',
  },
];
