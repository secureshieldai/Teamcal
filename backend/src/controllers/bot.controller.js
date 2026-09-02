const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { generateBotReply } = require("../services/botEngine.service");
const { logEvent } = require("../services/bot.hooks");
const { notifySafely } = require("../services/notification.service");

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  "conversation_started", "lead_collected", "message_sent", "member_welcomed",
  "question_answered", "human_handoff", "link_click", "action_completed", "automation_failed",
];

const AUTOMATION_KINDS = [
  "welcome_dm", "onboarding", "faq", "announcement", "reminder", "poll",
  "recommend_resource", "spam_detect", "notify_admins", "confirm_membership",
  "manage_access", "collect_replies", "escalate",
];

const PERMISSION_KEYS = [
  "send_dms", "publish_announcements", "view_member_info", "create_polls",
  "moderate_content", "access_resources", "manage_membership_access",
  "collect_lead_info", "display_products", "open_checkout", "notify_admins",
];

async function getOwnedBot(userId, botId) {
  const { data, error } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function makeSlug(name) {
  const base =
    String(name || "bot")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28) || "bot";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base}-${crypto.randomBytes(2).toString("hex")}`;
    const { data } = await supabase.from("bots").select("id").eq("public_slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomBytes(4).toString("hex")}`;
}

function sanitizePermissions(input = {}) {
  const out = {};
  for (const key of PERMISSION_KEYS) out[key] = Boolean(input[key]);
  return out;
}

async function analyticsForBot(botId, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("bot_events")
    .select("type")
    .eq("bot_id", botId)
    .gte("created_at", since);
  if (error) throw error;
  const counts = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0]));
  for (const row of data || []) counts[row.type] = (counts[row.type] || 0) + 1;
  return {
    days,
    conversationsStarted: counts.conversation_started,
    leadsCollected: counts.lead_collected,
    messagesSent: counts.message_sent,
    membersWelcomed: counts.member_welcomed,
    questionsAnswered: counts.question_answered,
    humanHandoffs: counts.human_handoff,
    linkClicks: counts.link_click,
    actionsCompleted: counts.action_completed,
    failedAutomations: counts.automation_failed,
  };
}

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────
async function createBot(req, res) {
  try {
    const userId = req.user.id;
    const b = req.body || {};
    const type = b.type === "conversational" ? "conversational" : "space";
    if (!b.name || !String(b.name).trim()) {
      return res.status(400).json({ message: "Bot name is required" });
    }

    const row = {
      owner_id: userId,
      type,
      name: String(b.name).trim().slice(0, 80),
      avatar: b.avatar || null,
      description: (b.description || "").slice(0, 500),
      purpose: (b.purpose || "").slice(0, 500),
      welcome_message: (b.welcome_message || "").slice(0, 1000),
      tone: b.tone || "Warm & professional",
      language: b.language || "English",
      status: "draft",
      public_slug: type === "conversational" ? await makeSlug(b.name) : null,
      knowledge_base: b.knowledge_base && typeof b.knowledge_base === "object" ? b.knowledge_base : {},
      permissions: sanitizePermissions(b.permissions),
      settings: b.settings && typeof b.settings === "object" ? b.settings : { notify_on_error: true },
    };

    const { data: bot, error } = await supabase.from("bots").insert(row).select().single();
    if (error) throw error;

    // Space connections
    if (Array.isArray(b.connections) && b.connections.length) {
      const conns = b.connections
        .filter((c) => c && c.space_id && (c.space_type === "channel" || c.space_type === "community"))
        .map((c) => ({
          bot_id: bot.id,
          space_type: c.space_type,
          space_id: c.space_id,
          space_name: (c.space_name || "").slice(0, 120),
        }));
      if (conns.length) await supabase.from("bot_space_connections").insert(conns);
    }

    // Automations
    if (Array.isArray(b.automations)) {
      const autos = b.automations
        .filter((a) => a && AUTOMATION_KINDS.includes(a.kind))
        .map((a) => ({
          bot_id: bot.id,
          kind: a.kind,
          enabled: Boolean(a.enabled),
          config: a.config && typeof a.config === "object" ? a.config : {},
        }));
      if (autos.length) await supabase.from("bot_automations").insert(autos);
    }

    // Sequence
    if (Array.isArray(b.sequence) && b.sequence.length) {
      await supabase.from("bot_sequences").insert({ bot_id: bot.id, name: "Default sequence", steps: b.sequence });
    }

    res.status(201).json({ data: bot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function listBots(req, res) {
  try {
    const { data: bots, error } = await supabase
      .from("bots")
      .select("*, connections:bot_space_connections(space_type, space_id, space_name)")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const withStats = await Promise.all(
      (bots || []).map(async (bot) => ({ ...bot, stats: await analyticsForBot(bot.id, 30) }))
    );
    res.json({ data: withStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getBot(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const [conns, autos, seq] = await Promise.all([
      supabase.from("bot_space_connections").select("*").eq("bot_id", bot.id),
      supabase.from("bot_automations").select("*").eq("bot_id", bot.id),
      supabase.from("bot_sequences").select("*").eq("bot_id", bot.id).maybeSingle(),
    ]);
    res.json({
      data: {
        ...bot,
        connections: conns.data || [],
        automations: autos.data || [],
        sequence: seq.data ? seq.data.steps : [],
        stats: await analyticsForBot(bot.id, 30),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function updateBot(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const b = req.body || {};
    const patch = {};
    for (const key of ["name", "avatar", "description", "purpose", "welcome_message", "tone", "language"]) {
      if (b[key] !== undefined) patch[key] = b[key];
    }
    if (b.knowledge_base && typeof b.knowledge_base === "object") patch.knowledge_base = b.knowledge_base;
    if (b.permissions && typeof b.permissions === "object") patch.permissions = sanitizePermissions(b.permissions);
    if (b.settings && typeof b.settings === "object") patch.settings = b.settings;

    const { data, error } = await supabase.from("bots").update(patch).eq("id", bot.id).select().single();
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteBot(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { error } = await supabase.from("bots").delete().eq("id", bot.id);
    if (error) throw error;
    res.json({ data: { deleted: true } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function setStatus(req, res, status) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { data, error } = await supabase.from("bots").update({ status }).eq("id", bot.id).select().single();
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
const activateBot = (req, res) => setStatus(req, res, "active");
const pauseBot = (req, res) => setStatus(req, res, "paused");

// ─────────────────────────────────────────────────────────────
// analytics / activity
// ─────────────────────────────────────────────────────────────
async function getAnalytics(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    res.json({ data: await analyticsForBot(bot.id, days) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getActivity(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const { data, error } = await supabase
      .from("bot_events")
      .select("*")
      .eq("bot_id", bot.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// spaces the creator owns/manages (searchable checklist source)
// ─────────────────────────────────────────────────────────────
async function getSpaces(req, res) {
  try {
    const userId = req.user.id;
    const [channelsOwned, channelsAdmin, groups] = await Promise.all([
      supabase.from("channels").select("id, name, avatar").eq("owner_id", userId),
      supabase
        .from("channel_members")
        .select("channel_id, role, channels(id, name, avatar)")
        .eq("user_id", userId)
        .in("role", ["owner", "admin"]),
      supabase.from("groups").select("id, name, cover, metadata, created_by").eq("created_by", userId),
    ]);

    const channelMap = new Map();
    (channelsOwned.data || []).forEach((c) => channelMap.set(c.id, { space_type: "channel", space_id: c.id, space_name: c.name, avatar: c.avatar }));
    (channelsAdmin.data || []).forEach((row) => {
      const c = row.channels;
      if (c && !channelMap.has(c.id)) channelMap.set(c.id, { space_type: "channel", space_id: c.id, space_name: c.name, avatar: c.avatar });
    });

    const communities = (groups.data || []).map((g) => ({
      space_type: "community",
      space_id: g.id,
      space_name: g.name,
      avatar: g.cover || null,
      is_membership: Boolean(g.metadata && g.metadata.membership),
    }));

    res.json({ data: { channels: [...channelMap.values()], communities } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function setConnections(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const list = Array.isArray(req.body.connections) ? req.body.connections : [];
    await supabase.from("bot_space_connections").delete().eq("bot_id", bot.id);
    const rows = list
      .filter((c) => c && c.space_id && (c.space_type === "channel" || c.space_type === "community"))
      .map((c) => ({ bot_id: bot.id, space_type: c.space_type, space_id: c.space_id, space_name: (c.space_name || "").slice(0, 120) }));
    if (rows.length) {
      const { error } = await supabase.from("bot_space_connections").insert(rows);
      if (error) throw error;
    }
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// automations / sequence / knowledge
// ─────────────────────────────────────────────────────────────
async function getAutomations(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { data, error } = await supabase.from("bot_automations").select("*").eq("bot_id", bot.id);
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function putAutomations(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const list = Array.isArray(req.body.automations) ? req.body.automations : [];
    const rows = list
      .filter((a) => a && AUTOMATION_KINDS.includes(a.kind))
      .map((a) => ({
        bot_id: bot.id,
        kind: a.kind,
        enabled: Boolean(a.enabled),
        config: a.config && typeof a.config === "object" ? a.config : {},
      }));
    if (!rows.length) return res.json({ data: [] });
    // upsert by (bot_id, kind)
    const { data, error } = await supabase
      .from("bot_automations")
      .upsert(rows, { onConflict: "bot_id,kind" })
      .select();
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getSequence(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { data } = await supabase.from("bot_sequences").select("*").eq("bot_id", bot.id).maybeSingle();
    res.json({ data: data ? data.steps : [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function putSequence(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const steps = Array.isArray(req.body.steps) ? req.body.steps : [];
    const { data, error } = await supabase
      .from("bot_sequences")
      .upsert({ bot_id: bot.id, name: "Default sequence", steps }, { onConflict: "bot_id,name" })
      .select()
      .single();
    if (error) throw error;
    res.json({ data: data.steps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getKnowledge(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    res.json({ data: bot.knowledge_base || {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function putKnowledge(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const kb = req.body && typeof req.body === "object" ? req.body.knowledge_base || req.body : {};
    const { data, error } = await supabase
      .from("bots")
      .update({ knowledge_base: kb })
      .eq("id", bot.id)
      .select("knowledge_base")
      .single();
    if (error) throw error;
    res.json({ data: data.knowledge_base });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// conversations / inbox / handoff
// ─────────────────────────────────────────────────────────────
async function ownsConversation(userId, conversationId) {
  const { data } = await supabase
    .from("bot_conversations")
    .select("*, bots!inner(id, owner_id, name)")
    .eq("id", conversationId)
    .maybeSingle();
  if (!data || data.bots.owner_id !== userId) return null;
  return data;
}

async function listConversations(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    let query = supabase
      .from("bot_conversations")
      .select("*")
      .eq("bot_id", bot.id)
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (req.query.status) query = query.eq("status", req.query.status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getConversation(req, res) {
  try {
    const convo = await ownsConversation(req.user.id, req.params.cid);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const [messages, lead, notes] = await Promise.all([
      supabase.from("bot_messages").select("*").eq("conversation_id", convo.id).order("created_at", { ascending: true }),
      supabase.from("bot_leads").select("*").eq("conversation_id", convo.id).maybeSingle(),
      supabase.from("bot_notes").select("*").eq("conversation_id", convo.id).order("created_at", { ascending: true }),
    ]);
    res.json({ data: { conversation: convo, messages: messages.data || [], lead: lead.data || null, notes: notes.data || [] } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function setHandoff(req, res, active) {
  try {
    const convo = await ownsConversation(req.user.id, req.params.cid);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    await supabase
      .from("bot_conversations")
      .update({ handoff_active: active, assigned_admin_id: active ? req.user.id : null, status: active ? "open" : convo.status })
      .eq("id", convo.id);
    await supabase.from("bot_messages").insert({
      conversation_id: convo.id,
      role: "system",
      content: active
        ? `${req.user.name || "A team member"} has joined the conversation.`
        : "You're chatting with the automated assistant again.",
      meta: { handoff: active },
    });
    if (active) await logEvent(convo.bot_id, "human_handoff", { conversationId: convo.id });
    res.json({ data: { handoff_active: active } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function adminSendMessage(req, res) {
  try {
    const convo = await ownsConversation(req.user.id, req.params.cid);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ message: "Message is required" });
    const { data, error } = await supabase
      .from("bot_messages")
      .insert({ conversation_id: convo.id, role: "admin", content, meta: { adminId: req.user.id } })
      .select()
      .single();
    if (error) throw error;
    await supabase.from("bot_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", convo.id);
    await logEvent(convo.bot_id, "message_sent", { conversationId: convo.id, by: "admin" });
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function addNote(req, res) {
  try {
    const convo = await ownsConversation(req.user.id, req.params.cid);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const note = String(req.body.note || "").trim();
    if (!note) return res.status(400).json({ message: "Note is required" });
    const { data, error } = await supabase
      .from("bot_notes")
      .insert({ conversation_id: convo.id, admin_id: req.user.id, note })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function setConversationStatus(req, res) {
  try {
    const convo = await ownsConversation(req.user.id, req.params.cid);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const status = ["open", "resolved", "follow_up"].includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ message: "Invalid status" });
    const { data, error } = await supabase
      .from("bot_conversations")
      .update({ status })
      .eq("id", convo.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function listLeads(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { data, error } = await supabase
      .from("bot_leads")
      .select("*")
      .eq("bot_id", bot.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// test (owner) — runs the same engine as the public chat
// ─────────────────────────────────────────────────────────────
async function testBot(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ message: "Message is required" });
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const result = await generateBotReply({ bot, kb: bot.knowledge_base || {}, history, userMessage: message });
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// "Run now" — manual execution of one automation
// ─────────────────────────────────────────────────────────────
async function runAutomation(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { data: auto } = await supabase
      .from("bot_automations")
      .select("*")
      .eq("id", req.params.aid)
      .eq("bot_id", bot.id)
      .maybeSingle();
    if (!auto) return res.status(404).json({ message: "Automation not found" });

    const { data: conns } = await supabase.from("bot_space_connections").select("*").eq("bot_id", bot.id);

    if (auto.kind === "announcement" || auto.kind === "reminder") {
      const text = String(auto.config?.message || req.body.message || "").trim();
      if (!text) return res.status(400).json({ message: "Nothing to send — set a message first" });
      let sent = 0;
      for (const conn of conns || []) {
        if (conn.space_type === "channel") {
          await supabase.from("channel_posts").insert({
            channel_id: conn.space_id,
            author_id: bot.owner_id,
            content_type: "text",
            text_content: text,
            is_announcement: auto.kind === "announcement",
          });
          sent++;
        } else {
          await supabase.from("posts").insert({
            user_id: bot.owner_id,
            community: conn.space_id,
            text,
          });
          sent++;
        }
      }
      await logEvent(bot.id, "action_completed", { kind: auto.kind, sent });
      return res.json({ data: { ran: auto.kind, sent } });
    }

    // Everything else: log an execution so analytics/activity reflect it.
    await logEvent(bot.id, "action_completed", { kind: auto.kind, manual: true });
    res.json({ data: { ran: auto.kind } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// process-due — release scheduled announcements / reminders
// ─────────────────────────────────────────────────────────────
async function processDue(req, res) {
  try {
    const nowIso = new Date().toISOString();
    let query = supabase
      .from("bot_scheduled_items")
      .select("*, bots!inner(id, owner_id, status)")
      .eq("status", "pending")
      .lte("scheduled_for", nowIso)
      .limit(50);
    // If called by a normal user, only their bots' items.
    if (req.user) query = query.eq("bots.owner_id", req.user.id);
    const { data: items, error } = await query;
    if (error) throw error;

    let processed = 0;
    for (const item of items || []) {
      try {
        if (item.bots.status !== "active") {
          await supabase.from("bot_scheduled_items").update({ status: "canceled", processed_at: nowIso }).eq("id", item.id);
          continue;
        }
        const { data: conns } = await supabase.from("bot_space_connections").select("*").eq("bot_id", item.bot_id);
        const text = String(item.payload?.message || "").trim();
        for (const conn of conns || []) {
          if (Array.isArray(item.targets) && item.targets.length && !item.targets.includes(conn.id)) continue;
          if (conn.space_type === "channel") {
            await supabase.from("channel_posts").insert({
              channel_id: conn.space_id,
              author_id: item.bots.owner_id,
              content_type: "text",
              text_content: text,
              is_announcement: item.kind === "announcement",
            });
          } else {
            await supabase.from("posts").insert({ user_id: item.bots.owner_id, community: conn.space_id, text });
          }
        }
        await supabase.from("bot_scheduled_items").update({ status: "sent", processed_at: nowIso }).eq("id", item.id);
        await logEvent(item.bot_id, "action_completed", { kind: item.kind, scheduled: true });
        processed++;
      } catch (itemErr) {
        await supabase
          .from("bot_scheduled_items")
          .update({ status: "failed", processed_at: nowIso, error: itemErr.message })
          .eq("id", item.id);
        await logEvent(item.bot_id, "automation_failed", { kind: item.kind, error: itemErr.message });
      }
    }
    res.json({ data: { processed, found: (items || []).length } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function scheduleItem(req, res) {
  try {
    const bot = await getOwnedBot(req.user.id, req.params.id);
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    const { kind, message, scheduled_for, targets } = req.body || {};
    if (!["announcement", "reminder"].includes(kind)) return res.status(400).json({ message: "Invalid kind" });
    const when = new Date(scheduled_for);
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: "Invalid schedule time" });
    const { data, error } = await supabase
      .from("bot_scheduled_items")
      .insert({
        bot_id: bot.id,
        kind,
        payload: { message: String(message || "").slice(0, 2000) },
        targets: Array.isArray(targets) ? targets : [],
        scheduled_for: when.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC (no auth) — conversational bot chat
// ─────────────────────────────────────────────────────────────
async function publicGetBot(req, res) {
  try {
    const { data, error } = await supabase
      .from("bots")
      .select("id, name, avatar, description, type, status, welcome_message")
      .eq("public_slug", req.params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.type !== "conversational" || data.status !== "active") {
      return res.status(404).json({ message: "Bot not available" });
    }
    res.json({
      data: {
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        disclosure: "You're chatting with an automated assistant, not a human.",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function publicBotBySlug(slug) {
  const { data } = await supabase.from("bots").select("*").eq("public_slug", slug).maybeSingle();
  if (!data || data.type !== "conversational" || data.status !== "active") return null;
  return data;
}

const CONSENT_TEXT =
  "To help you better, this assistant may collect your name and contact details. " +
  "It will only use them to follow up about your enquiry. You can ask it to stop or delete your details at any time.";

async function publicStartSession(req, res) {
  try {
    const bot = await publicBotBySlug(req.params.slug);
    if (!bot) return res.status(404).json({ message: "Bot not available" });
    const leadKey = crypto.randomBytes(16).toString("hex");
    const { data: convo, error } = await supabase
      .from("bot_conversations")
      .insert({ bot_id: bot.id, channel: "public", lead_key: leadKey, status: "open" })
      .select()
      .single();
    if (error) throw error;

    const welcome =
      bot.welcome_message || `Hi! I'm ${bot.name}, an automated assistant. How can I help you today?`;
    await supabase.from("bot_messages").insert([
      { conversation_id: convo.id, role: "system", content: "You're chatting with an automated assistant, not a human." },
      { conversation_id: convo.id, role: "bot", content: welcome },
    ]);
    await logEvent(bot.id, "conversation_started", { conversationId: convo.id });

    res.status(201).json({
      data: {
        conversationId: convo.id,
        leadKey,
        consentText: CONSENT_TEXT,
        messages: [
          { role: "system", content: "You're chatting with an automated assistant, not a human." },
          { role: "bot", content: welcome },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function loadPublicConvo(slug, conversationId) {
  const bot = await publicBotBySlug(slug);
  if (!bot) return {};
  const { data: convo } = await supabase
    .from("bot_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("bot_id", bot.id)
    .maybeSingle();
  return { bot, convo };
}

async function publicSendMessage(req, res) {
  try {
    const { conversationId, message } = req.body || {};
    const { bot, convo } = await loadPublicConvo(req.params.slug, conversationId);
    if (!bot || !convo) return res.status(404).json({ message: "Conversation not found" });
    if (convo.stopped) return res.status(403).json({ message: "This conversation has been stopped." });
    const text = String(message || "").trim();
    if (!text) return res.status(400).json({ message: "Message is required" });

    await supabase.from("bot_messages").insert({ conversation_id: convo.id, role: "user", content: text.slice(0, 2000) });

    // Human is handling this conversation — don't auto-reply.
    if (convo.handoff_active) {
      await supabase.from("bot_conversations").update({ last_message_at: new Date().toISOString(), status: "open" }).eq("id", convo.id);
      return res.json({ data: { reply: null, handoff: true } });
    }

    const { data: history } = await supabase
      .from("bot_messages")
      .select("role, content")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(20);

    const result = await generateBotReply({
      bot,
      kb: bot.knowledge_base || {},
      history: (history || []).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      userMessage: text,
    });

    await supabase.from("bot_messages").insert({
      conversation_id: convo.id,
      role: "bot",
      content: result.reply,
      meta: { handoffSuggested: result.handoffSuggested },
    });
    await supabase
      .from("bot_conversations")
      .update({ last_message_at: new Date().toISOString(), status: result.handoffSuggested ? "follow_up" : convo.status })
      .eq("id", convo.id);
    await logEvent(bot.id, "message_sent", { conversationId: convo.id, by: "bot" });
    await logEvent(bot.id, "question_answered", { conversationId: convo.id });

    res.json({ data: { reply: result.reply, handoffSuggested: result.handoffSuggested } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function publicCollectLead(req, res) {
  try {
    const { conversationId, name, email, phone, consent, fields } = req.body || {};
    const { bot, convo } = await loadPublicConvo(req.params.slug, conversationId);
    if (!bot || !convo) return res.status(404).json({ message: "Conversation not found" });
    if (!consent) return res.status(400).json({ message: "Consent is required before saving details" });

    const { data, error } = await supabase
      .from("bot_leads")
      .upsert(
        {
          bot_id: bot.id,
          conversation_id: convo.id,
          name: name ? String(name).slice(0, 120) : null,
          email: email ? String(email).slice(0, 160) : null,
          phone: phone ? String(phone).slice(0, 40) : null,
          fields: fields && typeof fields === "object" ? fields : {},
          consent: true,
          consent_text: CONSENT_TEXT,
        },
        { onConflict: "conversation_id" }
      )
      .select()
      .single();
    if (error) throw error;
    await logEvent(bot.id, "lead_collected", { conversationId: convo.id });
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function publicRequestHandoff(req, res) {
  try {
    const { conversationId } = req.body || {};
    const { bot, convo } = await loadPublicConvo(req.params.slug, conversationId);
    if (!bot || !convo) return res.status(404).json({ message: "Conversation not found" });
    await supabase.from("bot_conversations").update({ status: "follow_up" }).eq("id", convo.id);
    await supabase.from("bot_messages").insert({
      conversation_id: convo.id,
      role: "system",
      content: "Your request to speak with a person has been sent. Someone will reply here soon.",
    });
    notifySafely(bot.owner_id, "bot", `${bot.name}: human requested`, "A visitor asked to speak with a person.", {
      botId: bot.id,
      conversationId: convo.id,
    });
    await logEvent(bot.id, "human_handoff", { conversationId: convo.id, requestedByUser: true });
    res.json({ data: { requested: true } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function publicStop(req, res) {
  try {
    const { conversationId, deleteData, report, reason } = req.body || {};
    const { bot, convo } = await loadPublicConvo(req.params.slug, conversationId);
    if (!bot || !convo) return res.status(404).json({ message: "Conversation not found" });
    await supabase.from("bot_conversations").update({ stopped: true, status: "resolved" }).eq("id", convo.id);
    if (deleteData) {
      await supabase.from("bot_leads").delete().eq("conversation_id", convo.id);
    }
    if (report) {
      notifySafely(bot.owner_id, "bot", `${bot.name}: reported`, String(reason || "A visitor reported this bot."), {
        botId: bot.id,
        conversationId: convo.id,
      });
    }
    res.json({ data: { stopped: true, deleted: Boolean(deleteData) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function publicPoll(req, res) {
  try {
    const { conversationId, after } = req.query;
    const { bot, convo } = await loadPublicConvo(req.params.slug, conversationId);
    if (!bot || !convo) return res.status(404).json({ message: "Conversation not found" });
    let query = supabase
      .from("bot_messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true });
    if (after) query = query.gt("created_at", after);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: { messages: data || [], handoff_active: convo.handoff_active, stopped: convo.stopped } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createBot, listBots, getBot, updateBot, deleteBot, activateBot, pauseBot,
  getAnalytics, getActivity, getSpaces, setConnections,
  getAutomations, putAutomations, getSequence, putSequence, getKnowledge, putKnowledge,
  listConversations, getConversation,
  takeover: (req, res) => setHandoff(req, res, true),
  returnToBot: (req, res) => setHandoff(req, res, false),
  adminSendMessage, addNote, setConversationStatus, listLeads,
  testBot, runAutomation, processDue, scheduleItem,
  publicGetBot, publicStartSession, publicSendMessage, publicCollectLead,
  publicRequestHandoff, publicStop, publicPoll,
};
