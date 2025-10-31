import { format, formatDistanceToNow } from 'date-fns';
import type { EventType } from './types';

// Format date to readable string
export function formatDate(date: string | Date, formatStr = 'PPp'): string {
  return format(new Date(date), formatStr);
}

// Format relative time (e.g., "2 hours ago")
export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Format event type to readable label
export function formatEventType(event: EventType): string {
  const labels: Record<EventType, string> = {
    cap_non_compliance: 'Cap Non-Compliance',
    zone_violation: 'Zone Violation',
    after_hours_activity: 'After-Hours Activity',
    multiple_violations: 'Multiple Violations',
    missing_employee: 'Missing Employee',
    theft_suspicious: 'Theft/Suspicious Activity',
    loitering: 'Loitering',
    suspicious_behavior: 'Suspicious Behavior',
    crowd_detection: 'Crowd Detection',
    slip_fall_risk: 'Slip/Fall Risk',
  };
  return labels[event] || event;
}

// Get color for event type
export function getEventColor(event: EventType): string {
  const colors: Record<EventType, string> = {
    cap_non_compliance: 'text-orange-600 bg-orange-50',
    zone_violation: 'text-red-600 bg-red-50',
    after_hours_activity: 'text-purple-600 bg-purple-50',
    multiple_violations: 'text-red-700 bg-red-100',
    missing_employee: 'text-yellow-600 bg-yellow-50',
    theft_suspicious: 'text-red-600 bg-red-50',
    loitering: 'text-blue-600 bg-blue-50',
    suspicious_behavior: 'text-amber-600 bg-amber-50',
    crowd_detection: 'text-indigo-600 bg-indigo-50',
    slip_fall_risk: 'text-orange-700 bg-orange-100',
  };
  return colors[event] || 'text-gray-600 bg-gray-50';
}

// Get color for risk level
export function getRiskColor(risk: 'low' | 'med' | 'high'): string {
  const colors = {
    low: 'text-green-600 bg-green-50',
    med: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
  };
  return colors[risk];
}

// Get color for alert status
export function getStatusColor(status: 'pending' | 'verified' | 'dismissed'): string {
  const colors = {
    pending: 'text-yellow-600 bg-yellow-50',
    verified: 'text-green-600 bg-green-50',
    dismissed: 'text-gray-600 bg-gray-50',
  };
  return colors[status];
}

// Format percentage
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate random ID
export function generateId(prefix: string): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${random}`;
}

// Play beep sound
export function playBeep() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.3
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}
