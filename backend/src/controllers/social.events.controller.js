const { supabase } = require("../config/supabase");

/**
 * GET /api/social/live
 * Returns active live streams (proxies /api/live for the social tab).
 */
async function getLiveStreams(req, res, next) {
  try {
    const { data: streams, error } = await supabase
      .from("live_streams")
      .select("*, host:host_id (id, name, avatar, verified)")
      .eq("status", "live")
      .order("viewer_count", { ascending: false })
      .limit(30);
    if (error) throw error;
    res.json({ success: true, streams: streams || [] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/social/events
 * Returns upcoming social events.
 */
async function getEvents(req, res, next) {
  try {
    const now = new Date().toISOString();
    const { data: events, error } = await supabase
      .from("social_events")
      .select("*, host:host_id (id, name, avatar, verified)")
      .gte("starts_at", now)
      .eq("status", "upcoming")
      .order("starts_at", { ascending: true })
      .limit(50);
    if (error) throw error;

    // Attach registration count + whether the current user is registered
    const eventIds = (events || []).map((e) => e.id);
    let registrationMap = {};
    let userRegSet = new Set();

    if (eventIds.length) {
      const { data: regs } = await supabase
        .from("social_event_registrations")
        .select("event_id, user_id")
        .in("event_id", eventIds);

      (regs || []).forEach((r) => {
        registrationMap[r.event_id] = (registrationMap[r.event_id] || 0) + 1;
        if (r.user_id === req.user.id) userRegSet.add(r.event_id);
      });
    }

    const enriched = (events || []).map((e) => ({
      ...e,
      registrations_count: registrationMap[e.id] || 0,
      registered: userRegSet.has(e.id),
    }));

    res.json({ success: true, events: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/events/:eventId/register
 * Toggle registration for a social event.
 */
async function registerEvent(req, res, next) {
  try {
    const { eventId } = req.params;

    const { data: event, error: eventError } = await supabase
      .from("social_events")
      .select("id, title, capacity, status")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (event.status !== "upcoming") {
      return res.status(400).json({ success: false, message: "Event is not open for registration" });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("social_event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (existing) {
      // Unregister
      await supabase
        .from("social_event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", req.user.id);
      return res.json({ success: true, registered: false });
    }

    // Check capacity
    if (event.capacity) {
      const { count } = await supabase
        .from("social_event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (count >= event.capacity) {
        return res.status(409).json({ success: false, message: "This event is full" });
      }
    }

    const { error: insertError } = await supabase
      .from("social_event_registrations")
      .insert({ event_id: eventId, user_id: req.user.id });
    if (insertError) throw insertError;

    res.status(201).json({ success: true, registered: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLiveStreams, getEvents, registerEvent };
