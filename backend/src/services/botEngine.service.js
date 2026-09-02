const { GoogleGenerativeAI } = require("@google/generative-ai");

// Same guard pattern as coach.controller.js
const AI_ENABLED = Boolean(
  process.env.GEMINI_API_KEY && !/^your_|placeholder|change-me/i.test(process.env.GEMINI_API_KEY)
);
let genAI, model;
if (AI_ENABLED) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
}

// Prohibited data the bot must never solicit or accept.
const PROHIBITED_PATTERNS = [
  /\b(?:\d[ -]?){13,19}\b/, // card numbers
  /\bcvv\b|\bcvc\b|\bcard\s*(?:number|no)\b/i,
  /\b(?:pin|otp|one[-\s]?time\s*(?:code|password)|verification\s*code)\b/i,
  /\bpassword\b/i,
];

function containsProhibited(text) {
  return PROHIBITED_PATTERNS.some((re) => re.test(String(text || "")));
}

function kbToText(kb = {}) {
  const lines = [];
  const push = (label, val) => {
    if (val == null || val === "") return;
    if (Array.isArray(val)) {
      if (!val.length) return;
      lines.push(`${label}:`);
      val.forEach((item) => {
        if (item && typeof item === "object") {
          lines.push(`  - ${Object.values(item).filter(Boolean).join(" | ")}`);
        } else {
          lines.push(`  - ${item}`);
        }
      });
    } else if (typeof val === "object") {
      const inner = Object.entries(val).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
      if (inner.length) lines.push(`${label}: ${inner.join(", ")}`);
    } else {
      lines.push(`${label}: ${val}`);
    }
  };
  push("Business", kb.business);
  push("Opening hours", kb.hours);
  push("Delivery", kb.delivery);
  push("Refund & cancellation policy", kb.refunds);
  push("Booking", kb.booking);
  push("Membership", kb.membership);
  push("Products & services", kb.products);
  push("Plans & prices", kb.prices);
  push("FAQs", kb.faqs);
  push("Approved links", kb.links);
  push("Resources", kb.resources);
  push("Documents", (kb.documents || []).map((d) => d && (d.title || d.name || d.url)).filter(Boolean));
  push("Extra instructions", kb.instructions);
  return lines.join("\n");
}

function faqFallback(kb = {}, userMessage = "") {
  const q = String(userMessage).toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  const faqs = Array.isArray(kb.faqs) ? kb.faqs : [];
  let best = null;
  let bestScore = 0;
  for (const item of faqs) {
    const question = String((item && (item.q || item.question || item.title)) || "").toLowerCase();
    const answer = String((item && (item.a || item.answer || item.body)) || "");
    if (!answer) continue;
    const score = words.reduce((n, w) => n + (question.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = answer;
    }
  }
  return bestScore >= 1 ? best : null;
}

const HANDOFF_LINE =
  "I'm not certain about that from the information I have. Would you like me to connect you with a person?";

/**
 * Generate a bot reply grounded in the bot's Knowledge Base.
 * @returns {Promise<{ reply: string, handoffSuggested: boolean, blocked?: boolean }>}
 */
async function generateBotReply({ bot, kb, history = [], userMessage }) {
  if (containsProhibited(userMessage)) {
    return {
      reply:
        "For your security, please don't share passwords, PINs, card numbers or verification codes here. " +
        "I can't collect that kind of information. How else can I help?",
      handoffSuggested: false,
      blocked: true,
    };
  }

  const kbText = kbToText(kb);
  const businessName = (kb && kb.businessName) || (bot && bot.name) || "this business";

  if (!AI_ENABLED) {
    const answer = faqFallback(kb, userMessage);
    return { reply: answer || HANDOFF_LINE, handoffSuggested: !answer };
  }

  const systemPrompt = `You are ${bot.name}, an automated assistant for ${businessName} inside TeamCal.
ALWAYS identify yourself as an automated assistant. NEVER claim or imply that you are a human.
Tone: ${bot.tone || "warm and professional"}. Reply language: ${bot.language || "English"}.

Answer ONLY using the Knowledge Base below. If the answer is not in it, or you are unsure,
say so plainly and offer to connect the person with a human — do not guess or invent details.
Never ask for or accept passwords, PINs, card numbers, CVV/CVC, or one-time verification codes.
Keep replies concise (2-5 sentences). No markdown headers, no bullet lists.

=== KNOWLEDGE BASE ===
${kbText || "(empty)"}
=== END KNOWLEDGE BASE ===`;

  const convo = history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
    .join("\n");
  const prompt = `${systemPrompt}\n\n${convo}\nCustomer: ${userMessage}\nAssistant:`;

  try {
    const result = await model.generateContent([prompt]);
    const reply = result.response.text().trim();
    const handoffSuggested = /connect you with a person|connect you with a human|speak (to|with) (a|someone)/i.test(reply);
    return { reply: reply || HANDOFF_LINE, handoffSuggested };
  } catch (err) {
    const answer = faqFallback(kb, userMessage);
    return { reply: answer || HANDOFF_LINE, handoffSuggested: !answer };
  }
}

module.exports = { generateBotReply, containsProhibited, kbToText, AI_ENABLED };
