import { apiClient } from './client';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlanMeal {
  id: string;
  mealType: MealType;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  recipe: string;
  completed: boolean;
}

export interface PlanDay {
  date: string;
  meals: PlanMeal[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  duration_days: number;
  daily_calories: number;
  meal_types: MealType[];
  dietary_restrictions: string[];
  diet_preference: string;
  allergies: string[];
  health_conditions: string[];
  notes: string;
  days: PlanDay[];
  created_at: string;
  updated_at: string;
}

export interface MealPlanPreferences {
  durationDays: number;
  dailyCalories: number;
  mealTypes: MealType[];
  dietaryRestrictions: string[];
  dietPreference: string;
  allergies: string[];
  healthConditions: string[];
  notes: string;
}

export const mealplanService = {
  async generate(prefs: MealPlanPreferences) {
    const { data } = await apiClient.post<{ success: boolean; plan: MealPlan }>('/mealplan/generate', prefs);
    return data.plan;
  },

  async getCurrent() {
    const { data } = await apiClient.get<{ success: boolean; plan: MealPlan | null }>('/mealplan/current');
    return data.plan;
  },

  async updatePreferences(id: string, prefs: MealPlanPreferences) {
    const { data } = await apiClient.patch<{ success: boolean; plan: MealPlan }>(`/mealplan/${id}`, prefs);
    return data.plan;
  },

  async deletePlan(id: string) {
    await apiClient.delete(`/mealplan/${id}`);
  },

  async regenerateDay(id: string, dayIndex: number) {
    const { data } = await apiClient.post<{ success: boolean; plan: MealPlan }>(`/mealplan/${id}/day/${dayIndex}/regenerate`);
    return data.plan;
  },

  async regenerateMeal(id: string, dayIndex: number, mealId: string) {
    const { data } = await apiClient.post<{ success: boolean; plan: MealPlan }>(
      `/mealplan/${id}/day/${dayIndex}/meal/${mealId}/regenerate`
    );
    return data.plan;
  },

  async updateMeal(id: string, dayIndex: number, mealId: string, patch: Partial<PlanMeal>) {
    const { data } = await apiClient.patch<{ success: boolean; plan: MealPlan }>(
      `/mealplan/${id}/day/${dayIndex}/meal/${mealId}`,
      patch
    );
    return data.plan;
  },

  async removeMeal(id: string, dayIndex: number, mealId: string) {
    const { data } = await apiClient.delete<{ success: boolean; plan: MealPlan }>(
      `/mealplan/${id}/day/${dayIndex}/meal/${mealId}`
    );
    return data.plan;
  },

  async groceryList(id: string, dayIndex: number) {
    const { data } = await apiClient.get<{ success: boolean; items: string[] }>(`/mealplan/${id}/day/${dayIndex}/grocery-list`);
    return data.items;
  },
};
