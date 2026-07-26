const { supabase } = require("../config/supabase");

/** GET /api/shopping */
async function getItems(req, res, next) {
  try {
    const { data: items, error } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", req.user.id)
      .order("ts", { ascending: false });

    if (error) throw error;
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

/** POST /api/shopping */
async function addItem(req, res, next) {
  try {
    const { name, qty, source } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "name is required" });

    const { data: item, error } = await supabase
      .from("shopping_items")
      .insert({
        user_id: req.user.id,
        name,
        qty: qty || null,
        source: source || "manual",
        ts: Date.now(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

/** POST /api/shopping/bulk */
async function bulkAdd(req, res, next) {
  try {
    const raw = req.body.items || [];
    const docs = raw.map((i) => ({
      user_id: req.user.id,
      name: i.name,
      qty: i.qty || null,
      source: i.source || "manual",
      ts: Date.now(),
    }));

    const { data: items, error } = await supabase
      .from("shopping_items")
      .insert(docs)
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/shopping/:id */
async function updateItem(req, res, next) {
  try {
    const allowed = ["name", "qty", "source", "checked"];
    const patch = Object.fromEntries(
      allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    const { data: item, error } = await supabase
      .from("shopping_items")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/shopping/:id */
async function deleteItem(req, res, next) {
  try {
    await supabase
      .from("shopping_items")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/shopping/checked */
async function clearChecked(req, res, next) {
  try {
    await supabase
      .from("shopping_items")
      .delete()
      .eq("user_id", req.user.id)
      .eq("checked", true);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getItems, addItem, bulkAdd, updateItem, deleteItem, clearChecked };
