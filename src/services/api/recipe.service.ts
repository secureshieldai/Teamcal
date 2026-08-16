import { apiClient } from './client';

export type RecipeStep = { text: string; seconds: number };
export type RecipeIngredient = { text: string };

export type Recipe = {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  category: string;
  dietTags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  timeMin: number;
  kcal: number;
  proteinG: number;
  servings: number;
  rating: number;
};

export const recipeService = {
  async search(params: { q?: string; cuisine?: string; diet?: string; maxTime?: number; limit?: number }) {
    const { data } = await apiClient.get<{ success: boolean; recipes: Recipe[] }>('/recipes/search', { params });
    return data.recipes;
  },
  async trending() {
    const { data } = await apiClient.get<{ success: boolean; recipes: Recipe[] }>('/recipes/trending');
    return data.recipes;
  },
  async get(id: string) {
    const { data } = await apiClient.get<{ success: boolean; recipe: Recipe }>(`/recipes/${id}`);
    return data.recipe;
  },
};
