export interface Detection {
  tracker_id: number;
  class_name: 'Employee' | 'Customer' | 'Wearing Cap';
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface TrackingData {
  [timestamp: string]: Detection[];
}

export interface FrameStats {
  timestamp: number;
  employeeCount: number;
  customerCount: number;
  capsWorn: number;
  capsNotWorn: number;
  detections: Detection[];
}

export class VideoTracker {
  private trackingData: TrackingData | null = null;
  private timestamps: number[] = [];

  constructor(private videoId: string, private dataUrl: string | null) {}

  async load(): Promise<void> {
    if (!this.dataUrl) {
      console.log(`📹 ${this.videoId}: No tracking data available`);
      return;
    }

    try {
      const response = await fetch(this.dataUrl);
      this.trackingData = await response.json();

      // Parse and sort all timestamps
      this.timestamps = Object.keys(this.trackingData)
        .map(ts => parseFloat(ts))
        .sort((a, b) => a - b);

      console.log(`✅ ${this.videoId}: Loaded ${this.timestamps.length} frames of tracking data`);
    } catch (error) {
      console.error(`❌ ${this.videoId}: Failed to load tracking data:`, error);
      this.trackingData = null;
    }
  }

  getStatsAtTime(currentTime: number): FrameStats | null {
    if (!this.trackingData) {
      return null;
    }

    // Find the closest timestamp
    const closestTimestamp = this.findClosestTimestamp(currentTime);
    if (closestTimestamp === null) {
      return null;
    }

    const key = closestTimestamp.toFixed(2);
    const detections = this.trackingData[key] || [];

    // Count different classes
    let employeeCount = 0;
    let customerCount = 0;
    let capsWorn = 0;

    const employeeIds = new Set<number>();
    const capIds = new Set<number>();

    for (const detection of detections) {
      if (detection.class_name === 'Employee') {
        employeeIds.add(detection.tracker_id);
        employeeCount++;
      } else if (detection.class_name === 'Customer') {
        customerCount++;
      } else if (detection.class_name === 'Wearing Cap') {
        capIds.add(detection.tracker_id);
        capsWorn++;
      }
    }

    // Cap not worn = employees without cap detection
    const capsNotWorn = Math.max(0, employeeCount - capsWorn);

    return {
      timestamp: closestTimestamp,
      employeeCount,
      customerCount,
      capsWorn,
      capsNotWorn,
      detections,
    };
  }

  private findClosestTimestamp(time: number): number | null {
    if (this.timestamps.length === 0) {
      return null;
    }

    // Binary search for closest timestamp
    let left = 0;
    let right = this.timestamps.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.timestamps[mid] < time) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Check both left and left-1 to find closest
    if (left > 0) {
      const diff1 = Math.abs(this.timestamps[left] - time);
      const diff2 = Math.abs(this.timestamps[left - 1] - time);
      return diff2 < diff1 ? this.timestamps[left - 1] : this.timestamps[left];
    }

    return this.timestamps[left];
  }

  getAllTimestamps(): number[] {
    return [...this.timestamps];
  }

  isLoaded(): boolean {
    return this.trackingData !== null;
  }
}
