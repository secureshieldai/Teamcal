// Proxies TheMealDB (https://www.themealdb.com/api.php) — free, keyless — and normalizes
// results into TeamCal's own recipe shape. TheMealDB has no nutrition/rating/timer data,
// so kcal/proteinG/rating are deterministic estimates (see estimateNutrition/estimateRating),
// and per-step timer seconds are parsed from the real instruction text.
const BASE = "https://www.themealdb.com/api/json/v1/1";

const MEDITERRANEAN_AREAS = ["Greek", "Italian", "Spanish", "Turkish", "Lebanese", "Moroccan"];
const PROTEIN_CATEGORIES = ["Beef", "Chicken", "Pork", "Seafood", "Lamb", "Goat"];
const HIGH_CARB_WORDS = ["rice", "pasta", "noodle", "bread", "potato", "sugar", "flour", "tortilla", "bun", "cake", "corn", "oats", "pastry"];
const GLUTEN_WORDS = ["flour", "bread", "pasta", "noodle", "soy sauce", "barley", "wheat", "bun", "tortilla", "pastry", "breadcrumb"];

let trendingCache = { at: 0, data: [] };

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Upstream error ${res.status}`);
  return res.json();
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function parseSeconds(sentence) {
  const range = sentence.match(/(\d+)\s*[-–]\s*(\d+)\s*min/i);
  if (range) return Math.round(((Number(range[1]) + Number(range[2])) / 2) * 60);
  const mins = sentence.match(/(\d+)\s*min/i);
  if (mins) return Number(mins[1]) * 60;
  const hours = sentence.match(/(\d+)\s*hour/i);
  if (hours) return Number(hours[1]) * 3600;
  const secs = sentence.match(/(\d+)\s*sec/i);
  if (secs) return Number(secs[1]);
  return 60;
}

function splitSteps(instructions) {
  const sentences = String(instructions || "")
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^step\s*\d+\.?:?$/i.test(s))
    .flatMap((block) => block.split(/(?<=[.!?])\s+(?=[A-Z])/))
    .map((s) => s.trim().replace(/^step\s*\d+\.?:?\s*/i, ''))
    .filter((s) => s.length > 3);

  // Merge short continuation fragments ("This would take about 15 minutes.", "Enjoy!")
  // into the previous step instead of treating them as their own action.
  const merged = [];
  for (const sentence of sentences) {
    if (merged.length && sentence.length < 40) {
      merged[merged.length - 1] += ` ${sentence}`;
    } else {
      merged.push(sentence);
    }
  }

  return merged.map((text) => ({ text, seconds: parseSeconds(text) }));
}

function extractIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      items.push({ text: `${measure && measure.trim() ? `${measure.trim()} ` : ""}${name.trim()}` });
    }
  }
  return items;
}

function estimateNutrition(category, ingredientCount) {
  const isDessert = /dessert/i.test(category || "");
  const isProteinHeavy = PROTEIN_CATEGORIES.includes(category);
  const kcal = Math.round((220 + ingredientCount * (isDessert ? 55 : 45)) / 10) * 10;
  const proteinG = Math.round((isProteinHeavy ? kcal * 0.28 : kcal * 0.14) / 4 / 5) * 5;
  return { kcal, proteinG };
}

function estimateRating(id) {
  return Math.round((4.2 + (hashString(String(id)) % 71) / 100) * 10) / 10;
}

function estimateTime(steps) {
  return Math.max(5, Math.round(steps.reduce((s, st) => s + st.seconds, 0) / 60));
}

function dietTags(category, ingredientsTextLower) {
  const tags = [];
  if (/vegan/i.test(category || "")) tags.push("Vegan");
  if (/vegetarian/i.test(category || "")) tags.push("Vegetarian");
  const hasHighCarb = HIGH_CARB_WORDS.some((w) => ingredientsTextLower.includes(w));
  if (!hasHighCarb && !/vegan|vegetarian|dessert/i.test(category || "")) {
    tags.push("Keto", "Low-Carb");
  }
  if (PROTEIN_CATEGORIES.includes(category)) tags.push("High-Protein");
  if (!GLUTEN_WORDS.some((w) => ingredientsTextLower.includes(w))) tags.push("GF");
  return Array.from(new Set(tags));
}

function normalizeMeal(meal) {
  const ingredients = extractIngredients(meal);
  const steps = splitSteps(meal.strInstructions);
  const ingredientsTextLower = ingredients.map((i) => i.text.toLowerCase()).join(" ");
  const { kcal, proteinG } = estimateNutrition(meal.strCategory, ingredients.length);
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    cuisine: meal.strArea || "Other",
    category: meal.strCategory || "",
    dietTags: dietTags(meal.strCategory, ingredientsTextLower),
    ingredients,
    steps,
    timeMin: estimateTime(steps),
    kcal,
    proteinG,
    servings: 2,
    rating: estimateRating(meal.idMeal),
  };
}

function dedupeById(meals) {
  const seen = new Set();
  return meals.filter((m) => {
    if (!m || seen.has(m.idMeal)) return false;
    seen.add(m.idMeal);
    return true;
  });
}

async function searchByName(q) {
  const data = await fetchJson(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
  return data.meals || [];
}
async function filterByArea(area) {
  const data = await fetchJson(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  return data.meals || [];
}
async function filterByCategory(category) {
  const data = await fetchJson(`${BASE}/filter.php?c=${encodeURIComponent(category)}`);
  return data.meals || [];
}
async function lookupById(id) {
  const data = await fetchJson(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  return data.meals?.[0] || null;
}

/** filter.php only returns {idMeal, strMeal, strMealThumb} — hydrate full rows for accurate normalization. */
async function hydrateFull(partialMeals, limit) {
  const slice = partialMeals.slice(0, limit);
  const full = await Promise.all(slice.map((m) => lookupById(m.idMeal).catch(() => null)));
  return full.filter(Boolean);
}

/** GET /api/recipes/search?q=&cuisine=&diet=&maxTime=&limit= */
async function search(req, res, next) {
  try {
    const { q, cuisine, diet, maxTime } = req.query;
    const cap = Math.min(Number(req.query.limit) || 24, 40);
    let rawMeals;

    if (q && String(q).trim()) {
      rawMeals = await searchByName(String(q).trim());
    } else if (cuisine && cuisine !== "All") {
      const areas = cuisine === "Mediterranean" ? MEDITERRANEAN_AREAS : [cuisine];
      const lists = await Promise.all(areas.map((a) => filterByArea(a).catch(() => [])));
      rawMeals = await hydrateFull(dedupeById(lists.flat()), cap);
    } else if (diet === "Vegan" || diet === "Vegetarian") {
      rawMeals = await hydrateFull(await filterByCategory(diet), cap);
    } else {
      const lists = await Promise.all(["Chicken", "Seafood", "Vegetarian", "Pasta"].map((c) => filterByCategory(c).catch(() => [])));
      rawMeals = await hydrateFull(dedupeById(lists.flat()), cap);
    }

    let recipes = rawMeals.map(normalizeMeal);
    if (diet && diet !== "Vegan" && diet !== "Vegetarian") {
      recipes = recipes.filter((r) => r.dietTags.includes(diet));
    }
    if (maxTime) recipes = recipes.filter((r) => r.timeMin <= Number(maxTime));

    res.json({ success: true, recipes: recipes.slice(0, cap) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/recipes/trending */
async function trending(req, res, next) {
  try {
    const now = Date.now();
    if (trendingCache.data.length && now - trendingCache.at < 30 * 60 * 1000) {
      return res.json({ success: true, recipes: trendingCache.data });
    }
    const results = [];
    const seen = new Set();
    for (let attempts = 0; results.length < 8 && attempts < 16; attempts++) {
      try {
        const data = await fetchJson(`${BASE}/random.php`);
        const meal = data.meals?.[0];
        if (meal && !seen.has(meal.idMeal)) {
          seen.add(meal.idMeal);
          results.push(normalizeMeal(meal));
        }
      } catch {
        // skip a failed random draw and try again
      }
    }
    trendingCache = { at: now, data: results };
    res.json({ success: true, recipes: results });
  } catch (err) {
    next(err);
  }
}

/** GET /api/recipes/:id */
async function getById(req, res, next) {
  try {
    const meal = await lookupById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, message: "Recipe not found" });
    res.json({ success: true, recipe: normalizeMeal(meal) });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, trending, getById };
