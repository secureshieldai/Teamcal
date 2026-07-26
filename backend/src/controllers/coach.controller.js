const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require("express-rate-limit");

const AI_ENABLED = Boolean(process.env.GEMINI_API_KEY);
let genAI, model;

if (AI_ENABLED) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
}

/**
 * Rate limit specifically for AI endpoints — stricter than global
 */
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  message: { success: false, message: "AI rate limit reached. Try again shortly." },
});

/**
 * POST /api/coach/chat
 * Body: { message, context: { fastHours, hydrationMl, steps, sleepHours } }
 *
 * Mirrors contextualReply() in src/routes/coach.tsx — falls back to rule-based
 * replies if Gemini API key is not configured.
 */
async function chat(req, res, next) {
  try {
    const { message, context = {} } = req.body;
    const { fastHours = 0, hydrationMl = 0, steps = 0, sleepHours = 7 } = context;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    let reply;

    if (AI_ENABLED) {
      const systemPrompt = `You are Blaze, a warm, expert AI health coach inside the TeamCal app.
The user's current data:
- Fasting: ${fastHours.toFixed(1)} hours active fast
- Water today: ${(hydrationMl / 1000).toFixed(1)}L
- Steps today: ${steps}
- Last sleep: ${sleepHours.toFixed(1)} hours

Keep replies concise (2-4 sentences max), warm, and data-driven. No markdown headers. No bullet lists.`;

      const chatSession = model.startChat({
        history: [],
        generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
      });
      const result = await chatSession.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
      reply = result.response.text();
    } else {
      reply = ruleBasedReply(message, { fastHours, hydrationMl, steps, sleepHours });
    }

    // Build suggestion links matching the frontend suggestion format
    const suggestions = buildSuggestions(message);

    res.json({ success: true, reply, suggestions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/coach/scan-meal
 * Multipart: image file
 * Uses Gemini Vision to identify foods and estimate macros.
 */
async function scanMeal(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image required" });
    }

    if (!AI_ENABLED) return res.status(503).json({ success: false, message: "AI Vision is not configured on the server" });

    const fs = require("fs");
    const imageData = fs.readFileSync(req.file.path);
    const base64 = imageData.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = `Analyze this food image. Return ONLY valid JSON (no markdown) with this exact shape:
{
  "items": [
    { "name": "Food name", "grams": 150, "kcal": 200, "p": 20, "c": 25, "f": 8, "confidence": 0.9 }
  ],
  "totals": { "kcal": 200, "p": 20, "c": 25, "f": 8 }
}
Estimate realistic portion sizes and macros per 100g scaled to estimated grams.`;

    const visionModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
    const result = await visionModel.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ]);

    let parsed;
    try {
      const text = result.response.text().replace(/```json|```/g, "").trim();
      parsed = JSON.parse(text);
    } catch {
      fs.unlink(req.file.path, () => {});
      return res.status(502).json({ success: false, message: "AI Vision returned an unreadable result. Please retake the photo." });
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      result: {
        id: `scan-${Date.now()}`,
        ts: Date.now(),
        items: parsed.items || [],
        totals: parsed.totals || { kcal: 0, p: 0, c: 0, f: 0 },
      },
    });
  } catch (err) {
    if (req.file?.path) require("fs").unlink(req.file.path, () => {});
    next(err);
  }
}

async function lookupBarcode(req, res, next) {
  try {
    const code = String(req.body.code || "").replace(/\D/g, "");
    if (code.length < 8 || code.length > 14) return res.status(400).json({ success: false, message: "Invalid barcode" });
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, { headers: { "User-Agent": "TeamCal/1.0 support@teamcal.app" } });
    if (!response.ok) return res.status(502).json({ success: false, message: "Barcode service is unavailable" });
    const payload = await response.json();
    if (!payload.product) return res.status(404).json({ success: false, message: "Product not found. Scan the front label with AI Vision instead." });
    const p = payload.product; const n = p.nutriments || {}; const serving = Number(p.serving_quantity) || 100; const scale = serving / 100;
    const item = { name: p.product_name || p.generic_name || `Product ${code}`, grams: serving, kcal: Math.round(Number(n['energy-kcal_100g'] || 0) * scale), p: Math.round(Number(n.proteins_100g || 0) * scale * 10) / 10, c: Math.round(Number(n.carbohydrates_100g || 0) * scale * 10) / 10, f: Math.round(Number(n.fat_100g || 0) * scale * 10) / 10, confidence: 1 };
    res.json({ success: true, result: { id: `barcode-${Date.now()}`, ts: Date.now(), barcode: code, image: p.image_front_url || p.image_url || null, items: [item], totals: { kcal: item.kcal, p: item.p, c: item.c, f: item.f } } });
  } catch (err) { next(err); }
}

// ── Helpers ───────────────────────────────────────────────────────

function ruleBasedReply(input, ctx) {
  const t = input.toLowerCase();
  if (t.includes("hungry")) {
    return `You're ${ctx.fastHours.toFixed(1)} hours in. That craving usually passes in twenty minutes — try 300ml of water with a pinch of salt and some 4-7-8 breathing.`;
  }
  if (t.includes("fast")) {
    return `You're ${ctx.fastHours.toFixed(1)} hours in. ${ctx.fastHours >= 18 ? "Autophagy is active — cellular cleanup is underway." : ctx.fastHours >= 12 ? "You're in fat-burning mode. Keep going." : "Hydration and a light walk will lock in the habit."}`;
  }
  if (t.includes("tired") || t.includes("energy")) {
    return `You slept ${ctx.sleepHours.toFixed(1)} hours and hit ${ctx.steps} steps. You're at ${ctx.hydrationMl}ml water — try 500ml now and a 5-minute walk.`;
  }
  if (t.includes("meal") || t.includes("food")) {
    return "I can build a meal plan around your protocol and macros. Do you want a lean keto day or a balanced refeed today?";
  }
  if (t.includes("sleep")) {
    return "Dim lights 90 minutes before bed, no screens for the last 30, and keep the room under 19°C. Want me to start a breathing session?";
  }
  return "Tell me more — I can help with fasting, food, sleep, stress, workouts, or supplements.";
}

function buildSuggestions(message) {
  const t = message.toLowerCase();
  if (t.includes("hungry") || t.includes("water")) {
    return [{ label: "Start 4-7-8", slug: "breathing" }, { label: "Log water", slug: "water" }];
  }
  if (t.includes("fast")) return [{ label: "Open fasting", slug: "fasting" }];
  if (t.includes("meal") || t.includes("food")) {
    return [{ label: "Meal planner", slug: "meal-planner" }, { label: "Scan a meal", slug: "meal-scanner" }];
  }
  if (t.includes("sleep")) {
    return [{ label: "Start breathing", slug: "breathing" }, { label: "Alarms", slug: "rise" }];
  }
  return [];
}

module.exports = { chat, scanMeal, lookupBarcode, aiRateLimit };
