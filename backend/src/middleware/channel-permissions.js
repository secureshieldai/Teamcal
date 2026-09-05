const { supabase } = require('../config/supabase');

/**
 * Check if user is channel owner
 */
async function channelOwner(req, res, next) {
  try {
    const channelId = req.params.id || req.params.channelId;
    const userId = req.user.id;

    const { data: channel, error } = await supabase
      .from('channels')
      .select('owner_id')
      .eq('id', channelId)
      .single();

    if (error || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.owner_id !== userId) {
      return res.status(403).json({ message: 'Only channel owner can perform this action' });
    }

    req.channel = channel;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Check if user is channel admin or owner
 */
async function channelAdmin(req, res, next) {
  try {
    const channelId = req.params.id || req.params.channelId;
    const userId = req.user.id;

    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('owner_id')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Owner has all permissions
    if (channel.owner_id === userId) {
      req.channel = channel;
      req.isOwner = true;
      return next();
    }

    // Check if user is admin or moderator
    const { data: member, error: memberError } = await supabase
      .from('channel_members')
      .select('role, can_post, can_edit, can_delete, can_pin, can_moderate, can_manage')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member || (member.role !== 'admin' && member.role !== 'moderator')) {
      return res.status(403).json({ message: 'Admin or moderator access required' });
    }

    req.channel = channel;
    req.member = member;
    req.isOwner = false;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Check specific permission (e.g., can_post, can_edit)
 */
function channelPermission(permission) {
  return async (req, res, next) => {
    try {
      const channelId = req.params.channelId;
      const userId = req.user.id;

      console.log(`[ChannelPermission] Checking ${permission} for user ${userId} in channel ${channelId}`);

      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('owner_id')
        .eq('id', channelId)
        .single();

      if (channelError || !channel) {
        console.log('[ChannelPermission] Channel not found:', channelError);
        return res.status(404).json({ message: 'Channel not found' });
      }

      // Owner has all permissions
      if (channel.owner_id === userId) {
        console.log('[ChannelPermission] User is channel owner, granting permission');
        req.channel = channel;
        req.isOwner = true;
        return next();
      }

      // Check member permissions
      const { data: member, error: memberError } = await supabase
        .from('channel_members')
        .select(`role, ${permission}`)
        .eq('channel_id', channelId)
        .eq('user_id', userId)
        .single();

      console.log('[ChannelPermission] Member data:', member, 'Error:', memberError);

      if (memberError || !member) {
        console.log('[ChannelPermission] User is not a channel member');
        return res.status(403).json({ message: 'Not a channel member. Please join or follow the channel first.' });
      }

      if (!member[permission] && member.role !== 'admin') {
        console.log(`[ChannelPermission] User does not have ${permission} permission`);
        return res.status(403).json({ message: `Permission denied: ${permission}. Contact channel admin for access.` });
      }

      console.log('[ChannelPermission] Permission granted');
      req.channel = channel;
      req.member = member;
      req.isOwner = false;
      next();
    } catch (error) {
      console.error('[ChannelPermission] Error:', error);
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = {
  channelOwner,
  channelAdmin,
  channelPermission,
};
