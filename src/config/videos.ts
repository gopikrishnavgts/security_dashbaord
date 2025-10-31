export interface VideoConfig {
  id: string;
  cameraId: string;
  zoneId: string;
  videoPath: string;
  dataPath: string | null; // null if no tracking data
  cameraName: string;
  location: string;
}

export const VIDEO_CONFIGS: VideoConfig[] = [
  {
    id: 'cam_1',
    cameraId: 'cam-4',
    zoneId: 'zone-customer',
    videoPath: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam1_h264.mp4',
    dataPath: '/videos/cam1.json',
    cameraName: 'Camera 1',
    location: 'Customer Zone',
  },
  {
    id: 'cam_2',
    cameraId: 'cam-2b',
    zoneId: 'zone-cashier',
    videoPath: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam2_h264.mp4',
    dataPath: '/videos/cam2.json',
    cameraName: 'Camera 2',
    location: 'Cashier Zone',
  },
  {
    id: 'cam_3',
    cameraId: 'cam-5a',
    zoneId: 'zone-cashier',
    videoPath: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam3_h264.mp4',
    dataPath: '/videos/cam3.json',
    cameraName: 'Camera 3',
    location: 'Cashier Zone',
  },
  {
    id: 'cam_4',
    cameraId: 'cam-1a',
    zoneId: 'zone-production',
    videoPath: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam4_h264.mp4',
    dataPath: '/videos/cam4.json',
    cameraName: 'Camera 4',
    location: 'Production Area',
  },
  {
    id: 'cam_5',
    cameraId: 'cam-3a',
    zoneId: 'zone-production',
    videoPath: 'https://invoice-securityalert-demo.s3.ap-south-1.amazonaws.com/videos/cam5_h264.mp4',
    dataPath: '/videos/cam5.json',
    cameraName: 'Camera 5',
    location: 'Production Area',
  },
];
