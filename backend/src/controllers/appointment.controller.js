const { supabase } = require("../config/supabase");

/** GET /api/appointments */
async function getAppointments(req, res, next) {
  try {
    let query = supabase
      .from("appointments")
      .select("*")
      .eq("user_id", req.user.id);

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    const { data: appointments, error } = await query.order("ts", { ascending: false });

    if (error) throw error;
    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
}

/** POST /api/appointments */
async function book(req, res, next) {
  try {
    const { proId, proName, proRole, type, ts, duration, notes } = req.body;
    const { data: appt, error } = await supabase
      .from("appointments")
      .insert({
        user_id: req.user.id,
        pro_id: proId,
        pro_name: proName,
        pro_role: proRole,
        type,
        ts,
        duration,
        notes: notes || "",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, appointment: appt });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/appointments/:id */
async function updateAppointment(req, res, next) {
  try {
    const allowed = ["type", "ts", "duration", "notes", "status"];
    const patch = Object.fromEntries(
      allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    const { data: appt, error } = await supabase
      .from("appointments")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/appointments/:id */
async function cancelAppointment(req, res, next) {
  try {
    const { data: appt, error } = await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, appointment: appt });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAppointments, book, updateAppointment, cancelAppointment };
