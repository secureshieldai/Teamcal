import { apiClient } from './client';
import type { Workout, Exercise } from '../../types/api';

export type WorkoutLog = { id: string; workout_id: string | null; title: string; duration: number | null; exercises: Exercise[]; notes: string; started_at: number; ended_at: number };

export const workoutsService = {
  async list(params?: { category?: string; difficulty?: string; limit?: number }) {
    const { data } = await apiClient.get<{ success: boolean; workouts: Workout[] }>(
      '/workouts',
      { params }
    );
    return data.workouts;
  },

  async getToday() {
    const { data } = await apiClient.get<{ success: boolean; workout: Workout | null }>(
      '/workouts/today'
    );
    return data.workout;
  },

  async get(id: string) {
    const { data } = await apiClient.get<{ success: boolean; workout: Workout }>(`/workouts/${id}`);
    return data.workout;
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
    const { data } = await apiClient.get<{ success: boolean; logs: WorkoutLog[] }>(
      '/workouts/history',
      { params: { limit } }
    );
    return data.logs;
  },
};
