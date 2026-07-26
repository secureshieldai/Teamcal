import { useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { workoutsService } from '../services/api/workouts.service';
import { todayWorkout as mockWorkout } from '../data/workoutsData';
import type { Workout } from '../types/api';

export function useTodayWorkout() {
  const { data: workout, loading, refetch } = useApiQuery(
    () => workoutsService.getToday(),
    null,
    []
  );

  // Map to the shape WorkoutsScreen expects, fallback to mock
  const displayWorkout = workout
    ? {
        title: workout.title,
        subtitle: workout.subtitle || `Today • ${workout.duration} min • ${workout.difficulty}`,
        exercises: workout.exercises.map((e) => ({ id: e.id, name: e.name, detail: e.detail })),
      }
    : mockWorkout;

  return { workout: displayWorkout, loading, refetch };
}

export function useWorkouts() {
  const { data: workouts, loading, refetch } = useApiQuery(
    () => workoutsService.list(),
    [] as Workout[],
    []
  );
  return { workouts, loading, refetch };
}

export function useLogWorkout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logWorkout = async (workout: typeof mockWorkout) => {
    setLoading(true);
    setError(null);
    try {
      await workoutsService.log({
        title: workout.title,
        startedAt: Date.now(),
        endedAt: Date.now(),
        exercises: workout.exercises.map((e) => ({ id: e.id, name: e.name, detail: e.detail })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  return { logWorkout, loading, error };
}
