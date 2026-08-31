const { supabase } = require("../config/supabase");

/**
 * GET /api/showcase/:userId
 * Get published showcase sections for a user (public)
 */
async function getUserShowcase(req, res, next) {
  try {
    const { userId } = req.params;
    const { data: sections, error } = await supabase
      .from("showcase_sections")
      .select("*, items:showcase_items(*)")
      .eq("user_id", userId)
      .eq("published", true)
      .order("item_order", { ascending: true });

    if (error) throw error;

    // Filter to only published items
    const filtered = sections.map(s => ({
      ...s,
      items: s.items.filter(i => i.published),
    })).filter(s => s.items.length > 0);

    res.json({ success: true, sections: filtered });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/showcase (protected)
 * Get all showcase sections for current user
 */
async function getCurrentUserShowcase(req, res, next) {
  try {
    const { data: sections, error } = await supabase
      .from("showcase_sections")
      .select("*, items:showcase_items(*)")
      .eq("user_id", req.user.id)
      .order("item_order", { ascending: true });

    if (error) throw error;

    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/showcase/sections
 * Create a new showcase section
 */
async function createSection(req, res, next) {
  try {
    const b = req.body;
    if (!b.title) {
      return res.status(400).json({ success: false, message: "title is required" });
    }

    const { data: sections } = await supabase
      .from("showcase_sections")
      .select("id")
      .eq("user_id", req.user.id)
      .order("item_order", { ascending: false })
      .limit(1);

    const nextOrder = (sections?.[0]?.item_order || 0) + 1;

    const { data: section, error } = await supabase
      .from("showcase_sections")
      .insert({
        user_id: req.user.id,
        title: b.title,
        description: b.description || "",
        layout: b.layout || "grid",
        published: Boolean(b.published),
        item_order: nextOrder,
      })
      .select("*, items:showcase_items(*)")
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, section });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/showcase/sections/:id
 * Update a showcase section
 */
async function updateSection(req, res, next) {
  try {
    const allowed = ["title", "description", "layout", "published"];
    const patch = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });

    const { data: section, error } = await supabase
      .from("showcase_sections")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("*, items:showcase_items(*)")
      .single();

    if (error) throw error;
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/showcase/sections/:id
 * Delete a showcase section and its items
 */
async function deleteSection(req, res, next) {
  try {
    const { error } = await supabase
      .from("showcase_sections")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/showcase/items
 * Add an item to a showcase section
 */
async function addItem(req, res, next) {
  try {
    const b = req.body;
    if (!b.sectionId || !b.title || !b.contentType) {
      return res.status(400).json({ success: false, message: "sectionId, title, and contentType are required" });
    }

    // Verify section belongs to user
    const { data: section } = await supabase
      .from("showcase_sections")
      .select("id")
      .eq("id", b.sectionId)
      .eq("user_id", req.user.id)
      .single();

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    // Get next item order
    const { data: items } = await supabase
      .from("showcase_items")
      .select("id")
      .eq("section_id", b.sectionId)
      .order("item_order", { ascending: false })
      .limit(1);

    const nextOrder = (items?.[0]?.item_order || 0) + 1;

    const { data: item, error } = await supabase
      .from("showcase_items")
      .insert({
        section_id: b.sectionId,
        content_id: b.contentId || null,
        content_type: b.contentType,
        title: b.title,
        description: b.description || "",
        cover_image: b.coverImage || null,
        thumbnail: b.thumbnail || null,
        price: b.price || null,
        access_label: b.accessLabel || null,
        action_label: b.actionLabel || "View",
        action_url: b.actionUrl,
        published: Boolean(b.published),
        item_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/showcase/items/:id
 * Update a showcase item
 */
async function updateItem(req, res, next) {
  try {
    const patch = {};
    const mapping = {
      title: "title",
      description: "description",
      coverImage: "cover_image",
      thumbnail: "thumbnail",
      price: "price",
      accessLabel: "access_label",
      actionLabel: "action_label",
      actionUrl: "action_url",
      published: "published",
    };

    Object.entries(mapping).forEach(([camel, snake]) => {
      if (req.body[camel] !== undefined) {
        patch[snake] = req.body[camel];
      }
    });

    const { data: item, error } = await supabase
      .from("showcase_items")
      .update(patch)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/showcase/items/:id
 * Delete a showcase item
 */
async function deleteItem(req, res, next) {
  try {
    const { error } = await supabase
      .from("showcase_items")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/showcase/reorder
 * Reorder sections and items
 */
async function reorderItems(req, res, next) {
  try {
    const items = req.body.items || [];

    // Batch update item orders
    for (let i = 0; i < items.length; i++) {
      await supabase
        .from("showcase_items")
        .update({ item_order: i })
        .eq("id", items[i].id);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserShowcase,
  getCurrentUserShowcase,
  createSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem,
  reorderItems,
};
