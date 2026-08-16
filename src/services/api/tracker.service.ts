import { apiClient } from './client';
import type { TrackerEntry } from '../../types/api';

// Backend tracker names
export type TrackerName = 'calories' | 'weight' | 'water' | 'steps' | 'workouts' | 'sleep' | 'meals' | 'walks' | 'progress-photos' | 'mood';

export interface TrackerTodayResponse {
  success: boolean;
  entries: TrackerEntry[];
  sum: number;
}

export interface TrackerLastNDay {
  day: string;
  total: number;
  count: number;
}

export const trackerService = {
  /** POST /api/tracker/:tracker  — log a single tracker value */
  async log(tracker: TrackerName, value: number, meta?: Record<string, unknown>) {
    const { data } = await apiClient.post<{ success: boolean; entry: TrackerEntry }>(
      `/tracker/${tracker}`,
      { value, ts: Date.now(), meta }
    );
    return data.entry;
  },

  async syncDailySteps(value: number, source: string, date = new Date()) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const day = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const { data } = await apiClient.post<{ success: boolean; entry: TrackerEntry; replaced: boolean }>(
      '/tracker/steps/sync',
      { value: Math.max(0, Math.round(value)), source, day, dayStart: start.getTime(), dayEnd: end.getTime() }
    );
    return data.entry;
  },

  /** GET /api/tracker/:tracker/today  — entries + sum for current day */
  async getToday(tracker: TrackerName) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const { data } = await apiClient.get<TrackerTodayResponse>(`/tracker/${tracker}/today`, {
      params: { start: start.getTime(), end: end.getTime() },
    });
    return data;
  },

  /** GET /api/tracker/:tracker/lastn?days=N  — daily totals for last N days (used for charts) */
  async getLastN(tracker: TrackerName, days = 7) {
    const { data } = await apiClient.get<{ success: boolean; data: TrackerLastNDay[] }>(
      `/tracker/${tracker}/lastn`,
      { params: { days, timezoneOffsetMinutes: new Date().getTimezoneOffset() } }
    );
    return data.data;
  },

  /** GET /api/tracker/:tracker?limit=N  — raw entries */
  async getEntries(tracker: TrackerName, limit = 20) {
    const { data } = await apiClient.get<{ success: boolean; entries: TrackerEntry[] }>(
      `/tracker/${tracker}`,
      { params: { limit } }
    );
    return data.entries;
  },

  /** GET /api/tracker/:tracker/streak?dailyGoal=N */
  async getStreak(tracker: TrackerName, dailyGoal: number) {
    const { data } = await apiClient.get<{ success: boolean; streak: number }>(
      `/tracker/${tracker}/streak`,
      { params: { dailyGoal } }
    );
    return data.streak;
  },

  /** DELETE /api/tracker/:tracker/:id */
  async deleteEntry(tracker: TrackerName, id: string) {
    await apiClient.delete(`/tracker/${tracker}/${id}`);
  },

  /** Convenience: fetch today's totals for home screen summary */
  async getTodaySummary() {
    const [calories, water, steps, workouts] = await Promise.all([
      trackerService.getToday('calories').catch(() => ({ sum: 0 })),
      trackerService.getToday('water').catch(() => ({ sum: 0 })),
      trackerService.getToday('steps').catch(() => ({ sum: 0 })),
      trackerService.getToday('workouts').catch(() => ({ sum: 0 })),
    ]);

    // Also get macro breakdown from today's meal entries
    const mealToday = await trackerService.getToday('meals').catch(() => ({ entries: [], sum: 0 }));
    const protein = (mealToday.entries ?? []).reduce(
      (s: number, e: TrackerEntry) => s + (Number((e.meta as Record<string, unknown>)?.protein) || 0),
      0
    );
    const carbs = (mealToday.entries ?? []).reduce(
      (s: number, e: TrackerEntry) => s + (Number((e.meta as Record<string, unknown>)?.carbs) || 0),
      0
    );
    const fat = (mealToday.entries ?? []).reduce(
      (s: number, e: TrackerEntry) => s + (Number((e.meta as Record<string, unknown>)?.fats) || 0),
      0
    );

    return {
      calories: calories.sum + mealToday.sum,
      water: water.sum,
      steps: steps.sum,
      workouts: workouts.sum,
      protein,
      carbs,
      fat,
    };
  },
};
