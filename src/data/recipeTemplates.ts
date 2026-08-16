// Deterministic local recipe templates used by the "AI Recipe Studio" and
// "Import from URL" flows on the My Recipes screen. There is no real AI
// generation or URL scraping here (UI-only per product decision) — the same
// prompt + diet always produces the same recipe, picked by hashing the input,
// mirroring the estimate approach already used in recipe.controller.js.

export type GeneratedStep = { text: string; seconds: number };
export type RecipeTemplate = {
  title: string;
  diet: string;
  ingredients: string[];
  steps: GeneratedStep[];
  timeMin: number;
  kcal: number;
  proteinG: number;
  servings: number;
};

export const DIET_OPTIONS = ['High protein', 'Keto', 'Vegan', 'Mediterranean', 'Gluten-free', 'Low-FODMAP'] as const;
export type DietOption = (typeof DIET_OPTIONS)[number];

export const COLLECTION_TAGS = ['Weeknight', 'Meal-prep', 'Post-workout', 'Gut-friendly'] as const;
export type CollectionTag = (typeof COLLECTION_TAGS)[number];

const TEMPLATES: RecipeTemplate[] = [
  {
    title: 'Grilled Chicken & Quinoa Power Bowl',
    diet: 'High protein',
    ingredients: ['2 chicken breasts', '1 cup quinoa', '1 cup cherry tomatoes', '½ cucumber, diced', '2 tbsp olive oil', '1 lemon, juiced', 'Salt & pepper to taste'],
    steps: [
      { text: 'Season the chicken breasts with salt, pepper, and a drizzle of olive oil.', seconds: 60 },
      { text: 'Rinse the quinoa and simmer in 2 cups water until fluffy. This takes about 15 minutes.', seconds: 900 },
      { text: 'Grill the chicken over medium-high heat until cooked through, about 6 minutes per side.', seconds: 360 },
      { text: 'Slice the chicken and toss the quinoa with tomatoes, cucumber, lemon juice, and remaining oil.', seconds: 120 },
      { text: 'Plate the quinoa base, top with sliced chicken, and serve warm.', seconds: 60 },
    ],
    timeMin: 30,
    kcal: 520,
    proteinG: 46,
    servings: 2,
  },
  {
    title: 'Keto Salmon & Garlic Asparagus',
    diet: 'Keto',
    ingredients: ['2 salmon fillets', '1 bunch asparagus, trimmed', '3 cloves garlic, minced', '2 tbsp butter', '1 tbsp olive oil', 'Salt & pepper to taste'],
    steps: [
      { text: 'Pat the salmon dry and season both sides with salt and pepper.', seconds: 60 },
      { text: 'Heat olive oil in a pan and sear the salmon skin-side down for 4 minutes.', seconds: 240 },
      { text: 'Flip the salmon and cook for another 3 minutes until just cooked through.', seconds: 180 },
      { text: 'In a separate pan, sauté the asparagus and garlic in butter for 5 minutes.', seconds: 300 },
      { text: 'Plate the salmon alongside the asparagus and serve immediately.', seconds: 60 },
    ],
    timeMin: 20,
    kcal: 460,
    proteinG: 38,
    servings: 2,
  },
  {
    title: 'Vegan Rainbow Buddha Bowl',
    diet: 'Vegan',
    ingredients: ['1 cup cooked brown rice', '1 cup chickpeas, drained', '1 carrot, shredded', '½ cup shredded red cabbage', '½ avocado, sliced', '2 tbsp tahini', '1 tbsp soy sauce'],
    steps: [
      { text: 'Warm the cooked brown rice and spoon into two bowls.', seconds: 120 },
      { text: 'Roast the chickpeas with a little oil and salt until golden, about 12 minutes.', seconds: 720 },
      { text: 'Whisk the tahini with soy sauce and a splash of water into a smooth dressing.', seconds: 120 },
      { text: 'Arrange the chickpeas, carrot, cabbage, and avocado over the rice.', seconds: 120 },
      { text: 'Drizzle with the tahini dressing and serve.', seconds: 60 },
    ],
    timeMin: 25,
    kcal: 480,
    proteinG: 16,
    servings: 2,
  },
  {
    title: 'Mediterranean Chickpea & Feta Salad',
    diet: 'Mediterranean',
    ingredients: ['1 can chickpeas, drained', '1 cucumber, diced', '1 cup cherry tomatoes, halved', '½ red onion, sliced', '½ cup feta, crumbled', '3 tbsp olive oil', '1 lemon, juiced', 'Handful of parsley'],
    steps: [
      { text: 'Combine the chickpeas, cucumber, tomatoes, and red onion in a large bowl.', seconds: 180 },
      { text: 'Whisk together the olive oil and lemon juice, then pour over the salad.', seconds: 90 },
      { text: 'Toss well and let it sit for 10 minutes so the flavors combine.', seconds: 600 },
      { text: 'Top with crumbled feta and chopped parsley before serving.', seconds: 90 },
    ],
    timeMin: 15,
    kcal: 380,
    proteinG: 15,
    servings: 2,
  },
  {
    title: 'Gluten-Free Turkey Lettuce Wraps',
    diet: 'Gluten-free',
    ingredients: ['500g ground turkey', '1 tbsp tamari (gluten-free soy sauce)', '1 tsp fresh ginger, grated', '2 cloves garlic, minced', '1 head butter lettuce', '1 carrot, julienned', '2 tbsp chopped peanuts'],
    steps: [
      { text: 'Brown the ground turkey in a hot pan, breaking it up as it cooks, for 6 minutes.', seconds: 360 },
      { text: 'Stir in the tamari, ginger, and garlic and cook for another 2 minutes.', seconds: 120 },
      { text: 'Separate the lettuce into individual cup-shaped leaves and rinse.', seconds: 90 },
      { text: 'Spoon the turkey mixture into the lettuce cups and top with carrot and peanuts.', seconds: 120 },
    ],
    timeMin: 15,
    kcal: 340,
    proteinG: 32,
    servings: 3,
  },
  {
    title: 'Low-FODMAP Herb Baked Cod',
    diet: 'Low-FODMAP',
    ingredients: ['2 cod fillets', '1 tbsp olive oil', '1 tsp dried dill', '1 tsp dried parsley', '1 lemon, sliced', '1 cup baby spinach', 'Salt & pepper to taste'],
    steps: [
      { text: 'Preheat the oven to 400°F (200°C).', seconds: 60 },
      { text: 'Place the cod on a lined tray, drizzle with olive oil, and season with herbs, salt, and pepper.', seconds: 120 },
      { text: 'Top with lemon slices and bake until flaky, about 15 minutes.', seconds: 900 },
      { text: 'Wilt the spinach in a pan for 2 minutes and serve alongside the cod.', seconds: 120 },
    ],
    timeMin: 20,
    kcal: 310,
    proteinG: 34,
    servings: 2,
  },
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DIET_TO_COLLECTION: Record<string, CollectionTag> = {
  'High protein': 'Post-workout',
  Keto: 'Post-workout',
  Vegan: 'Gut-friendly',
  Mediterranean: 'Gut-friendly',
  'Gluten-free': 'Gut-friendly',
  'Low-FODMAP': 'Gut-friendly',
};

export function collectionTagFor(diet: string | undefined, source: 'ai' | 'url' | 'manual'): CollectionTag {
  if (diet && DIET_TO_COLLECTION[diet]) return DIET_TO_COLLECTION[diet];
  if (source === 'url') return 'Meal-prep';
  return 'Weeknight';
}

/** Picks a template deterministically from the prompt text + diet, then re-titles it around the prompt. */
export function generateRecipeFromPrompt(prompt: string, diet: DietOption) {
  const dietMatches = TEMPLATES.filter((t) => t.diet === diet);
  const pool = dietMatches.length ? dietMatches : TEMPLATES;
  const cleanPrompt = prompt.trim();
  const index = hashString(`${cleanPrompt}|${diet}`) % pool.length;
  const template = pool[index];
  const title = cleanPrompt ? `${diet}: ${cleanPrompt.slice(0, 42)}${cleanPrompt.length > 42 ? '…' : ''}` : template.title;
  return { ...template, title, diet };
}

export function templateForUrl(url: string) {
  const cleanUrl = url.trim();
  let host = 'the web';
  try {
    host = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname.replace(/^www\./, '');
  } catch {
    // keep default host label if the URL doesn't parse
  }
  const template = TEMPLATES[hashString(cleanUrl) % TEMPLATES.length];
  return { ...template, title: `${template.title} (from ${host})` };
}
