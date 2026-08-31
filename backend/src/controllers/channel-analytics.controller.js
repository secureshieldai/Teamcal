const { supabase } = require('../config/supabase');

/**
 * Get channel analytics (30 days)
 */
async function getAnalytics(req, res) {
  try {
    const { channelId } = req.params;

    // Check if channel has 100+ followers
    const { data: channel } = await supabase
      .from('channels')
      .select('follower_count')
      .eq('id', channelId)
      .single();

    if (!channel || channel.follower_count < 100) {
      return res.status(403).json({ 
        message: 'Analytics available after reaching 100 followers',
        follower_count: channel?.follower_count || 0
      });
    }

    // Get last 30 days of analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics, error } = await supabase
      .from('channel_analytics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Calculate totals
    const totals = (analytics || []).reduce(
      (acc, day) => ({
        new_followers: acc.new_followers + day.new_followers,
        unfollows: acc.unfollows + day.unfollows,
        post_views: acc.post_views + day.post_views,
        reactions: acc.reactions + day.reactions,
        comments: acc.comments + day.comments,
        shares: acc.shares + day.shares,
      }),
      { new_followers: 0, unfollows: 0, post_views: 0, reactions: 0, comments: 0, shares: 0 }
    );

    const net_followers = totals.new_followers - totals.unfollows;
    const engagement_rate = totals.post_views > 0 
      ? ((totals.reactions + totals.comments) / totals.post_views * 100).toFixed(2)
      : 0;

    res.json({
      data: {
        daily: analytics || [],
        totals: {
          ...totals,
          net_followers,
          engagement_rate: parseFloat(engagement_rate),
        },
        current_followers: channel.follower_count,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get top performing posts
 */
async function getTopPosts(req, res) {
  try {
    const { channelId } = req.params;
    const { limit = 10 } = req.query;

    const { data: posts, error } = await supabase
      .from('channel_posts')
      .select(`
        id,
        text_content,
        content_type,
        view_count,
        reaction_count,
        comment_count,
        share_count,
        created_at
      `)
      .eq('channel_id', channelId)
      .order('view_count', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ data: posts || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get audience insights
 */
async function getAudienceInsights(req, res) {
  try {
    const { channelId } = req.params;

    // Get followers with user demographics
    const { data: members, error } = await supabase
      .from('channel_members')
      .select(`
        user:users(age, gender)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;

    // Calculate demographics
    const demographics = {
      total: members?.length || 0,
      age_groups: {},
      gender: { male: 0, female: 0, other: 0 },
    };

    (members || []).forEach(({ user }) => {
      if (user) {
        // Age groups
        if (user.age) {
          const ageGroup = Math.floor(user.age / 10) * 10;
          const key = `${ageGroup}-${ageGroup + 9}`;
          demographics.age_groups[key] = (demographics.age_groups[key] || 0) + 1;
        }

        // Gender
        if (user.gender) {
          demographics.gender[user.gender] = (demographics.gender[user.gender] || 0) + 1;
        }
      }
    });

    res.json({ data: demographics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getAnalytics,
  getTopPosts,
  getAudienceInsights,
};
