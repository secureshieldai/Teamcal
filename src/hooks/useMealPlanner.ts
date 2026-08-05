import { useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { mealsService, type MealEntry } from '../services/api/meals.service';

export function useMealPlanner() {
  // GET /api/meals/today
  const { data, loading, refetch } = useApiQuery(
    () => mealsService.getToday(),
    null,
    []
  );

  const meals = data
    ? data.entries.map((e: MealEntry) => ({
        id: e.id,
        mealType: (e.meta?.mealType as string) ?? 'Meal',
        title: (e.meta?.name as string) ?? 'Unknown meal',
        kcal: e.value,
        photo: (e.meta?.photo as string | undefined) ?? undefined,
      }))
    : [];

  return { meals, totals: data?.totals ?? null, loading, refetch };
}

export function useLogMeal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // POST /api/meals/log — body: { name, kcal, protein, carbs, fats }
  const logMeal = async (
    name: string,
    kcal: number,
    extras?: { protein?: number; carbs?: number; fats?: number; mealType?: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      return await mealsService.log({ name, kcal, ...extras });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log meal');
    } finally {
      setLoading(false);
    }
  };

  return { logMeal, loading, error };
}
