import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Alert, Toast } from './types';

interface AppState {
  // User authentication
  user: User | null;
  setUser: (user: User | null) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Alert detail modal
  selectedAlert: Alert | null;
  setSelectedAlert: (alert: Alert | null) => void;

  // Audio alerts
  audioEnabled: boolean;
  toggleAudio: () => void;

  // Realtime simulation
  realtimeEnabled: boolean;
  toggleRealtime: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Toasts
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: Math.random().toString(36).substring(7) },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Selected alert
      selectedAlert: null,
      setSelectedAlert: (alert) => set({ selectedAlert: alert }),

      // Audio
      audioEnabled: true,
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),

      // Realtime
      realtimeEnabled: true,
      toggleRealtime: () =>
        set((state) => ({ realtimeEnabled: !state.realtimeEnabled })),
    }),
    {
      name: 'safebake-storage',
      partialize: (state) => ({
        user: state.user,
        audioEnabled: state.audioEnabled,
        realtimeEnabled: state.realtimeEnabled,
      }),
    }
  )
);
