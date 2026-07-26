const { supabase } = require("../config/supabase");

/** GET /api/blogs/sites */
async function getMySites(req, res, next) {
  try {
    const { data: sites, error } = await supabase
      .from("blog_sites")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, sites });
  } catch (err) {
    next(err);
  }
}

/** POST /api/blogs/sites */
async function createSite(req, res, next) {
  try {
    const b = req.body;
    const { data: site, error } = await supabase
      .from("blog_sites")
      .insert({
        user_id: req.user.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        language: b.language || "English",
        country: b.country || "US",
        description: b.description || "",
        logo: b.logo,
        cover: b.cover,
        theme: b.theme || "clean",
        writing_style: b.writingStyle || b.writing_style || "",
        ai_prefs: b.aiPrefs || b.ai_prefs || "",
        monetizations: b.monetizations || [],
        auto_blog_enabled: b.autoBlog?.enabled ?? b.auto_blog_enabled ?? false,
        auto_blog_frequency: b.autoBlog?.frequency ?? b.auto_blog_frequency ?? "weekly",
        auto_blog_topics: b.autoBlog?.topics ?? b.auto_blog_topics,
        auto_blog_tone: b.autoBlog?.tone ?? b.auto_blog_tone,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, site });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/blogs/sites/:id */
async function updateSite(req, res, next) {
  try {
    const allowed = [
      "name", "slug", "category", "language", "country", "description", "logo", "cover",
      "theme", "writing_style", "ai_prefs", "monetizations", "auto_blog_enabled",
      "auto_blog_frequency", "auto_blog_topics", "auto_blog_tone",
    ];
    const patch = Object.fromEntries(
      allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    const { data: site, error } = await supabase
      .from("blog_sites")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!site) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, site });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/blogs/sites/:id */
async function deleteSite(req, res, next) {
  try {
    await supabase
      .from("blog_sites")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/blogs/articles */
async function getArticles(req, res, next) {
  try {
    let query = supabase
      .from("articles")
      .select("*")
      .eq("user_id", req.user.id);

    if (req.params.blogId) {
      query = query.eq("blog_id", req.params.blogId);
    }

    const { data: articles, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, articles });
  } catch (err) {
    next(err);
  }
}

/** POST /api/blogs/articles */
async function createArticle(req, res, next) {
  try {
    const b = req.body;
    const wordCount = (b.body || "").replace(/<[^>]+>/g, "").split(/\s+/).length;
    const readMinutes = Math.max(1, Math.round(wordCount / 220));

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        user_id: req.user.id,
        blog_id: b.blogId || b.blog_id,
        title: b.title,
        cover: b.cover,
        body: b.body || "",
        category: b.category,
        tags: b.tags || [],
        status: b.status || "draft",
        scheduled_for: b.scheduledFor || b.scheduled_for,
        read_minutes: readMinutes,
        daily: Array(90).fill(0),
        daily_earn: Array(90).fill(0),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, article });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/blogs/articles/:id */
async function updateArticle(req, res, next) {
  try {
    const allowed = ["blog_id", "title", "cover", "body", "category", "tags", "status", "scheduled_for"];
    const patch = Object.fromEntries(
      allowed.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }
    if (patch.body) {
      const wordCount = patch.body.replace(/<[^>]+>/g, "").split(/\s+/).length;
      patch.read_minutes = Math.max(1, Math.round(wordCount / 220));
    }

    const { data: article, error } = await supabase
      .from("articles")
      .update(patch)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!article) return res.status(404).json({ success: false, message: "Article not found" });
    res.json({ success: true, article });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/blogs/articles/:id */
async function deleteArticle(req, res, next) {
  try {
    await supabase
      .from("articles")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/blogs/articles/:id/view */
async function recordView(req, res, next) {
  try {
    const { data: article, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !article) return res.status(404).json({ success: false, message: "Not found" });

    const newDaily = [...(article.daily || [])];
    newDaily[89] = (newDaily[89] || 0) + 1;

    const earned = 0.005;
    const newDailyEarn = [...(article.daily_earn || [])];
    newDailyEarn[89] = (newDailyEarn[89] || 0) + earned;

    await supabase
      .from("articles")
      .update({
        views: (article.views || 0) + 1,
        earned: (article.earned || 0) + earned,
        daily: newDaily,
        daily_earn: newDailyEarn,
      })
      .eq("id", req.params.id);

    res.json({ success: true, views: (article.views || 0) + 1 });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMySites, createSite, updateSite, deleteSite, getArticles, createArticle, updateArticle, deleteArticle, recordView };
