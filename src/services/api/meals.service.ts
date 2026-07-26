import { apiClient } from './client';
import type { TrackerEntry } from '../../types/api';

/** Shape of a meal entry as stored in tracker_entries */
export interface MealEntry {
  id: string;
  tracker: string;
  ts: number;
  value: number; // kcal
  meta: {
    name?: string;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType?: string;
    photo?: string;
  };
}

export interface TodayMealTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
}
export type ScanResult = { id: string; ts: number; barcode?: string; image?: string | null; items: { name: string; grams: number; kcal: number; p: number; c: number; f: number; confidence: number }[]; totals: { kcal: number; p: number; c: number; f: number } };

export const mealsService = {
  async scanImage(asset: { uri: string; mimeType?: string | null; fileName?: string | null }) {
    const form = new FormData();
    if (asset.uri.startsWith('data:')) {
      const blob = await (await fetch(asset.uri)).blob();
      form.append('image', blob, asset.fileName || 'meal.jpg');
    } else {
      form.append('image', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || 'meal.jpg' } as never);
    }
    const { data } = await apiClient.post<{ success: boolean; result: ScanResult }>('/coach/scan-meal', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 45_000 });
    return data.result;
  },
  async lookupBarcode(code: string) {
    const { data } = await apiClient.post<{ success: boolean; result: ScanResult }>('/coach/barcode', { code }, { timeout: 20_000 });
    return data.result;
  },
  /**
   * GET /api/meals/today
   * Returns today's meal tracker_entries + totals
   */
  async getToday() {
    const { data } = await apiClient.get<{
      success: boolean;
      entries: MealEntry[];
      totals: TodayMealTotals;
    }>('/meals/today');
    return data;
  },

  async getDay(date: string) {
    const { data } = await apiClient.get<{ success: boolean; entries: MealEntry[] }>('/meals/day', { params: { date } });
    return data.entries;
  },
  async update(id: string, patch: Record<string, unknown>) {
    const { data } = await apiClient.patch<{ success: boolean; entry: MealEntry }>(`/meals/${id}`, patch);
    return data.entry;
  },
  async remove(id: string) { await apiClient.delete(`/meals/${id}`); },

  /**
   * POST /api/meals/log
   * Backend expects: { name, kcal, protein, carbs, fats, ts? }
   */
  async log(payload: {
    name: string;
    kcal: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType?: string;
    photo?: string;
    ts?: number;
  }) {
    const { data } = await apiClient.post<{ success: boolean; entry: TrackerEntry }>(
      '/meals/log',
      payload
    );
    return data.entry;
  },

  /**
   * POST /api/meals/scan-log
   * Log a food scan result
   */
  async logScanResult(items: unknown[], totals: TodayMealTotals) {
    const { data } = await apiClient.post<{ success: boolean; entry: TrackerEntry }>(
      '/meals/scan-log',
      { items, totals }
    );
    return data.entry;
  },
};
