const { supabase } = require("../config/supabase");
const { notifySafely } = require("../services/notification.service");
const { uploadPublicImage } = require("../services/storage.service");

async function enrichPosts(posts,userId){const ids=(posts||[]).map(x=>x.id);if(!ids.length)return posts||[];const [{data:comments},{data:likes}]=await Promise.all([supabase.from('post_comments').select('post_id').in('post_id',ids),supabase.from('post_likes').select('post_id,user_id').in('post_id',ids)]);const commentCounts={};const likeCounts={};(comments||[]).forEach(x=>commentCounts[x.post_id]=(commentCounts[x.post_id]||0)+1);(likes||[]).forEach(x=>likeCounts[x.post_id]=(likeCounts[x.post_id]||0)+1);return posts.map(x=>({...x,likes:likeCounts[x.id]||0,comments_count:commentCounts[x.id]||0,liked:(likes||[]).some(l=>l.post_id===x.id&&l.user_id===userId)}));}

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
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const url = await uploadPublicImage("posts", req.user.id, req.file);
    res.json({ success: true, url });
  } catch (err) {
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

/** GET /api/posts/feed?limit=20&skip=0 */
async function getFeed(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = Number(req.query.skip) || 0;

    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        user:user_id (
          id, name, avatar, verified
        )
      `)
      .is("deleted_at", null)
      .or("community.is.null,community.neq.story")
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;
    res.json({ success: true, posts:await enrichPosts(posts,req.user.id) });
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
    const { count: newLikes, error: countError } = await supabase.from("post_likes")
      .select("*", { count: "exact", head: true }).eq("post_id", post.id);
    if (countError) throw countError;
    await supabase.from("posts").update({ likes: newLikes || 0 }).eq("id", post.id);

    if (!alreadyLiked && post.user_id !== uid) {
      notifySafely(post.user_id, "like", "New like", "Someone liked your post.", { actorId: uid, entityId: post.id });
    }

    res.json({ success: true, likes: newLikes || 0, liked: !alreadyLiked });
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
