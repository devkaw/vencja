import { create } from 'zustand';
import type { Toast } from '@/types';

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info' | 'plan';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  notifications: Notification[];
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  notifications: [],
  unreadCount: 0,
  loadNotifications: async () => {
    try {
      const response = await fetch('/api/notifications');
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        console.error('[Store] loadNotifications failed:', response.status, response.statusText);
        return;
      }
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Store] loadNotifications got non-JSON response:', text.substring(0, 200));
        return;
      }
      
      const data = await response.json();
      
      if (data.notifications) {
        const formatted = data.notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link || undefined,
          read: n.read,
          createdAt: n.created_at,
        }));
        const unreadCount = formatted.filter((n: Notification) => !n.read).length;
        set({ notifications: formatted, unreadCount });
      }
    } catch (error) {
      console.error('[Store] Error loading notifications:', error);
    }
  },
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id }),
        });
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    }),
  markAllAsRead: async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  removeNotification: async (id) => {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },
  clearAllNotifications: async () => {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteAll: true }),
    });
    set({ notifications: [], unreadCount: 0 });
  },
}));