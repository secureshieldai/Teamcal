const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

function nutrientValue(food, ids, names, units = []) {
  const nutrients = food.foodNutrients || [];
  const nutrient = nutrients.find((item) => ids.includes(Number(item.nutrientId || item.nutrientNumber))) || nutrients.find((item) => {
    const id = Number(item.nutrientId || item.nutrientNumber);
    const name = String(item.nutrientName || item.name || "").toLowerCase();
    const unit = String(item.unitName || item.unit || "").toLowerCase();
    return !ids.includes(id) && names.some((candidate) => name === candidate || name.includes(candidate)) && (!units.length || units.includes(unit));
  });
  return Number(nutrient?.value ?? nutrient?.amount ?? 0) || 0;
}

async function lookupUsdaBarcode(code) {
  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "TeamCal/1.0" },
    body: JSON.stringify({ query: code, dataType: ["Branded"], pageSize: 10 }),
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 429) throw Object.assign(new Error("USDA FoodData Central rate limit reached"), { status: 503 });
  if (!response.ok) throw Object.assign(new Error("USDA FoodData Central is unavailable"), { status: 502 });
  const payload = await response.json();
  const normalized = code.replace(/^0+/, "");
  const food = (payload.foods || []).find((item) => String(item.gtinUpc || "").replace(/^0+/, "") === normalized);
  if (!food) return null;
  const serving = Number(food.servingSize) > 0 ? Number(food.servingSize) : 100;
  const scale = serving / 100;
  const kcal100 = nutrientValue(food, [1008, 208], ["energy"], ["kcal"]);
  const protein100 = nutrientValue(food, [1003, 203], ["protein"]);
  const carbs100 = nutrientValue(food, [1005, 205], ["carbohydrate, by difference", "carbohydrate"]);
  const fat100 = nutrientValue(food, [1004, 204], ["total lipid (fat)", "total fat"]);
  const round1 = (value) => Math.round(value * 10) / 10;
  return { name: food.description || `Product ${code}`, brand: food.brandName || food.brandOwner || null, grams: serving, servingUnit: food.servingSizeUnit || "g", servingText: food.householdServingFullText || null, kcal: Math.round(kcal100 * scale), p: round1(protein100 * scale), c: round1(carbs100 * scale), f: round1(fat100 * scale), confidence: kcal100 || protein100 || carbs100 || fat100 ? 1 : 0.5, source: "usda-fdc", sourceId: String(food.fdcId), barcode: code };
}

module.exports = { lookupUsdaBarcode };
