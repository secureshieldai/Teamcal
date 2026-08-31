const { supabase } = require('../config/supabase');

/**
 * Create a new channel
 */
async function createChannel(req, res) {
  try {
    const userId = req.user.id;
    const { name, username, description, avatar, cover_image, category, rules, is_public, allow_comments, allow_reactions, allow_sharing, allow_downloads } = req.body;

    // Validate username uniqueness
    const { data: existing } = await supabase
      .from('channels')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create channel
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        owner_id: userId,
        name,
        username,
        description: description || '',
        avatar,
        cover_image,
        category: category || 'general',
        rules: rules || '',
        is_public: is_public !== false,
        allow_comments: allow_comments !== false,
        allow_reactions: allow_reactions !== false,
        allow_sharing: allow_sharing !== false,
        allow_downloads: allow_downloads || false,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-follow own channel as owner
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: userId,
      role: 'owner',
      can_post: true,
      can_edit: true,
      can_delete: true,
      can_pin: true,
      can_moderate: true,
      can_manage: true,
    });

    res.status(201).json({ data: channel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channel by ID
 */
async function getChannel(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: channel, error } = await supabase
      .from('channels')
      .select(`
        *,
        owner:users!channels_owner_id_fkey(id, name, avatar)
      `)
      .eq('id', id)
      .single();

    if (error || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user is following
    let isFollowing = false;
    let memberRole = null;
    if (userId) {
      const { data: member } = await supabase
        .from('channel_members')
        .select('role')
        .eq('channel_id', id)
        .eq('user_id', userId)
        .single();
      
      if (member) {
        isFollowing = true;
        memberRole = member.role;
      }
    }

    res.json({ data: { ...channel, isFollowing, memberRole } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update channel
 */
async function updateChannel(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating owner_id or stats through this endpoint
    delete updates.owner_id;
    delete updates.follower_count;
    delete updates.post_count;
    delete updates.is_monetized;
    delete updates.monetization_approved_at;

    const { data: channel, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data: channel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete channel
 */
async function deleteChannel(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Follow a channel
 */
async function followChannel(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already following
    const { data: existing } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', id)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Already following this channel' });
    }

    const { data, error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: id,
        user_id: userId,
        role: 'follower',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Successfully followed channel' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Unfollow a channel
 */
async function unfollowChannel(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Successfully unfollowed channel' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get user's own channels
 */
async function getMyChannels(req, res) {
  try {
    const userId = req.user.id;

    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data: channels || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channels user is following
 */
async function getFollowingChannels(req, res) {
  try {
    const userId = req.user.id;

    const { data: memberships, error } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        channels (*)
      `)
      .eq('user_id', userId)
      .order('followed_at', { ascending: false });

    if (error) throw error;

    const channels = memberships?.map(m => m.channels) || [];
    res.json({ data: channels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Discover channels (recommended, trending, new)
 */
async function discoverChannels(req, res) {
  try {
    const { type = 'recommended', limit = 20 } = req.query;

    let query = supabase
      .from('channels')
      .select('*')
      .eq('is_public', true)
      .limit(parseInt(limit));

    if (type === 'trending') {
      query = query.order('follower_count', { ascending: false }).order('post_count', { ascending: false });
    } else if (type === 'new') {
      query = query.order('created_at', { ascending: false });
    } else if (type === 'popular') {
      query = query.order('follower_count', { ascending: false });
    } else {
      // Recommended: mix of follower count and recent activity
      query = query.order('created_at', { ascending: false });
    }

    const { data: channels, error } = await query;

    if (error) throw error;

    res.json({ data: channels || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get trending channels
 */
async function getTrending(req, res) {
  try {
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_public', true)
      .order('follower_count', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({ data: channels || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Search channels
 */
async function searchChannels(req, res) {
  try {
    const { q, category, limit = 20 } = req.query;

    let query = supabase
      .from('channels')
      .select('*')
      .eq('is_public', true);

    if (q) {
      query = query.or(`name.ilike.%${q}%,username.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('follower_count', { ascending: false }).limit(parseInt(limit));

    const { data: channels, error } = await query;

    if (error) throw error;

    res.json({ data: channels || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channels by category
 */
async function getByCategory(req, res) {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_public', true)
      .eq('category', category)
      .order('follower_count', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ data: channels || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channel posts (feed)
 */
async function getChannelPosts(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: posts, error } = await supabase
      .from('channel_posts')
      .select(`
        *,
        author:users!channel_posts_author_id_fkey(id, name, avatar)
      `)
      .eq('channel_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ data: posts || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channel followers
 */
async function getFollowers(req, res) {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: members, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('channel_id', id)
      .order('followed_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ data: members || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channel admins
 */
async function getAdmins(req, res) {
  try {
    const { id } = req.params;

    const { data: admins, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('channel_id', id)
      .in('role', ['owner', 'admin', 'moderator'])
      .order('role');

    if (error) throw error;

    res.json({ data: admins || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Add admin/moderator
 */
async function addAdmin(req, res) {
  try {
    const { id } = req.params;
    const { user_id, role, permissions } = req.body;

    if (!['admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin or moderator' });
    }

    const { data, error } = await supabase
      .from('channel_members')
      .upsert({
        channel_id: id,
        user_id,
        role,
        ...permissions,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Admin added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Remove admin/moderator
 */
async function removeAdmin(req, res) {
  try {
    const { id, userId } = req.params;

    const { error } = await supabase
      .from('channel_members')
      .update({ role: 'follower', can_post: false, can_edit: false, can_delete: false, can_pin: false, can_moderate: false, can_manage: false })
      .eq('channel_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update admin permissions
 */
async function updateAdminPermissions(req, res) {
  try {
    const { id, userId } = req.params;
    const permissions = req.body;

    const { data, error } = await supabase
      .from('channel_members')
      .update(permissions)
      .eq('channel_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Permissions updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Ban user from channel
 */
async function banUser(req, res) {
  try {
    const { id, userId } = req.params;

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // TODO: Add to banned_users table if needed

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Unban user
 */
async function unbanUser(req, res) {
  try {
    // TODO: Implement banned_users table
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update channel settings
 */
async function updateSettings(req, res) {
  try {
    const { id } = req.params;
    const { allow_comments, allow_reactions, allow_sharing, allow_downloads, is_public } = req.body;

    const { data, error } = await supabase
      .from('channels')
      .update({
        allow_comments,
        allow_reactions,
        allow_sharing,
        allow_downloads,
        is_public,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Transfer channel ownership
 */
async function transferOwnership(req, res) {
  try {
    const { id } = req.params;
    const { new_owner_id } = req.body;

    // Update channel owner
    const { error: channelError } = await supabase
      .from('channels')
      .update({ owner_id: new_owner_id })
      .eq('id', id);

    if (channelError) throw channelError;

    // Update old owner to admin
    await supabase
      .from('channel_members')
      .update({ role: 'admin' })
      .eq('channel_id', id)
      .eq('user_id', req.user.id);

    // Update new owner
    await supabase
      .from('channel_members')
      .upsert({
        channel_id: id,
        user_id: new_owner_id,
        role: 'owner',
        can_post: true,
        can_edit: true,
        can_delete: true,
        can_pin: true,
        can_moderate: true,
        can_manage: true,
      });

    res.json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createChannel,
  getChannel,
  updateChannel,
  deleteChannel,
  followChannel,
  unfollowChannel,
  getMyChannels,
  getFollowingChannels,
  discoverChannels,
  getTrending,
  searchChannels,
  getByCategory,
  getChannelPosts,
  getFollowers,
  getAdmins,
  addAdmin,
  removeAdmin,
  updateAdminPermissions,
  banUser,
  unbanUser,
  updateSettings,
  transferOwnership,
};
