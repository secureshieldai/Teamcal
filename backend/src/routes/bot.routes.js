const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const bot = require("../controllers/bot.controller");

const router = express.Router();

// Stricter limit for the unauthenticated public chat endpoints.
const publicLimit = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.BOT_PUBLIC_RATE_LIMIT_MAX) || 30,
  message: { message: "Too many requests. Please slow down." },
});

// ─── Public (no auth) ────────────────────────────────────────
router.get("/public/:slug", publicLimit, bot.publicGetBot);
router.post("/public/:slug/session", publicLimit, bot.publicStartSession);
router.post("/public/:slug/message", publicLimit, bot.publicSendMessage);
router.post("/public/:slug/lead", publicLimit, bot.publicCollectLead);
router.post("/public/:slug/handoff", publicLimit, bot.publicRequestHandoff);
router.post("/public/:slug/stop", publicLimit, bot.publicStop);
router.get("/public/:slug/poll", publicLimit, bot.publicPoll);

// ─── Authenticated ───────────────────────────────────────────
router.use(protect);

router.get("/spaces", bot.getSpaces);
router.post("/process-due", bot.processDue);

router.post("/", bot.createBot);
router.get("/", bot.listBots);

router.get("/conversations/:cid", bot.getConversation);
router.post("/conversations/:cid/takeover", bot.takeover);
router.post("/conversations/:cid/return", bot.returnToBot);
router.post("/conversations/:cid/messages", bot.adminSendMessage);
router.post("/conversations/:cid/notes", bot.addNote);
router.put("/conversations/:cid/status", bot.setConversationStatus);

router.get("/:id", bot.getBot);
router.put("/:id", bot.updateBot);
router.delete("/:id", bot.deleteBot);
router.post("/:id/activate", bot.activateBot);
router.post("/:id/pause", bot.pauseBot);

router.get("/:id/analytics", bot.getAnalytics);
router.get("/:id/activity", bot.getActivity);
router.put("/:id/connections", bot.setConnections);
router.get("/:id/automations", bot.getAutomations);
router.put("/:id/automations", bot.putAutomations);
router.get("/:id/sequence", bot.getSequence);
router.put("/:id/sequence", bot.putSequence);
router.get("/:id/knowledge", bot.getKnowledge);
router.put("/:id/knowledge", bot.putKnowledge);
router.get("/:id/conversations", bot.listConversations);
router.get("/:id/leads", bot.listLeads);
router.post("/:id/test", bot.testBot);
router.post("/:id/schedule", bot.scheduleItem);
router.post("/:id/automations/:aid/run", bot.runAutomation);

module.exports = router;
