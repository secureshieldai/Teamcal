const { supabase } = require("../config/supabase");
const { v4: uuidv4 } = require("uuid");
const { notifySafely } = require("../services/notification.service");

/** GET /api/earn/entries */
async function getEarnEntries(req, res, next) {
  try {
    const { data: entries, error } = await supabase
      .from("earn_entries")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const total = entries.reduce((s, e) => s + Number(e.amount), 0);
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const monthly = entries
      .filter((e) => new Date(e.created_at).getTime() >= thirtyDaysAgo)
      .reduce((s, e) => s + Number(e.amount), 0);

    res.json({ success: true, entries, total, monthly });
  } catch (err) {
    next(err);
  }
}

/** GET /api/earn/referrals */
async function getReferrals(req, res, next) {
  try {
    const { data: referrals, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, referrals });
  } catch (err) {
    next(err);
  }
}

/** POST /api/earn/referrals */
async function inviteReferral(req, res, next) {
  try {
    const { data: ref, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: req.user.id,
        name: req.body.name,
        status: "invited",
        reward: 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, referral: ref });
  } catch (err) {
    next(err);
  }
}

/** GET /api/earn/payout */
async function getPayout(req, res, next) {
  try {
    let { data: payout, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // Create if doesn't exist
      const { data: created } = await supabase
        .from("payouts")
        .insert({ user_id: req.user.id })
        .select()
        .single();
      payout = created;
    } else if (error) {
      throw error;
    }

    res.json({ success: true, payout });
  } catch (err) {
    next(err);
  }
}

/** POST /api/earn/payout/connect */
async function connectPayout(req, res, next) {
  try {
    const { provider, account } = req.body;
    const { data: payout, error } = await supabase
      .from("payouts")
      .update({ connected: true, provider, account })
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, payout });
  } catch (err) {
    next(err);
  }
}

/** POST /api/earn/payout/disconnect */
async function disconnectPayout(req, res, next) {
  try {
    const { data: payout, error } = await supabase
      .from("payouts")
      .update({ connected: false, provider: null, account: "" })
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, payout });
  } catch (err) {
    next(err);
  }
}

/** POST /api/earn/payout/withdraw */
async function withdraw(req, res, next) {
  try {
    const amount = parseFloat(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (!payout) return res.status(404).json({ success: false, message: "No payout account" });
    if (!payout.connected) {
      return res.status(400).json({ success: false, message: "No payout method connected" });
    }
    if (amount > payout.pending) {
      return res.status(400).json({ success: false, message: "Insufficient balance" });
    }

    const entry = { id: uuidv4(), amount, status: "processing", createdAt: new Date() };
    const newHistory = [entry, ...(payout.history || [])];

    const { data: updated, error } = await supabase
      .from("payouts")
      .update({ pending: payout.pending - amount, history: newHistory })
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, payout: updated });
  } catch (err) {
    next(err);
  }
}

async function dailyCheckin(req, res, next) {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const { count } = await supabase.from("earn_entries").select("*",{count:"exact",head:true}).eq("user_id",req.user.id).eq("source","daily-checkin").gte("created_at",start.toISOString());
    if (count) return res.status(400).json({success:false,message:"Daily check-in already claimed"});
    const { data: entry, error } = await supabase.from("earn_entries").insert({user_id:req.user.id,source:"daily-checkin",label:"Daily check-in",amount:10}).select().single();if(error)throw error;
    const { data:user }=await supabase.from("users").select("coins").eq("id",req.user.id).single();await supabase.from("users").update({coins:(user?.coins||0)+10}).eq("id",req.user.id);
    notifySafely(req.user.id, "reward", "Daily reward claimed", "You earned 10 points for checking in today.", { entityId: entry.id });
    res.status(201).json({success:true,entry});
  } catch(err){next(err);}
}

async function redeemReward(req,res,next){
  try{const catalog={"profile-badge":{label:"Profile Badge",cost:250},"challenge-pass":{label:"Challenge Pass",cost:500},"marketplace-credit":{label:"Marketplace Credit",cost:1000}};const reward=catalog[req.body.rewardId];if(!reward)return res.status(400).json({success:false,message:"Invalid reward"});const {data:user}=await supabase.from("users").select("coins").eq("id",req.user.id).single();if((user?.coins||0)<reward.cost)return res.status(400).json({success:false,message:"Not enough points"});await supabase.from("users").update({coins:user.coins-reward.cost}).eq("id",req.user.id);const {data:redemption,error}=await supabase.from("tracker_entries").insert({user_id:req.user.id,tracker:"reward-redemption",ts:Date.now(),value:reward.cost,meta:{rewardId:req.body.rewardId,label:reward.label,status:"redeemed"}}).select().single();if(error)throw error;notifySafely(req.user.id,"reward","Reward redeemed",`${reward.label} was redeemed for ${reward.cost} points.`,{entityId:redemption.id});res.status(201).json({success:true,redemption,balance:user.coins-reward.cost});}catch(err){next(err);}
}

async function getRedemptions(req,res,next){try{const {data:redemptions,error}=await supabase.from("tracker_entries").select("*").eq("user_id",req.user.id).eq("tracker","reward-redemption").order("ts",{ascending:false});if(error)throw error;res.json({success:true,redemptions,catalog:[{id:"profile-badge",label:"Profile Badge",cost:250},{id:"challenge-pass",label:"Challenge Pass",cost:500},{id:"marketplace-credit",label:"Marketplace Credit",cost:1000}]});}catch(err){next(err);}}

/** Internal: handle referral join */
async function handleReferralJoin(referralCode, newUserId) {
  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) return;

  await supabase
    .from("users")
    .update({ referred_by: referrer.id })
    .eq("id", newUserId);

  await supabase
    .from("referrals")
    .update({ status: "joined", referred_user_id: newUserId, reward: 5 })
    .eq("referrer_id", referrer.id)
    .eq("status", "invited")
    .order("created_at", { ascending: false })
    .limit(1);

  await supabase
    .from("earn_entries")
    .insert({
      user_id: referrer.id,
      source: "referral",
      label: "Friend joined TeamCal",
      amount: 5,
    });

  const { data: payout } = await supabase
    .from("payouts")
    .select("pending")
    .eq("user_id", referrer.id)
    .single();

  if (payout) {
    await supabase
      .from("payouts")
      .update({ pending: (payout.pending || 0) + 5 })
      .eq("user_id", referrer.id);
  }
}

module.exports = {
  getEarnEntries, getReferrals, inviteReferral, handleReferralJoin,
  getPayout, connectPayout, disconnectPayout, withdraw, dailyCheckin, redeemReward, getRedemptions,
};
