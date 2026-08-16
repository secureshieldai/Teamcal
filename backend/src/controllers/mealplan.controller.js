const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { model, AI_ENABLED } = require("./coach.controller");

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_SHARE = { breakfast: 0.25, lunch: 0.3, dinner: 0.35, snack: 0.1 };

// Rough macro calorie-split per diet preference: [protein%, carb%, fat%] of that meal's kcal.
const MACRO_SPLIT = {
  balanced: [0.25, 0.45, 0.3],
  "high protein": [0.4, 0.35, 0.25],
  "weight loss": [0.3, 0.4, 0.3],
  "muscle gain": [0.35, 0.45, 0.2],
  "high fiber": [0.2, 0.55, 0.25],
  "low carb": [0.35, 0.2, 0.45],
  mediterranean: [0.2, 0.45, 0.35],
  keto: [0.25, 0.1, 0.65],
  paleo: [0.3, 0.3, 0.4],
  "budget friendly": [0.25, 0.5, 0.25],
  "family friendly": [0.25, 0.45, 0.3],
};

const TEMPLATES = {
  breakfast: ["Greek yogurt bowl", "Veggie omelette", "Oatmeal with berries", "Avocado toast", "Protein smoothie", "Cottage cheese & fruit"],
  lunch: ["Turkey wrap", "Grilled chicken salad", "Quinoa bowl", "Lentil soup", "Tuna sandwich", "Chicken burrito bowl"],
  dinner: ["Baked cod with veggies", "Grilled salmon", "Stir-fried tofu", "Chicken stir fry", "Veggie chili", "Turkey meatballs & rice"],
  snack: ["Apple & almond butter", "Greek yogurt", "Trail mix", "Protein bar", "Carrot sticks & hummus", "Hard-boiled eggs"],
};

function toDateKey(ts) {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function newMealId() {
  return crypto.randomUUID();
}

function macroSplitFor(dietPreference) {
  return MACRO_SPLIT[String(dietPreference || "balanced").toLowerCase()] || MACRO_SPLIT.balanced;
}

function buildMeal({ mealType, name, kcal, dietPreference }) {
  const [pPct, cPct, fPct] = macroSplitFor(dietPreference);
  return {
    id: newMealId(),
    mealType,
    name,
    kcal,
    protein: Math.round((kcal * pPct) / 4),
    carbs: Math.round((kcal * cPct) / 4),
    fats: Math.round((kcal * fPct) / 4),
    recipe: `Prepare ${name.toLowerCase()} using simple, whole-food ingredients. Season to taste, portion to roughly ${kcal} kcal, and enjoy.`,
    completed: false,
  };
}

function fallbackDays({ durationDays, dailyCalories, mealTypes, dietPreference }, startTs) {
  const types = mealTypes.length ? mealTypes : MEAL_TYPES;
  const totalShare = types.reduce((s, t) => s + (MEAL_SHARE[t] || 0.25), 0) || 1;
  const days = [];
  for (let d = 0; d < durationDays; d++) {
    const meals = types.map((mealType, i) => {
      const share = (MEAL_SHARE[mealType] || 0.25) / totalShare;
      const kcal = Math.max(80, Math.round(dailyCalories * share));
      const options = TEMPLATES[mealType] || TEMPLATES.breakfast;
      const name = options[(d + i) % options.length];
      return buildMeal({ mealType, name, kcal, dietPreference });
    });
    days.push({ date: toDateKey(startTs + d * 86400000), meals });
  }
  return days;
}

async function generateSingleMealFallback({ mealType, dietPreference, targetKcal }) {
  const options = TEMPLATES[mealType] || TEMPLATES.breakfast;
  const name = options[Math.floor(Math.random() * options.length)];
  return buildMeal({ mealType, name, kcal: targetKcal, dietPreference });
}

function buildPrompt(prefs, durationDays) {
  const { dailyCalories, mealTypes, dietaryRestrictions, dietPreference, allergies, healthConditions, notes } = prefs;
  return `You are Blaze, an expert AI nutrition coach inside the TeamCal app. Generate a ${durationDays}-day meal plan.
Rules:
- Daily calorie target: ${dailyCalories} kcal per day, split across exactly these meals (in this order): ${mealTypes.join(", ")}.
- Diet preference: ${dietPreference}.
- Dietary restrictions: ${dietaryRestrictions.length ? dietaryRestrictions.join(", ") : "none"}.
- Allergies to strictly avoid: ${allergies.length ? allergies.join(", ") : "none"}.
- Health conditions to consider: ${healthConditions.length ? healthConditions.join(", ") : "none"}.
- Extra notes from the user: ${notes || "none"}.

Return ONLY valid JSON (no markdown fences) with this exact shape:
{"days":[{"meals":[{"mealType":"breakfast","name":"Greek yogurt bowl","kcal":350,"protein":31,"carbs":35,"fats":10,"recipe":"2-3 sentence recipe/instructions"}]}]}
Provide exactly ${durationDays} day objects. Each day must have exactly one meal object per entry in ${JSON.stringify(mealTypes)}, in that order. kcal/macros should be realistic and sum close to the daily target. Vary the meals across days.`;
}

function normalizeAiDays(parsedDays, { durationDays, mealTypes, dailyCalories, dietPreference }, startTs) {
  const types = mealTypes.length ? mealTypes : MEAL_TYPES;
  const days = [];
  for (let d = 0; d < durationDays; d++) {
    const source = parsedDays[d] || parsedDays[parsedDays.length - 1] || { meals: [] };
    const meals = types.map((mealType, i) => {
      const m = (source.meals || []).find((x) => x.mealType === mealType) || source.meals?.[i] || {};
      const kcal = Number(m.kcal) > 0 ? Math.round(Number(m.kcal)) : Math.round(dailyCalories * (MEAL_SHARE[mealType] || 0.25));
      return {
        id: newMealId(),
        mealType,
        name: String(m.name || TEMPLATES[mealType]?.[0] || "Meal"),
        kcal,
        protein: Number(m.protein) >= 0 ? Math.round(Number(m.protein)) : Math.round((kcal * macroSplitFor(dietPreference)[0]) / 4),
        carbs: Number(m.carbs) >= 0 ? Math.round(Number(m.carbs)) : Math.round((kcal * macroSplitFor(dietPreference)[1]) / 4),
        fats: Number(m.fats) >= 0 ? Math.round(Number(m.fats)) : Math.round((kcal * macroSplitFor(dietPreference)[2]) / 4),
        recipe: String(m.recipe || `Prepare ${String(m.name || "this meal").toLowerCase()} with simple, whole-food ingredients.`),
        completed: false,
      };
    });
    days.push({ date: toDateKey(startTs + d * 86400000), meals });
  }
  return days;
}

async function generatePlanDays(prefs, durationDays, startTs = Date.now()) {
  if (AI_ENABLED) {
    try {
      const result = await model.generateContent(buildPrompt(prefs, durationDays));
      const text = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.days) && parsed.days.length) {
        return normalizeAiDays(parsed.days, { ...prefs, durationDays }, startTs);
      }
    } catch {
      // Fall through to the deterministic generator below.
    }
  }
  return fallbackDays({ ...prefs, durationDays }, startTs);
}

function readPrefs(body) {
  return {
    dailyCalories: Math.max(800, Math.round(Number(body.dailyCalories) || 2000)),
    mealTypes: Array.isArray(body.mealTypes) && body.mealTypes.length ? body.mealTypes.filter((t) => MEAL_TYPES.includes(t)) : MEAL_TYPES,
    dietaryRestrictions: Array.isArray(body.dietaryRestrictions) ? body.dietaryRestrictions : [],
    dietPreference: String(body.dietPreference || "Balanced"),
    allergies: Array.isArray(body.allergies) ? body.allergies : [],
    healthConditions: Array.isArray(body.healthConditions) ? body.healthConditions : [],
    notes: String(body.notes || ""),
  };
}

/** POST /api/mealplan/generate */
async function generatePlan(req, res, next) {
  try {
    const durationDays = Math.min(Math.max(Number(req.body.durationDays) || 7, 1), 90);
    const prefs = readPrefs(req.body);
    const startTs = Date.now();
    const days = await generatePlanDays(prefs, durationDays, startTs);

    const { data: plan, error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: req.user.id,
        duration_days: durationDays,
        daily_calories: prefs.dailyCalories,
        meal_types: prefs.mealTypes,
        dietary_restrictions: prefs.dietaryRestrictions,
        diet_preference: prefs.dietPreference,
        allergies: prefs.allergies,
        health_conditions: prefs.healthConditions,
        notes: prefs.notes,
        days,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
}

/** GET /api/mealplan/current */
async function getCurrentPlan(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    res.json({ success: true, plan: data?.[0] || null });
  } catch (err) {
    next(err);
  }
}

async function loadOwnedPlan(userId, planId) {
  const { data, error } = await supabase.from("meal_plans").select("*").eq("id", planId).eq("user_id", userId).single();
  if (error) return null;
  return data;
}

/** PATCH /api/mealplan/:id — regenerate the whole plan with new preferences */
async function updatePreferences(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });

    const durationDays = Math.min(Math.max(Number(req.body.durationDays) || plan.duration_days, 1), 90);
    const prefs = readPrefs({ ...plan, ...req.body, mealTypes: req.body.mealTypes ?? plan.meal_types, dietaryRestrictions: req.body.dietaryRestrictions ?? plan.dietary_restrictions, allergies: req.body.allergies ?? plan.allergies, healthConditions: req.body.healthConditions ?? plan.health_conditions });
    const startTs = Date.now();
    const days = await generatePlanDays(prefs, durationDays, startTs);

    const { data: updated, error } = await supabase
      .from("meal_plans")
      .update({
        duration_days: durationDays,
        daily_calories: prefs.dailyCalories,
        meal_types: prefs.mealTypes,
        dietary_restrictions: prefs.dietaryRestrictions,
        diet_preference: prefs.dietPreference,
        allergies: prefs.allergies,
        health_conditions: prefs.healthConditions,
        notes: prefs.notes,
        days,
      })
      .eq("id", plan.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/mealplan/:id/day/:dayIndex/regenerate */
async function regenerateDay(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    const dayIndex = Number(req.params.dayIndex);
    const days = plan.days || [];
    if (!days[dayIndex]) return res.status(404).json({ success: false, message: "Day not found" });

    const prefs = readPrefs({ ...plan, mealTypes: plan.meal_types, dietaryRestrictions: plan.dietary_restrictions, healthConditions: plan.health_conditions });
    const [newDay] = await generatePlanDays(prefs, 1, new Date(`${days[dayIndex].date}T00:00:00Z`).getTime());
    days[dayIndex] = newDay;

    const { data: updated, error } = await supabase.from("meal_plans").update({ days }).eq("id", plan.id).select().single();
    if (error) throw error;
    res.json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
}

/** POST /api/mealplan/:id/day/:dayIndex/meal/:mealId/regenerate — also used for "Swap Meal" */
async function regenerateMeal(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    const dayIndex = Number(req.params.dayIndex);
    const days = plan.days || [];
    const day = days[dayIndex];
    if (!day) return res.status(404).json({ success: false, message: "Day not found" });
    const mealIdx = (day.meals || []).findIndex((m) => m.id === req.params.mealId);
    if (mealIdx === -1) return res.status(404).json({ success: false, message: "Meal not found" });

    const existing = day.meals[mealIdx];
    let replacement;
    if (AI_ENABLED) {
      try {
        const prompt = `You are Blaze, an AI nutrition coach. Suggest ONE replacement ${existing.mealType} meal, different from "${existing.name}", targeting about ${existing.kcal} kcal, diet preference "${plan.diet_preference}", avoiding allergies: ${(plan.allergies || []).join(", ") || "none"}. Return ONLY valid JSON: {"name":"...","kcal":0,"protein":0,"carbs":0,"fats":0,"recipe":"..."}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        const m = JSON.parse(text);
        replacement = {
          id: existing.id,
          mealType: existing.mealType,
          name: String(m.name || existing.name),
          kcal: Number(m.kcal) > 0 ? Math.round(Number(m.kcal)) : existing.kcal,
          protein: Number(m.protein) >= 0 ? Math.round(Number(m.protein)) : existing.protein,
          carbs: Number(m.carbs) >= 0 ? Math.round(Number(m.carbs)) : existing.carbs,
          fats: Number(m.fats) >= 0 ? Math.round(Number(m.fats)) : existing.fats,
          recipe: String(m.recipe || existing.recipe),
          completed: false,
        };
      } catch {
        replacement = null;
      }
    }
    if (!replacement) {
      replacement = { ...(await generateSingleMealFallback({ mealType: existing.mealType, dietPreference: plan.diet_preference, targetKcal: existing.kcal })), id: existing.id };
    }
    day.meals[mealIdx] = replacement;

    const { data: updated, error } = await supabase.from("meal_plans").update({ days }).eq("id", plan.id).select().single();
    if (error) throw error;
    res.json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/mealplan/:id/day/:dayIndex/meal/:mealId — edit fields or toggle `completed` */
async function updateMeal(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    const dayIndex = Number(req.params.dayIndex);
    const days = plan.days || [];
    const day = days[dayIndex];
    if (!day) return res.status(404).json({ success: false, message: "Day not found" });
    const mealIdx = (day.meals || []).findIndex((m) => m.id === req.params.mealId);
    if (mealIdx === -1) return res.status(404).json({ success: false, message: "Meal not found" });

    const allowed = ["name", "kcal", "protein", "carbs", "fats", "recipe", "completed"];
    const patch = {};
    for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];
    day.meals[mealIdx] = { ...day.meals[mealIdx], ...patch };

    const { data: updated, error } = await supabase.from("meal_plans").update({ days }).eq("id", plan.id).select().single();
    if (error) throw error;
    res.json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/mealplan/:id/day/:dayIndex/meal/:mealId */
async function removeMeal(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    const dayIndex = Number(req.params.dayIndex);
    const days = plan.days || [];
    const day = days[dayIndex];
    if (!day) return res.status(404).json({ success: false, message: "Day not found" });
    day.meals = (day.meals || []).filter((m) => m.id !== req.params.mealId);

    const { data: updated, error } = await supabase.from("meal_plans").update({ days }).eq("id", plan.id).select().single();
    if (error) throw error;
    res.json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/mealplan/:id */
async function deletePlan(req, res, next) {
  try {
    await supabase.from("meal_plans").delete().eq("id", req.params.id).eq("user_id", req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/mealplan/:id/day/:dayIndex/grocery-list
 * Naive word-tokenization of that day's meal names — intentionally matches the
 * reference app's literal behavior rather than doing real ingredient extraction.
 */
async function groceryList(req, res, next) {
  try {
    const plan = await loadOwnedPlan(req.user.id, req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    const day = (plan.days || [])[Number(req.params.dayIndex)];
    if (!day) return res.status(404).json({ success: false, message: "Day not found" });

    const seen = new Set();
    const items = [];
    for (const meal of day.meals || []) {
      const words = String(meal.name || "").split(/[^a-zA-Z']+/).filter(Boolean);
      for (const word of words) {
        const key = word.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(word);
      }
    }
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generatePlan,
  getCurrentPlan,
  updatePreferences,
  regenerateDay,
  regenerateMeal,
  updateMeal,
  removeMeal,
  deletePlan,
  groceryList,
};
