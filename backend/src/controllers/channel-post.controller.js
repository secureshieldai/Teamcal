const { supabase } = require('../config/supabase');
const botHooks = require('../services/bot.hooks');

/**
 * Create a post in a channel
 */
async function createPost(req, res) {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    const { content_type, text_content, media_url, link_url, link_title, link_image, poll_data, poll_ends_at, is_announcement } = req.body;

    const { data: post, error } = await supabase
      .from('channel_posts')
      .insert({
        channel_id: channelId,
        author_id: userId,
        content_type,
        text_content,
        media_url,
        link_url,
        link_title,
        link_image,
        poll_data,
        poll_ends_at,
        is_announcement: is_announcement || false,
      })
      .select(`
        *,
        author:users!channel_posts_author_id_fkey(id, name, avatar)
      `)
      .single();

    if (error) throw error;

    await botHooks.onContentPosted({
      spaceType: 'channel',
      spaceId: channelId,
      authorId: userId,
      text: text_content || link_title || '',
      entityId: post.id,
    });

    res.status(201).json({ data: post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get a single post
 */
async function getPost(req, res) {
  try {
    const { postId } = req.params;

    const { data: post, error } = await supabase
      .from('channel_posts')
      .select(`
        *,
        author:users!channel_posts_author_id_fkey(id, name, avatar),
        channel:channels(id, name, username, avatar)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    await supabase
      .from('channel_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', postId);

    res.json({ data: post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update a post
 */
async function updatePost(req, res) {
  try {
    const { postId } = req.params;
    const updates = req.body;

    // Don't allow updating stats
    delete updates.view_count;
    delete updates.reaction_count;
    delete updates.comment_count;
    delete updates.share_count;

    const { data: post, error } = await supabase
      .from('channel_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data: post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete a post
 */
async function deletePost(req, res) {
  try {
    const { postId } = req.params;

    const { error } = await supabase
      .from('channel_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Pin a post
 */
async function pinPost(req, res) {
  try {
    const { postId } = req.params;

    const { data, error } = await supabase
      .from('channel_posts')
      .update({ is_pinned: true })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Post pinned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Unpin a post
 */
async function unpinPost(req, res) {
  try {
    const { postId } = req.params;

    const { data, error } = await supabase
      .from('channel_posts')
      .update({ is_pinned: false })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Post unpinned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Add a reaction to a post
 */
async function addReaction(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    console.log('[addReaction] Request:', { postId, userId, emoji });

    const validEmojis = ['👍', '❤️', '😂', '🙏', '😢', '😮', '🔥'];
    if (!validEmojis.includes(emoji)) {
      console.log('[addReaction] Invalid emoji:', emoji);
      return res.status(400).json({ message: 'Invalid emoji' });
    }

    // Check if user already reacted
    const { data: existing } = await supabase
      .from('channel_post_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    let wasUpdate = false;
    if (existing) {
      // Update existing reaction
      const { error: updateError } = await supabase
        .from('channel_post_reactions')
        .update({ emoji })
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      wasUpdate = true;
    } else {
      // Insert new reaction
      const { error: insertError } = await supabase
        .from('channel_post_reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          emoji,
        });
      
      if (insertError) throw insertError;
    }

    // Update reaction count on post
    const { data: reactions } = await supabase
      .from('channel_post_reactions')
      .select('id')
      .eq('post_id', postId);

    const reactionCount = reactions?.length || 0;

    await supabase
      .from('channel_posts')
      .update({ reaction_count: reactionCount })
      .eq('id', postId);

    console.log('[addReaction] Success:', { wasUpdate, reactionCount });
    res.json({ message: 'Reaction added', reactionCount });
  } catch (error) {
    console.error('[addReaction] Error:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Remove a reaction from a post
 */
async function removeReaction(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    console.log('[removeReaction] Request:', { postId, userId });

    const { error } = await supabase
      .from('channel_post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update reaction count on post
    const { data: reactions } = await supabase
      .from('channel_post_reactions')
      .select('id')
      .eq('post_id', postId);

    const reactionCount = reactions?.length || 0;

    await supabase
      .from('channel_posts')
      .update({ reaction_count: reactionCount })
      .eq('id', postId);

    console.log('[removeReaction] Success:', { reactionCount });
    res.json({ message: 'Reaction removed', reactionCount });
  } catch (error) {
    console.error('[removeReaction] Error:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get comments for a post
 */
async function getComments(req, res) {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: comments, error } = await supabase
      .from('channel_post_comments')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('post_id', postId)
      .is('parent_id', null) // Top-level comments only
      .order('created_at', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Get replies for each comment
    for (const comment of comments || []) {
      const { data: replies } = await supabase
        .from('channel_post_comments')
        .select(`
          *,
          user:users(id, name, avatar)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      
      comment.replies = replies || [];
    }

    res.json({ data: comments || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Add a comment to a post
 */
async function addComment(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { content, parent_id } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const { data: comment, error } = await supabase
      .from('channel_post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        parent_id: parent_id || null,
        content: content.trim(),
      })
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ data: comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update a comment
 */
async function updateComment(req, res) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const { data: comment, error } = await supabase
      .from('channel_post_comments')
      .update({ content: content.trim() })
      .eq('id', commentId)
      .eq('user_id', req.user.id) // Only author can edit
      .select()
      .single();

    if (error) throw error;

    res.json({ data: comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete a comment
 */
async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // User can delete their own comment or moderators/admins can delete any
    const { error } = await supabase
      .from('channel_post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Report a channel
 */
async function reportChannel(req, res) {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    const { reason, details } = req.body;

    const { data: report, error } = await supabase
      .from('channel_reports')
      .insert({
        channel_id: channelId,
        reporter_id: userId,
        reason,
        details: details || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data: report, message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Report a post
 */
async function reportPost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { reason, details } = req.body;

    const { data: report, error } = await supabase
      .from('channel_reports')
      .insert({
        post_id: postId,
        reporter_id: userId,
        reason,
        details: details || '',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data: report, message: 'Report submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createPost,
  getPost,
  updatePost,
  deletePost,
  pinPost,
  unpinPost,
  addReaction,
  removeReaction,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  reportChannel,
  reportPost,
};
