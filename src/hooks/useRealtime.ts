import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store';
import { playBeep } from '../utils';
import type { Alert } from '../types';

export function useRealtime() {
  const queryClient = useQueryClient();
  const { realtimeEnabled, audioEnabled, addToast } = useStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!realtimeEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Simulate new alerts every 10-20 seconds
    const scheduleNext = () => {
      const delay = Math.random() * 10000 + 10000; // 10-20 seconds

      intervalRef.current = setTimeout(async () => {
        try {
          // Fetch a random alert from the first 50 alerts
          const response = await fetch('/mock/alerts.json');
          const allAlerts: Alert[] = await response.json();
          const randomAlert = allAlerts[Math.floor(Math.random() * Math.min(50, allAlerts.length))];

          if (randomAlert) {
            // Create a new alert based on the template
            const newAlert: Alert = {
              ...randomAlert,
              id: `alert_${Math.random().toString(36).substring(2, 10)}`,
              startedAt: new Date().toISOString(),
              status: 'pending',
              assignedTo: undefined,
            };

            // Show toast notification
            addToast({
              type: 'warning',
              title: 'New Alert',
              message: `${newAlert.event.replace('_', ' ')} detected in ${randomAlert.zoneId}`,
              duration: 5000,
            });

            // Play beep if audio is enabled
            if (audioEnabled) {
              playBeep();
            }

            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
          }
        } catch (error) {
          console.error('Failed to generate realtime alert:', error);
        }

        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [realtimeEnabled, audioEnabled, queryClient, addToast]);
}
