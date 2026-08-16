import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { personalService, type PersonalRecord } from '../services/api/personal.service';
import { generateRecipeFromPrompt, templateForUrl, collectionTagFor, type DietOption, type CollectionTag } from '../data/recipeTemplates';
import type { Recipe } from '../services/api/recipe.service';

const KIND = 'recipe';

export type MyRecipeItem = {
  title: string;
  details: string;
  date: string;
  source: 'ai' | 'url' | 'manual';
  dietTag?: string;
  collectionTag: CollectionTag;
  timeMin: number;
  kcal: number;
  proteinG: number;
  servings: number;
  ingredients: string[];
  steps: { text: string; seconds: number }[];
};

export type MyRecipeRecord = PersonalRecord<MyRecipeItem>;

export const FILTER_TAGS = ['All', 'Weeknight', 'Meal-prep', 'Post-workout', 'Gut-friendly'] as const;
export type FilterTag = (typeof FILTER_TAGS)[number];

/** Older records saved before this rebuild only have {title, details, date} — fill in sane defaults. */
function withDefaults(data: Partial<MyRecipeItem> & { title: string; details: string; date?: string }): MyRecipeItem {
  return {
    title: data.title,
    details: data.details,
    date: data.date ?? new Date().toISOString(),
    source: data.source ?? 'manual',
    dietTag: data.dietTag,
    collectionTag: data.collectionTag ?? 'Weeknight',
    timeMin: data.timeMin ?? 15,
    kcal: data.kcal ?? 0,
    proteinG: data.proteinG ?? 0,
    servings: data.servings ?? 2,
    ingredients: data.ingredients ?? [],
    steps: data.steps?.length ? data.steps : [{ text: data.details || 'No steps saved yet.', seconds: 60 }],
  };
}

export function useMyRecipes() {
  const [records, setRecords] = useState<MyRecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTag>('All');

  const load = useCallback(() => {
    setLoading(true);
    return personalService
      .list<MyRecipeItem>(KIND)
      .then((recs) => setRecords(recs.map((r) => ({ ...r, data: withDefaults(r.data) }))))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const recipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => filter === 'All' || r.data.collectionTag === filter)
      .filter((r) => !q || r.data.title.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  }, [records, query, filter]);

  const generateFromPrompt = useCallback(
    async (prompt: string, diet: DietOption) => {
      const gen = generateRecipeFromPrompt(prompt, diet);
      const item = withDefaults({
        title: gen.title,
        details: gen.ingredients.join(', '),
        source: 'ai',
        dietTag: diet,
        collectionTag: collectionTagFor(diet, 'ai'),
        timeMin: gen.timeMin,
        kcal: gen.kcal,
        proteinG: gen.proteinG,
        servings: gen.servings,
        ingredients: gen.ingredients,
        steps: gen.steps,
      });
      await personalService.create(KIND, item);
      await load();
    },
    [load]
  );

  const importFromUrl = useCallback(
    async (url: string) => {
      const gen = templateForUrl(url);
      const item = withDefaults({
        title: gen.title,
        details: gen.ingredients.join(', '),
        source: 'url',
        collectionTag: collectionTagFor(undefined, 'url'),
        timeMin: gen.timeMin,
        kcal: gen.kcal,
        proteinG: gen.proteinG,
        servings: gen.servings,
        ingredients: gen.ingredients,
        steps: gen.steps,
      });
      await personalService.create(KIND, item);
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      await personalService.remove(id);
      await load();
    },
    [load]
  );

  const toRecipe = useCallback((record: MyRecipeRecord): Recipe => {
    const { data } = record;
    return {
      id: record.id,
      title: data.title,
      image: '',
      cuisine: '',
      category: '',
      dietTags: data.dietTag ? [data.dietTag] : [],
      ingredients: data.ingredients.map((text) => ({ text })),
      steps: data.steps,
      timeMin: data.timeMin,
      kcal: data.kcal,
      proteinG: data.proteinG,
      servings: data.servings,
      rating: 4.8,
    };
  }, []);

  return { recipes, loading, query, setQuery, filter, setFilter, generateFromPrompt, importFromUrl, remove, toRecipe, isEmpty: !loading && records.length === 0 };
}
