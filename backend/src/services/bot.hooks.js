// ============================================================
// Bot event hooks — called from existing controllers.
// Every export is wrapped so a failure NEVER breaks the host action.
// ============================================================
const { supabase } = require("../config/supabase");
const { notifySafely } = require("./notification.service");

const dmConversationId = (a, b) => [a, b].sort().join(":");

async function logEvent(botId, type, meta = {}) {
  try {
    await supabase.from("bot_events").insert({ bot_id: botId, type, meta });
  } catch (err) {
    console.error("bot logEvent failed:", err.message);
  }
}

/** All active bots connected to a given space. */
async function botsForSpace(spaceType, spaceId) {
  const { data, error } = await supabase
    .from("bot_space_connections")
    .select("bot_id, bots!inner(id, owner_id, name, status, welcome_message)")
    .eq("space_type", spaceType)
    .eq("space_id", spaceId);
  if (error) throw error;
  return (data || [])
    .map((row) => row.bots)
    .filter((b) => b && b.status === "active");
}

async function automationsFor(botIds, kind) {
  if (!botIds.length) return [];
  const { data, error } = await supabase
    .from("bot_automations")
    .select("*")
    .in("bot_id", botIds)
    .eq("kind", kind)
    .eq("enabled", true);
  if (error) throw error;
  return data || [];
}

/**
 * A new member joined a channel/community — send welcome DM + onboarding
 * from any connected bot that has the automation enabled.
 */
async function onMemberJoined({ spaceType, spaceId, spaceName, memberId }) {
  try {
    if (!memberId) return;
    const bots = await botsForSpace(spaceType, spaceId);
    if (!bots.length) return;
    const botIds = bots.map((b) => b.id);
    const welcomeAutos = await automationsFor(botIds, "welcome_dm");
    const onboardingAutos = await automationsFor(botIds, "onboarding");

    for (const bot of bots) {
      const welcome = welcomeAutos.find((a) => a.bot_id === bot.id);
      const onboarding = onboardingAutos.find((a) => a.bot_id === bot.id);
      if (!welcome && !onboarding) continue;

      const text =
        (welcome && (welcome.config?.message || bot.welcome_message)) ||
        bot.welcome_message ||
        `Welcome to ${spaceName || "the community"}!`;

      // Deliver as a direct message from the bot owner (shows in the member's inbox).
      await supabase.from("tracker_entries").insert({
        user_id: bot.owner_id,
        tracker: "direct-message",
        ts: Date.now(),
        value: 0,
        meta: {
          conversationId: dmConversationId(bot.owner_id, memberId),
          recipientId: memberId,
          text,
          status: "accepted",
          read: false,
          botId: bot.id,
        },
      });
      notifySafely(memberId, "message", `${bot.name}`, text, { actorId: bot.owner_id, botId: bot.id });

      if (onboarding && onboarding.config?.steps) {
        for (const step of onboarding.config.steps) {
          if (!step) continue;
          notifySafely(memberId, "message", `${bot.name}`, String(step), { actorId: bot.owner_id, botId: bot.id });
        }
      }
      await logEvent(bot.id, "member_welcomed", { spaceType, spaceId, memberId });
    }
  } catch (err) {
    console.error("onMemberJoined hook failed:", err.message);
  }
}

const DEFAULT_SPAM_WORDS = ["free money", "click here", "crypto giveaway", "work from home", "buy followers"];

function looksSpammy(text, config = {}) {
  const value = String(text || "").toLowerCase();
  if (!value) return null;
  const words = [...DEFAULT_SPAM_WORDS, ...((config.prohibited_words || []).map((w) => String(w).toLowerCase()))];
  const hit = words.find((w) => w && value.includes(w));
  if (hit) return `prohibited phrase "${hit}"`;
  const links = (value.match(/https?:\/\//g) || []).length;
  if (links >= (config.max_links || 4)) return `${links} links`;
  if (/(.)\1{9,}/.test(value)) return "repeated characters";
  return null;
}

/**
 * A post/comment was created in a space — run spam detection for connected bots.
 * Returns { flagged: boolean, reason?: string }.
 */
async function onContentPosted({ spaceType, spaceId, spaceName, authorId, text, entityId }) {
  try {
    const bots = await botsForSpace(spaceType, spaceId);
    if (!bots.length) return { flagged: false };
    const botIds = bots.map((b) => b.id);
    const autos = await automationsFor(botIds, "spam_detect");
    if (!autos.length) return { flagged: false };

    for (const auto of autos) {
      const reason = looksSpammy(text, auto.config || {});
      if (!reason) continue;
      const bot = bots.find((b) => b.id === auto.bot_id);
      notifySafely(
        bot.owner_id,
        "moderation",
        `${bot.name}: possible spam`,
        `Flagged in ${spaceName || spaceType}: ${reason}`,
        { botId: bot.id, entityId, authorId }
      );
      await logEvent(bot.id, "action_completed", { kind: "spam_detect", reason, spaceType, spaceId, entityId });
      if (auto.config?.auto_remove) return { flagged: true, reason, remove: true };
      return { flagged: true, reason };
    }
    return { flagged: false };
  } catch (err) {
    console.error("onContentPosted hook failed:", err.message);
    return { flagged: false };
  }
}

/**
 * A report / suspicious activity was raised in a space — notify admins via connected bots.
 */
async function onReport({ spaceType, spaceId, spaceName, reason, entityId }) {
  try {
    const bots = await botsForSpace(spaceType, spaceId);
    if (!bots.length) return;
    const botIds = bots.map((b) => b.id);
    const autos = await automationsFor(botIds, "notify_admins");
    for (const auto of autos) {
      const bot = bots.find((b) => b.id === auto.bot_id);
      notifySafely(
        bot.owner_id,
        "moderation",
        `${bot.name}: new report`,
        `${spaceName || spaceType}: ${reason || "content reported"}`,
        { botId: bot.id, entityId }
      );
      await logEvent(bot.id, "action_completed", { kind: "notify_admins", spaceType, spaceId, entityId });
    }
  } catch (err) {
    console.error("onReport hook failed:", err.message);
  }
}

module.exports = { onMemberJoined, onContentPosted, onReport, logEvent, looksSpammy };
