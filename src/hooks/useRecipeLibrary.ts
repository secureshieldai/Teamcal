import { useCallback, useEffect, useState } from 'react';
import { recipeService, type Recipe } from '../services/api/recipe.service';
import { personalService } from '../services/api/personal.service';

export const CATEGORIES = ['All', 'Keto', 'Vegan', 'Med', 'Protein', 'GF'] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];

const CATEGORY_PARAMS: Record<CategoryFilter, { cuisine?: string; diet?: string }> = {
  All: {},
  Keto: { diet: 'Keto' },
  Vegan: { diet: 'Vegan' },
  Med: { cuisine: 'Mediterranean' },
  Protein: { diet: 'High-Protein' },
  GF: { diet: 'GF' },
};

export function useRecipeLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [trending, setTrending] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await recipeService.search({
        q: query.trim() || undefined,
        ...CATEGORY_PARAMS[category],
        maxTime: maxTime ?? undefined,
      });
      setRecipes(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [query, category, maxTime]);

  useEffect(() => {
    const timer = setTimeout(runSearch, 300);
    return () => clearTimeout(timer);
  }, [runSearch]);

  useEffect(() => {
    recipeService.trending().then(setTrending).catch(() => {});
  }, []);

  const refetchSaved = useCallback(async () => {
    try {
      const records = await personalService.list('saved-recipe');
      setSavedIds(new Set(records.map((r) => r.external_key).filter((k): k is string => !!k)));
    } catch {
      // bookmarks are non-critical — leave savedIds as-is
    }
  }, []);

  useEffect(() => {
    refetchSaved();
  }, [refetchSaved]);

  const toggleSaved = useCallback(async (recipe: Recipe) => {
    try {
      const active = await personalService.toggle('saved-recipe', recipe.id, { title: recipe.title, image: recipe.image });
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (active) next.add(recipe.id);
        else next.delete(recipe.id);
        return next;
      });
    } catch {
      // non-critical
    }
  }, []);

  return {
    query,
    setQuery,
    category,
    setCategory,
    maxTime,
    setMaxTime,
    recipes,
    trending,
    loading,
    error,
    savedIds,
    toggleSaved,
    refetch: runSearch,
  };
}
