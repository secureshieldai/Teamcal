const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require("express-rate-limit");
const { lookupUsdaBarcode } = require("../services/foodDataCentral.service");

const AI_ENABLED = Boolean(process.env.GEMINI_API_KEY && !/^your_|placeholder|change-me/i.test(process.env.GEMINI_API_KEY));
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

    const base64 = req.file.buffer.toString("base64");
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
      return res.status(502).json({ success: false, message: "AI Vision returned an unreadable result. Please retake the photo." });
    }

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
    const message = err?.message || "AI Vision request failed";
    res.status(502).json({ success: false, message: process.env.NODE_ENV === "production" ? "AI Vision is temporarily unavailable" : message });
  }
}

async function lookupBarcode(req, res, next) {
  try {
    const code = String(req.body.code || "").replace(/\D/g, "");
    if (code.length < 8 || code.length > 14) return res.status(400).json({ success: false, message: "Invalid barcode" });
    let p = null;
    try {
      const fields = "code,product_name,generic_name,brands,image_front_url,image_url,serving_quantity,serving_size,nutriments";
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`, { headers: { "User-Agent": `TeamCal/1.0 (${process.env.OPEN_FOOD_FACTS_CONTACT || "support@teamcal.app"})` }, signal: AbortSignal.timeout(10000) });
      if (response.ok) { const payload = await response.json(); if (payload.status === 1 && payload.product) p = payload.product; }
    } catch { /* USDA is an independent fallback. */ }

    const n = p?.nutriments || {};
    const hasOffNutrition = ["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"].some(key => Number(n[key]) > 0);
    let item;
    if (p && hasOffNutrition) {
      const serving = Number(p.serving_quantity) || 100; const scale = serving / 100;
      item = { name: p.product_name || p.generic_name || `Product ${code}`, brand: p.brands || null, grams: serving, servingUnit: "g", servingText: p.serving_size || null, kcal: Math.round(Number(n["energy-kcal_100g"] || 0) * scale), p: Math.round(Number(n.proteins_100g || 0) * scale * 10) / 10, c: Math.round(Number(n.carbohydrates_100g || 0) * scale * 10) / 10, f: Math.round(Number(n.fat_100g || 0) * scale * 10) / 10, confidence: 1, source: "open-food-facts", sourceId: code, barcode: code };
    } else {
      item = await lookupUsdaBarcode(code);
      if (!item && p) item = { name: p.product_name || p.generic_name || `Product ${code}`, brand: p.brands || null, grams: Number(p.serving_quantity) || 100, servingUnit: "g", servingText: p.serving_size || null, kcal: 0, p: 0, c: 0, f: 0, confidence: 0.5, source: "open-food-facts", sourceId: code, barcode: code };
    }
    if (!item) return res.status(404).json({ success: false, message: process.env.USDA_FDC_API_KEY ? "Product not found. Scan the front label with AI Vision instead." : "Product not found in Open Food Facts. USDA lookup is not configured." });
    res.json({ success: true, result: { id: `barcode-${Date.now()}`, ts: Date.now(), barcode: code, image: p?.image_front_url || p?.image_url || null, source: item.source, items: [item], totals: { kcal: item.kcal, p: item.p, c: item.c, f: item.f } } });
  } catch (err) { next(err); }
}

async function generateAudience(req,res,next){try{const b=req.body||{};const count=Math.min(Math.max(Number(b.count)||6,1),12);let captions=[];if(AI_ENABLED){const prompt=`Return ONLY a JSON array of ${count} concise social media captions. Topic: ${b.topic||'healthy living'}. Instructions: ${b.instructions||'educational and actionable'}. Tone: ${b.tone||'educational'}.`;const result=await model.generateContent(prompt);try{captions=JSON.parse(result.response.text().replace(/```json|```/g,'').trim())}catch{captions=[]}}if(!Array.isArray(captions)||!captions.length)captions=Array.from({length:count},(_,i)=>`${b.topic||'Healthy living'} tip ${i+1}: ${b.instructions||'Take one practical step today and track your progress.'}`);const posts=captions.slice(0,count).map((caption,i)=>({id:`generated-${Date.now()}-${i}`,caption:String(caption),format:(b.formats||['text'])[i%(b.formats||['text']).length],thumbnail:`https://picsum.photos/seed/audience-${Date.now()}-${i}/300/200`,status:'Needs Review'}));res.json({success:true,posts});}catch(e){next(e);}}

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

module.exports = { chat, scanMeal, lookupBarcode, generateAudience, aiRateLimit };
