import { apiClient } from './client';
import type { Workout, Exercise } from '../../types/api';

export type WorkoutLog = { id: string; workout_id: string | null; title: string; duration: number | null; exercises: Exercise[]; notes: string; started_at: number; ended_at: number };

export type WeeklyHistoryEntry = { weekStart: string; planned: number; done: number; minutes: number; kcal: number; percent: number };

export type RecommendationTag = 'Volume' | 'Recovery' | 'Nutrition' | 'Movement';
export type Recommendation = { title: string; tag: RecommendationTag; tagColor: 'blue' | 'purple' | 'green'; description: string };

export type ScanCoachRoutine = {
  name: string;
  exercises: Exercise[];
  scheduledDays: string[];
  durationMin: number;
};

export type ScanCoachPlan = {
  timelineWeeksMin: number;
  timelineWeeksMax: number;
  weeklySessions: number;
  dailyCalories: number;
  restDaysPerWeek: number;
  routines: ScanCoachRoutine[];
};

async function toFormFile(form: FormData, field: string, uri: string, fallbackName: string) {
  if (uri.startsWith('data:')) {
    const blob = await (await fetch(uri)).blob();
    form.append(field, blob, fallbackName);
  } else {
    form.append(field, { uri, type: 'image/jpeg', name: fallbackName } as never);
  }
}

export const workoutsService = {
  async list(params?: { category?: string; difficulty?: string; limit?: number }) {
    const { data } = await apiClient.get<{ success: boolean; workouts: Workout[] }>('/workouts', { params });
    return data.workouts;
  },

  async getToday() {
    const { data } = await apiClient.get<{ success: boolean; workout: Workout | null }>('/workouts/today');
    return data.workout;
  },

  async get(id: string) {
    const { data } = await apiClient.get<{ success: boolean; workout: Workout }>(`/workouts/${id}`);
    return data.workout;
  },

  async create(payload: {
    title: string;
    subtitle?: string;
    duration?: number;
    difficulty?: string;
    category?: string;
    isPublic?: boolean;
    exercises: Exercise[];
    scheduledDays: string[];
    restDays: string[];
  }) {
    const { data } = await apiClient.post<{ success: boolean; workout: Workout }>('/workouts', payload);
    return data.workout;
  },

  async update(id: string, payload: Partial<{
    title: string;
    subtitle: string;
    duration: number;
    difficulty: string;
    category: string;
    isPublic: boolean;
    exercises: Exercise[];
    scheduledDays: string[];
    restDays: string[];
  }>) {
    const { data } = await apiClient.patch<{ success: boolean; workout: Workout }>(`/workouts/${id}`, payload);
    return data.workout;
  },

  async remove(id: string) {
    await apiClient.delete(`/workouts/${id}`);
  },

  async log(payload: {
    workoutId?: string;
    title: string;
    duration?: number;
    exercises?: Exercise[];
    startedAt?: number;
    endedAt?: number;
  }) {
    const { data } = await apiClient.post<{ success: boolean; log: unknown }>('/workouts/log', payload);
    return data.log;
  },

  async getHistory(limit = 20) {
    const { data } = await apiClient.get<{ success: boolean; logs: WorkoutLog[] }>('/workouts/history', { params: { limit } });
    return data.logs;
  },

  async getWeeklyHistory(weeks = 4) {
    const { data } = await apiClient.get<{ success: boolean; weeks: WeeklyHistoryEntry[] }>('/workouts/history/weekly', { params: { weeks } });
    return data.weeks;
  },

  async getRecommendations() {
    const { data } = await apiClient.get<{ success: boolean; insights: Recommendation[] }>('/workouts/recommendations');
    return data.insights;
  },

  async scanCoachGenerate(bodyAreas: string[], goals: string, photoUri?: string | null) {
    const form = new FormData();
    form.append('bodyAreas', bodyAreas.join(','));
    form.append('goals', goals);
    if (photoUri) await toFormFile(form, 'photo', photoUri, 'scan.jpg');
    const { data } = await apiClient.post<{ success: boolean; photoUrl: string | null; plan: ScanCoachPlan }>(
      '/workouts/scan-coach/generate',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 45_000 }
    );
    return data;
  },

  async uploadProgressPhoto(photoUri: string) {
    const form = new FormData();
    await toFormFile(form, 'photo', photoUri, 'progress.jpg');
    const { data } = await apiClient.post<{ success: boolean; entry: { id: string; ts: number; meta: { photo: string; week: string } } }>(
      '/workouts/progress/photo',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.entry;
  },
};
