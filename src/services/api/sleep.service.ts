import { apiClient } from './client';

export type SleepStages = { awake: number; light: number; rem: number; deep: number };

export interface SleepLog {
  id: string;
  user_id: string;
  started_at: number;
  ended_at: number | null;
  duration_hours: number | null;
  score: number | null;
  stages: SleepStages | null;
  active: boolean;
}

export type SleepAlarmPrefs = {
  wakeTime: string;
  smartAlarm: boolean;
  wakeWindowMin: number;
  sound: string;
};

export type SleepAnalytics = {
  daily: { day: string; hours: number }[];
  avg: number;
  best: number;
  nights: number;
  debt: number;
  goalHours: number;
};

export type SleepInsight = { title: string; icon: string; description: string };

export const sleepService = {
  async getActive() {
    const { data } = await apiClient.get<{ success: boolean; sleep: SleepLog | null }>('/sleep/active');
    return data.sleep;
  },
  async start() {
    const { data } = await apiClient.post<{ success: boolean; sleep: SleepLog }>('/sleep/start');
    return data.sleep;
  },
  async stop() {
    const { data } = await apiClient.post<{ success: boolean; sleep: SleepLog }>('/sleep/stop');
    return data.sleep;
  },
  async getHistory(limit = 50) {
    const { data } = await apiClient.get<{ success: boolean; history: SleepLog[] }>('/sleep/history', { params: { limit } });
    return data.history;
  },
  async getAnalytics(days = 14) {
    const { data } = await apiClient.get<{ success: boolean; analytics: SleepAnalytics }>('/sleep/analytics', { params: { days } });
    return data.analytics;
  },
  async getAlarmPrefs() {
    const { data } = await apiClient.get<{ success: boolean; prefs: SleepAlarmPrefs }>('/sleep/alarm');
    return data.prefs;
  },
  async updateAlarmPrefs(patch: Partial<SleepAlarmPrefs>) {
    const { data } = await apiClient.patch<{ success: boolean; prefs: SleepAlarmPrefs }>('/sleep/alarm', patch);
    return data.prefs;
  },
  async getInsights() {
    const { data } = await apiClient.get<{ success: boolean; insights: SleepInsight[] }>('/sleep/insights');
    return data.insights;
  },
};
