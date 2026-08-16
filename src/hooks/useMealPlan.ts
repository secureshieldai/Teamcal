import { useCallback, useEffect, useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { mealplanService, type MealPlan, type MealPlanPreferences, type PlanMeal } from '../services/api/mealplan.service';

export function useMealPlan() {
  const { data: fetched, loading, error, refetch } = useApiQuery(() => mealplanService.getCurrent(), null as MealPlan | null, []);
  const [plan, setPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    setPlan(fetched);
  }, [fetched]);

  const generate = useCallback(async (prefs: MealPlanPreferences) => {
    const created = await mealplanService.generate(prefs);
    setPlan(created);
    return created;
  }, []);

  const updatePreferences = useCallback(
    async (prefs: MealPlanPreferences) => {
      if (!plan) return null;
      const updated = await mealplanService.updatePreferences(plan.id, prefs);
      setPlan(updated);
      return updated;
    },
    [plan]
  );

  const deletePlan = useCallback(async () => {
    if (!plan) return;
    await mealplanService.deletePlan(plan.id);
    setPlan(null);
  }, [plan]);

  const regenerateDay = useCallback(
    async (dayIndex: number) => {
      if (!plan) return null;
      const updated = await mealplanService.regenerateDay(plan.id, dayIndex);
      setPlan(updated);
      return updated;
    },
    [plan]
  );

  const regenerateMeal = useCallback(
    async (dayIndex: number, mealId: string) => {
      if (!plan) return null;
      const updated = await mealplanService.regenerateMeal(plan.id, dayIndex, mealId);
      setPlan(updated);
      return updated;
    },
    [plan]
  );

  const updateMeal = useCallback(
    async (dayIndex: number, mealId: string, patch: Partial<PlanMeal>) => {
      if (!plan) return null;
      const updated = await mealplanService.updateMeal(plan.id, dayIndex, mealId, patch);
      setPlan(updated);
      return updated;
    },
    [plan]
  );

  const toggleMealComplete = useCallback(
    (dayIndex: number, mealId: string) => {
      const meal = plan?.days[dayIndex]?.meals.find((m) => m.id === mealId);
      if (!meal) return null;
      return updateMeal(dayIndex, mealId, { completed: !meal.completed });
    },
    [plan, updateMeal]
  );

  const removeMeal = useCallback(
    async (dayIndex: number, mealId: string) => {
      if (!plan) return null;
      const updated = await mealplanService.removeMeal(plan.id, dayIndex, mealId);
      setPlan(updated);
      return updated;
    },
    [plan]
  );

  const groceryList = useCallback(
    (dayIndex: number) => {
      if (!plan) return Promise.resolve([] as string[]);
      return mealplanService.groceryList(plan.id, dayIndex);
    },
    [plan]
  );

  return {
    plan,
    loading,
    error,
    refetch,
    generate,
    updatePreferences,
    deletePlan,
    regenerateDay,
    regenerateMeal,
    updateMeal,
    toggleMealComplete,
    removeMeal,
    groceryList,
  };
}
