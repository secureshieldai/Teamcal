import { useMemo } from 'react';
import { useApiQuery } from './useApiQuery';
import { workoutsService, type WeeklyHistoryEntry } from '../services/api/workouts.service';
import { trackerService } from '../services/api/tracker.service';
import type { Workout } from '../types/api';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useWorkoutsHome() {
  const { data: workouts, loading, refetch } = useApiQuery(() => workoutsService.list(), [] as Workout[], []);
  const { data: streak } = useApiQuery(() => trackerService.getStreak('workouts', 1), 0, []);
  const { data: weekly } = useApiQuery(() => workoutsService.getWeeklyHistory(1), [] as WeeklyHistoryEntry[], []);

  const todayAbbr = DAY_ABBR[new Date().getDay()];
  const todayWorkout = useMemo(() => workouts.find((w) => w.scheduled_days?.includes(todayAbbr)) ?? null, [workouts, todayAbbr]);

  return {
    todayWorkout,
    todayAbbr,
    workouts,
    streak,
    thisWeek: weekly[0] ?? null,
    loading,
    refetch,
  };
}
