const { supabase } = require('../config/supabase');

/**
 * Apply for channel monetization
 */
async function applyForMonetization(req, res) {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // Get channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.owner_id !== userId) {
      return res.status(403).json({ message: 'Only channel owner can apply for monetization' });
    }

    if (channel.is_monetized) {
      return res.status(400).json({ message: 'Channel is already monetized' });
    }

    if (channel.monetization_status === 'pending') {
      return res.status(400).json({ message: 'Application already pending' });
    }

    // Check eligibility requirements
    const { data: analytics } = await supabase
      .from('channel_analytics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    const totalViews = analytics?.reduce((sum, a) => sum + a.views, 0) || 0;
    const channelAgeDays = Math.floor((Date.now() - new Date(channel.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const requirements = {
      minFollowers: 1000,
      minViews: 10000,
      minAgeDays: 60,
    };

    const eligible = 
      channel.follower_count >= requirements.minFollowers &&
      totalViews >= requirements.minViews &&
      channelAgeDays >= requirements.minAgeDays;

    if (!eligible) {
      return res.status(400).json({
        message: 'Channel does not meet monetization requirements',
        requirements: {
          followers: { current: channel.follower_count, required: requirements.minFollowers },
          views: { current: totalViews, required: requirements.minViews },
          ageDays: { current: channelAgeDays, required: requirements.minAgeDays },
        },
      });
    }

    // Update channel to pending
    const { error: updateError } = await supabase
      .from('channels')
      .update({
        monetization_status: 'pending',
        monetization_applied_at: new Date().toISOString(),
      })
      .eq('id', channelId);

    if (updateError) throw updateError;

    res.json({ 
      message: 'Monetization application submitted successfully',
      status: 'pending',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get monetization status and requirements
 */
async function getMonetizationStatus(req, res) {
  try {
    const { channelId } = req.params;

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Get analytics for last 30 days
    const { data: analytics } = await supabase
      .from('channel_analytics')
      .select('*')
      .eq('channel_id', channelId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const totalViews = analytics?.reduce((sum, a) => sum + a.views, 0) || 0;
    const channelAgeDays = Math.floor((Date.now() - new Date(channel.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const requirements = {
      followers: channel.follower_count,
      minFollowers: 1000,
      views: totalViews,
      minViews: 10000,
      age: channelAgeDays,
      minAge: 60,
    };

    res.json({
      data: {
        status: channel.monetization_status || 'not_applied',
        is_monetized: channel.is_monetized || false,
        applied_at: channel.monetization_applied_at,
        approved_at: channel.monetization_approved_at,
        requirements,
        eligible: 
          requirements.followers >= requirements.minFollowers &&
          requirements.views >= requirements.minViews &&
          requirements.age >= requirements.minAge,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get channel earnings
 */
async function getEarnings(req, res) {
  try {
    const { channelId } = req.params;

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error || !channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (!channel.is_monetized) {
      return res.status(403).json({ message: 'Channel is not monetized' });
    }

    // Get ad impressions
    const { data: impressions } = await supabase
      .from('ad_impressions')
      .select('*')
      .eq('channel_id', channelId);

    const totalImpressions = impressions?.length || 0;
    
    // Calculate earnings (example: $1 CPM = $1 per 1000 impressions)
    const CPM = 1.0;
    const totalRevenue = (totalImpressions / 1000) * CPM;
    const creatorSharePercent = channel.revenue_share_percent || 40;
    const creatorEarnings = totalRevenue * (creatorSharePercent / 100);

    // Get withdrawals
    const { data: withdrawals } = await supabase
      .from('channel_withdrawals')
      .select('*')
      .eq('channel_id', channelId)
      .eq('status', 'completed');

    const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    const availableBalance = Math.max(0, creatorEarnings - totalWithdrawn);

    // Get pending withdrawals
    const { data: pendingWithdrawals } = await supabase
      .from('channel_withdrawals')
      .select('*')
      .eq('channel_id', channelId)
      .eq('status', 'pending');

    const pendingBalance = pendingWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    res.json({
      data: {
        total: creatorEarnings,
        pending: pendingBalance,
        available: availableBalance - pendingBalance,
        withdrawn: totalWithdrawn,
        impressions: totalImpressions,
        revenue: totalRevenue,
        creatorShare: creatorSharePercent,
        withdrawals: withdrawals || [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Request withdrawal
 */
async function requestWithdrawal(req, res) {
  try {
    const { channelId } = req.params;
    const { amount, payment_method } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is $50' });
    }

    // Get current earnings
    const earningsResponse = await getEarnings({ params: { channelId }, user: req.user }, {
      json: (data) => data,
      status: () => ({ json: (data) => data }),
    });

    const available = earningsResponse.data?.available || 0;

    if (amount > available) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create withdrawal request
    const { data: withdrawal, error } = await supabase
      .from('channel_withdrawals')
      .insert({
        channel_id: channelId,
        user_id: req.user.id,
        amount,
        payment_method: payment_method || 'stripe',
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      data: withdrawal,
      message: 'Withdrawal request submitted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  applyForMonetization,
  getMonetizationStatus,
  getEarnings,
  requestWithdrawal,
};
