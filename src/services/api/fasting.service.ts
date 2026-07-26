import { apiClient } from './client';
import type { FastLog } from '../../types/api';

export const fastingService = {
  /** GET /api/fasting/active */
  async getActive() {
    const { data } = await apiClient.get<{ success: boolean; fast: FastLog | null }>(
      '/fasting/active'
    );
    return data.fast;
  },

  /** POST /api/fasting/start */
  async start(protocol: string, targetHours: number) {
    const { data } = await apiClient.post<{ success: boolean; fast: FastLog }>('/fasting/start', {
      protocol,
      targetHours,
    });
    return data.fast;
  },

  /** POST /api/fasting/stop */
  async stop() {
    const { data } = await apiClient.post<{ success: boolean; fast: FastLog }>('/fasting/stop');
    return data.fast;
  },

  /**
   * GET /api/fasting/history
   * Backend returns { history, total } — NOT { fasts }
   */
  async getHistory(limit = 10) {
    const { data } = await apiClient.get<{ success: boolean; history: FastLog[]; total: number }>(
      '/fasting/history',
      { params: { limit } }
    );
    return data.history;
  },

  /** GET /api/fasting/analytics */
  async getAnalytics() {
    const { data } = await apiClient.get<{
      success: boolean;
      analytics: {
        longest: number;
        avg: number;
        total: number;
        successRate: number;
        totalHours: number;
        last30: number[];
        protocolCounts: Record<string, number>;
      };
    }>('/fasting/analytics');
    return data.analytics;
  },
};
