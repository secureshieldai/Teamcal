const { supabase } = require("../config/supabase");

/** POST /api/meals/log */
async function logMeal(req, res, next) {
  try {
    const { name, kcal, protein, carbs, fats, mealType, photo, ts } = req.body;
    const { data: entry, error } = await supabase
      .from("tracker_entries")
      .insert({
        user_id: req.user.id,
        tracker: "meals",
        ts: ts || Date.now(),
        value: Number(kcal) || 0,
        meta: { name, kcal: Number(kcal), protein: Number(protein), carbs: Number(carbs), fats: Number(fats), mealType: mealType || "Meal", photo: photo || null },
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

async function mealsForDay(req, res, next) {
  try {
    const start = new Date(`${req.query.date}T00:00:00`);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ success: false, message: "Valid date is required" });
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const { data: entries, error } = await supabase.from("tracker_entries").select("*")
      .eq("user_id", req.user.id).eq("tracker", "meals").gte("ts", start.getTime()).lt("ts", end.getTime()).order("ts");
    if (error) throw error;
    res.json({ success: true, entries });
  } catch (err) { next(err); }
}

async function updateMeal(req, res, next) {
  try {
    const { data: current, error: findError } = await supabase.from("tracker_entries").select("*").eq("id", req.params.id).eq("user_id", req.user.id).eq("tracker", "meals").single();
    if (findError || !current) return res.status(404).json({ success: false, message: "Meal not found" });
    const b = req.body; const meta = { ...current.meta };
    ["name", "mealType", "photo"].forEach(k => { if (b[k] !== undefined) meta[k] = b[k]; });
    ["kcal", "protein", "carbs", "fats"].forEach(k => { if (b[k] !== undefined) meta[k] = Number(b[k]); });
    const patch = { meta, value: meta.kcal || 0 }; if (b.ts !== undefined) patch.ts = Number(b.ts);
    const { data: entry, error } = await supabase.from("tracker_entries").update(patch).eq("id", req.params.id).eq("user_id", req.user.id).select().single();
    if (error) throw error; res.json({ success: true, entry });
  } catch (err) { next(err); }
}

async function deleteMeal(req, res, next) {
  try { await supabase.from("tracker_entries").delete().eq("id", req.params.id).eq("user_id", req.user.id).eq("tracker", "meals"); res.json({ success: true }); }
  catch (err) { next(err); }
}

/** GET /api/meals/today */
async function todayMeals(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: entries, error } = await supabase
      .from("tracker_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("tracker", "meals")
      .gte("ts", startOfDay.getTime())
      .order("ts", { ascending: false });

    if (error) throw error;

    const totals = entries.reduce(
      (acc, e) => {
        acc.kcal += e.meta?.kcal || e.value || 0;
        acc.protein += e.meta?.protein || 0;
        acc.carbs += e.meta?.carbs || 0;
        acc.fats += e.meta?.fats || 0;
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fats: 0 }
    );

    res.json({ success: true, entries, totals });
  } catch (err) {
    next(err);
  }
}

/** POST /api/meals/scan-log */
async function logScanResult(req, res, next) {
  try {
    const { items, totals } = req.body;
    const { data: entry, error } = await supabase
      .from("tracker_entries")
      .insert({
        user_id: req.user.id,
        tracker: "meal-scan",
        ts: Date.now(),
        value: totals?.kcal || 0,
        meta: { id: `scan-${Date.now()}`, ts: Date.now(), items, totals },
      })
      .select()
      .single();

    if (error) throw error;

    // Also log calories in main meals tracker
    await supabase.from("tracker_entries").insert({
      user_id: req.user.id,
      tracker: "meals",
      ts: Date.now(),
      value: totals?.kcal || 0,
      meta: { name: "Scanned meal", ...totals },
    });

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
}

module.exports = { logMeal, todayMeals, logScanResult, mealsForDay, updateMeal, deleteMeal };
