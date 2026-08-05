import { useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { workoutsService } from '../services/api/workouts.service';
import type { Workout } from '../types/api';

type DisplayWorkout = { title:string; subtitle:string; exercises:{id:string;name:string;detail:string}[] };

export function useTodayWorkout() {
  const { data: workout, loading, refetch } = useApiQuery(
    () => workoutsService.getToday(),
    null,
    []
  );

  const displayWorkout = workout
    ? {
        title: workout.title,
        subtitle: workout.subtitle || `Today • ${workout.duration} min • ${workout.difficulty}`,
        exercises: workout.exercises.map((e) => ({ id: e.id, name: e.name, detail: e.detail })),
      }
    : null;

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

  const logWorkout = async (workout: DisplayWorkout) => {
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
