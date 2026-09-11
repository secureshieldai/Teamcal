const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");
const { uploadPublicImage, uploadPublicVideo } = require("../services/storage.service");

/**
 * Attach engagement info to a page of posts.
 *
 * `posts.likes` and `posts.comments_count` are denormalized counters kept up to
 * date by DB triggers (migration 020), so we read them straight off the row.
 * The only per-request lookup is which of these posts the current user liked,
 * and that is bounded to the page size (<=50 rows) via the (user_id, post_id)
 * index. The previous version fetched every like row and every comment row for
 * the page, which grew with total engagement and made the feed take tens of
 * seconds once posts accumulated activity.
 */
async function enrichPosts(posts, userId) {
  const list = posts || [];
  if (!list.length) return list;
  const ids = list.map((x) => x.id);
  const { data: myLikes, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", ids);
  if (error) throw error;
  const likedIds = new Set((myLikes || []).map((x) => x.post_id));
  return list.map((x) => ({
    ...x,
    likes: x.likes || 0,
    comments_count: x.comments_count || 0,
    liked: likedIds.has(x.id),
  }));
}

/** POST /api/posts */
async function createPost(req, res, next) {
  try {
    const isStory = req.body.community === "story";
    const images = Array.isArray(req.body.images)
      ? req.body.images.filter((url) => typeof url === "string" && url.trim()).slice(0, 10)
      : (req.body.image ? [req.body.image] : []);
    if (Array.isArray(req.body.images) && req.body.images.length > 10) {
      return res.status(400).json({ success: false, message: "A post can contain at most 10 images" });
    }
    if (isStory && images.length !== 1) {
      return res.status(400).json({ success: false, message: "A story requires exactly one image" });
    }
    if (isStory) {
      const { error: replaceError } = await supabase
        .from("posts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", req.user.id)
        .eq("community", "story")
        .is("deleted_at", null);
      if (replaceError) throw replaceError;
    }
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: req.user.id,
        text: req.body.text || "",
        image: images[0] || null,
        image_urls: images,
        video: req.body.video || null,
        community: isStory ? "story" : (req.body.community || null),
        community_cover: req.body.communityCover || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Award XP for first post
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .is("deleted_at", null);

    if (count === 1) {
      const { data: user } = await supabase.from("users").select("xp, coins").eq("id", req.user.id).single();
      await supabase.from("users").update({ xp: (user.xp || 0) + 50, coins: (user.coins || 0) + 10 }).eq("id", req.user.id);
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
}

/** POST /api/posts/image */
async function uploadPostImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const url = await uploadPublicImage("posts", req.user.id, req.file);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
}

/** POST /api/posts/video */
async function uploadPostVideo(req, res, next) {
  try {
    console.log('[uploadPostVideo] Request received');
    console.log('[uploadPostVideo] Has file:', !!req.file);
    console.log('[uploadPostVideo] Has body:', !!req.body);
    console.log('[uploadPostVideo] Content-Type:', req.headers['content-type']);
    
    if (req.file) {
      console.log('[uploadPostVideo] File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    }
    
    if (!req.file) {
      console.log('[uploadPostVideo] No file received');
      return res.status(400).json({ success: false, message: "No file" });
    }
    
    const url = await uploadPublicVideo("posts", req.user.id, req.file);
    console.log('[uploadPostVideo] Upload successful, URL:', url);
    res.json({ success: true, url });
  } catch (err) {
    console.error('[uploadPostVideo] Error:', err);
    next(err);
  }
}

/** GET /api/posts/mine */
async function myPosts(req, res, next) {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, user:user_id (id, name, avatar, verified)")
      .eq("user_id", req.user.id)
      .is("deleted_at", null)
      .or("community.is.null,community.neq.story")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, posts:await enrichPosts(posts,req.user.id) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/posts/user/:id — any user's public post grid, for their profile page */
async function getUserPosts(req, res, next) {
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*, user:user_id (id, name, avatar, verified)")
      .eq("user_id", req.params.id)
      .is("deleted_at", null)
      .or("community.is.null,community.neq.story")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;
    res.json({ success: true, posts: await enrichPosts(posts, req.user.id) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/posts/feed?limit=20&before=<ISO timestamp>
 *
 * Keyset pagination: pass the `created_at` of the last row you have as `before`
 * to get the next page. This scans the (created_at desc) partial index straight
 * to the cursor, unlike `skip`/OFFSET which re-reads and discards every earlier
 * row on each page. `skip` is still honored for older clients.
 *
 * `community IS NULL` = top-level posts only. Group posts (community = group id)
 * have their own /groups/:id/activity feed which enforces private-group
 * membership, so they must not surface here; stories (community = 'story') are
 * excluded by the same clause. This also lets the planner use the
 * `idx_posts_feed` partial index instead of the non-sargable OR/neq it replaces.
 */
async function getFeed(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? new Date(req.query.before) : null;
    const hasBefore = before && !Number.isNaN(before.getTime());
    const skip = Number(req.query.skip) || 0;

    let query = supabase
      .from("posts")
      .select(`
        *,
        user:user_id (
          id, name, avatar, verified
        )
      `)
      .is("deleted_at", null)
      .is("community", null)
      .order("created_at", { ascending: false });

    if (hasBefore) {
      query = query.lt("created_at", before.toISOString()).limit(limit);
    } else {
      query = query.range(skip, skip + limit - 1);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    res.json({ success: true, posts: await enrichPosts(posts, req.user.id) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/posts/:id/like */
async function likePost(req, res, next) {
  try {
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", req.params.id)
      .is("deleted_at", null)
      .single();

    if (error || !post) return res.status(404).json({ success: false, message: "Post not found" });

    const uid = req.user.id;
    const { data: existingLike, error: likeLookupError } = await supabase.from("post_likes")
      .select("post_id").eq("post_id", post.id).eq("user_id", uid).maybeSingle();
    if (likeLookupError) throw likeLookupError;
    const alreadyLiked = Boolean(existingLike);
    if (alreadyLiked) {
      const { error: unlikeError } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", uid);
      if (unlikeError) throw unlikeError;
    } else {
      const { error: likeError } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: uid });
      if (likeError) throw likeError;
    }
    // posts.likes is maintained by the trg_post_likes_count trigger (migration
    // 020); just read the fresh value back for the response.
    const { data: fresh, error: freshError } = await supabase.from("posts")
      .select("likes").eq("id", post.id).single();
    if (freshError) throw freshError;
    const newLikes = fresh?.likes || 0;

    if (!alreadyLiked && post.user_id !== uid) {
      notifySafely(post.user_id, "like", "New like", "Someone liked your post.", { actorId: uid, entityId: post.id });
    }

    res.json({ success: true, likes: newLikes, liked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/posts/:id */
async function deletePost(req, res, next) {
  try {
    await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const { data: post } = await supabase.from("posts").select("id").eq("id", req.params.id).is("deleted_at", null).maybeSingle();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const { data, error } = await supabase.from("post_comments")
      .select("*, user:user_id (id, name, avatar)").eq("post_id", req.params.id)
      .order("created_at", { ascending: true }).limit(200);
    if (error) throw error;
    const comments = (data || []).map(comment => ({ ...comment, ts: new Date(comment.created_at).getTime(), meta: { postId: comment.post_id, text: comment.body } }));
    res.json({ success: true, comments });
  } catch (err) { next(err); }
}

async function addComment(req, res, next) {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Comment text is required" });
    if (text.length > 2000) return res.status(400).json({ success: false, message: "Comment must be 2000 characters or fewer" });
    const { data: post } = await supabase.from("posts").select("id, user_id").eq("id", req.params.id).is("deleted_at", null).single();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const { data, error } = await supabase.from("post_comments").insert({ user_id: req.user.id, post_id: post.id, body: text }).select("*, user:user_id (id, name, avatar)").single();
    if (error) throw error;
    const comment = { ...data, ts: new Date(data.created_at).getTime(), meta: { postId: data.post_id, text: data.body } };
    if (post.user_id !== req.user.id) notifySafely(post.user_id, "comment", "New comment", text, { actorId: req.user.id, entityId: post.id });
    res.status(201).json({ success: true, comment });
  } catch (err) { next(err); }
}

async function deleteComment(req, res, next) {
  try { const { error } = await supabase.from("post_comments").delete().eq("id", req.params.commentId).eq("post_id", req.params.id).eq("user_id", req.user.id); if (error) throw error; res.json({ success: true }); }
  catch (err) { next(err); }
}

module.exports = { createPost, uploadPostImage, uploadPostVideo, myPosts, getUserPosts, getFeed, likePost, deletePost, getComments, addComment, deleteComment, enrichPosts };
