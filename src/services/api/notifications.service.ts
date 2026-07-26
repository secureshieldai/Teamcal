import { apiClient } from './client';

export type NotificationPrefs = Record<'milestones' | 'streaks' | 'hydration' | 'insights' | 'contests' | 'social' | 'commerce' | 'updates', boolean>;
export type AppNotification = { id: string; type: string; title: string; message: string; read: boolean; createdAt: number; actorId?: string; entityId?: string };

export const notificationsService = {
  async getNotifications() {
    const { data } = await apiClient.get<{ success: boolean; notifications: AppNotification[]; unreadCount: number }>('/notifications');
    return data;
  },
  async markRead(id: string) { await apiClient.patch(`/notifications/${id}/read`); },
  async markAllRead() { await apiClient.patch('/notifications/read-all'); },
  async getPrefs() {
    const { data } = await apiClient.get<{ success: boolean; notifPrefs: NotificationPrefs }>('/notifications/prefs');
    return data.notifPrefs;
  },
  async updatePrefs(patch: Partial<NotificationPrefs>) {
    const { data } = await apiClient.patch<{ success: boolean; notifPrefs: NotificationPrefs }>('/notifications/prefs', patch);
    return data.notifPrefs;
  },
};
