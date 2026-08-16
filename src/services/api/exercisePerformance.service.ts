import { apiClient } from './client';

export type PreviousSet = { weight: number; reps: number; ts: number };
export type PreviousMap = Record<string, Record<number, PreviousSet>>;

export type PersonalRecord = { exerciseName: string; weight: number; reps: number; ts: number };

export const exercisePerformanceService = {
  async getPrevious(exerciseNames: string[]) {
    if (!exerciseNames.length) return {} as PreviousMap;
    const { data } = await apiClient.get<{ success: boolean; previous: PreviousMap }>('/exercise-performance/previous', {
      params: { exercises: exerciseNames.join(',') },
    });
    return data.previous;
  },

  async logSet(exerciseName: string, setIndex: number, weight: number, reps: number) {
    const { data } = await apiClient.post<{ success: boolean; entry: unknown }>('/exercise-performance', {
      exerciseName,
      setIndex,
      weight,
      reps,
    });
    return data.entry;
  },

  async getRecords() {
    const { data } = await apiClient.get<{ success: boolean; records: PersonalRecord[] }>('/exercise-performance/records');
    return data.records;
  },
};
