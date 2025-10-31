import { VideoTracker } from './videoTracker';
import type { FrameStats } from './videoTracker';
import { persistenceService } from './persistence';
import type { PersistentAlert } from './persistence';
import { useStore } from '../store';

interface VideoState {
  lastCheckedTime: number;
  lastAlertTime: number;
  consecutiveViolations: number;
}

const ALERT_COOLDOWN = 10000; // 10 seconds between alerts from same camera
const VIOLATION_THRESHOLD = 1; // Alert if >= 1 person without cap
const CHECK_INTERVAL = 1000; // Check every second

class AlertGenerator {
  private videoStates = new Map<string, VideoState>();
  private isRunning = false;

  startMonitoring(videoId: string, tracker: VideoTracker, cameraId: string): void {
    if (!this.videoStates.has(videoId)) {
      this.videoStates.set(videoId, {
        lastCheckedTime: 0,
        lastAlertTime: 0,
        consecutiveViolations: 0,
      });
    }
    console.log(`🔍 Started monitoring ${videoId}`);
  }

  checkFrame(
    videoId: string,
    currentTime: number,
    stats: FrameStats | null,
    cameraId: string,
    zoneId: string
  ): void {
    if (!stats) return;

    const state = this.videoStates.get(videoId);
    if (!state) return;

    // Only check once per second
    const timeSinceLastCheck = currentTime - state.lastCheckedTime;
    if (timeSinceLastCheck < 1) return;

    state.lastCheckedTime = currentTime;

    // Check for cap non-compliance
    if (stats.capsNotWorn >= VIOLATION_THRESHOLD && stats.employeeCount > 0) {
      state.consecutiveViolations++;

      // Generate alert if cooldown period passed
      const timeSinceLastAlert = Date.now() - state.lastAlertTime;
      if (timeSinceLastAlert > ALERT_COOLDOWN) {
        this.generateAlert(videoId, stats, cameraId, zoneId, currentTime);
        state.lastAlertTime = Date.now();
        state.consecutiveViolations = 0;
      }
    } else {
      state.consecutiveViolations = 0;
    }
  }

  private generateAlert(
    videoId: string,
    stats: FrameStats,
    cameraId: string,
    zoneId: string,
    videoTimestamp: number
  ): void {
    const alertId = persistenceService.getNextAlertId();
    const now = new Date();

    const alert: PersistentAlert = {
      id: alertId,
      cameraId,
      zoneId,
      event: 'cap_non_compliance',
      score: 0.85 + Math.random() * 0.1, // 0.85-0.95 confidence
      startedAt: now.toISOString(),
      status: 'pending',
      videoTimestamp,
      metadata: {
        uncappedWorkers: stats.capsNotWorn,
        employeeCount: stats.employeeCount,
      },
      frameData: {
        employeeCount: stats.employeeCount,
        customerCount: stats.customerCount,
        capsWorn: stats.capsWorn,
        capsNotWorn: stats.capsNotWorn,
      },
    };

    // Save to localStorage
    persistenceService.addAlert(alert);

    // Show toast notification
    const store = useStore.getState();
    store.addToast({
      type: 'warning',
      title: 'Cap Non-Compliance Detected',
      message: `${stats.capsNotWorn} employee(s) without cap detected in ${cameraId}`,
      duration: 5000,
    });

    // Play audio if enabled
    if (store.audioEnabled) {
      this.playAlertSound();
    }

    console.log(`🚨 Alert generated: ${alertId} at ${videoTimestamp.toFixed(2)}s - ${stats.capsNotWorn} without cap`);
  }

  private playAlertSound(): void {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to play alert sound:', error);
    }
  }

  stopMonitoring(videoId: string): void {
    this.videoStates.delete(videoId);
    console.log(`🛑 Stopped monitoring ${videoId}`);
  }

  reset(): void {
    this.videoStates.clear();
    console.log('🔄 Alert generator reset');
  }
}

export const alertGenerator = new AlertGenerator();
