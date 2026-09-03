/**
 * Notifications React Query Hooks
 * Example of migrating from useApiQuery to React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../../../services/api/notifications.service';
import { APP_CONFIG } from '../../../app/config/constants';

// Query keys for cache management
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

/**
 * Get notifications and unread count
 * Replaces: useApiQuery(() => notificationsService.getNotifications(), initialData, [])
 */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsService.getPrefs(),
    staleTime: APP_CONFIG.QUERY.STALE_TIME,
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      notificationsService.markRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications list to refetch
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: Record<string, boolean>) => 
      notificationsService.updatePrefs(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
