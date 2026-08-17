const { supabase } = require("../config/supabase");
const { emitAssetChange } = require("../realtime");
const { randomUUID } = require("node:crypto");
const { notifySafely } = require("../services/notification.service");
const { getStripe } = require("../config/stripe");
const { updateConnectedAccount } = require("./stripe.controller");
const { uploadPublicFile } = require("../services/storage.service");

const ASSET_KINDS = new Set(["pdf", "video", "store", "membership", "campaign"]);
const ASSET_STATUSES = new Set(["draft", "uploading", "processing", "published", "paused", "scheduled", "under-review", "monetization-review", "restricted", "rejected", "archived"]);
const MEMBERSHIP_PRICING_MODELS = new Set(["free", "lifetime", "recurring", "tiers"]);

async function validateMembershipAsset(userId, metadata, price, currency) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "Membership metadata must be an object";
  if (!metadata.groupId) return "A connected community is required";
  if (!MEMBERSHIP_PRICING_MODELS.has(metadata.pricingModel || "tiers")) return "Invalid membership pricing model";
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return "Membership price cannot be negative";
  if (!/^[A-Z]{3}$/.test(String(currency || "USD").toUpperCase())) return "Currency must be a three-letter code";
  if (metadata.tiers !== undefined && !Array.isArray(metadata.tiers)) return "Membership tiers must be an array";
  if ((metadata.tiers || []).some((tier) => !tier || !String(tier.name || "").trim())) return "Every membership tier requires a name";
  const { data: membership, error } = await supabase.from("group_members").select("role").eq("group_id", metadata.groupId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!membership || !["owner", "admin"].includes(membership.role)) return "You do not manage the connected community";
  return null;
}

async function getAssets(req, res, next) {
  try {
    let query = supabase.from("user_records").select("*").eq("user_id", req.user.id).like("kind", "earn-%").order("created_at", { ascending: false });
    if (req.query.kind) {
      if (!ASSET_KINDS.has(req.query.kind)) return res.status(400).json({ success: false, message: "Invalid asset kind" });
      query = query.eq("kind", `earn-${req.query.kind}`);
    }
    const { data, error } = await query;
    if (error) throw error;
    const assets = (data || []).map((record) => ({ id: record.id, kind: record.kind.slice(5), status: record.status, created_at: record.created_at, updated_at: record.updated_at, ...record.data }));
    res.json({ success: true, assets });
  } catch (err) { next(err); }
}

async function getAsset(req, res, next) {
  try {
    const { data, error } = await supabase.from("user_records").select("*").eq("id", req.params.id).eq("user_id", req.user.id).like("kind", "earn-%").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Creator asset not found" });
    res.json({ success: true, asset: { id: data.id, kind: data.kind.slice(5), status: data.status, created_at: data.created_at, updated_at: data.updated_at, ...data.data } });
  } catch (err) { next(err); }
}

async function getPublicAsset(req, res, next) {
  try {
    const { data, error } = await supabase.from("user_records").select("*").eq("id", req.params.id).in("kind", ["earn-pdf", "earn-video"]).maybeSingle();
    if (error) throw error;
    if (!data || (data.user_id !== req.user.id && data.status !== "published")) return res.status(404).json({ success: false, message: "Published asset not found" });
    const source = data.data || {};
    const owner = data.user_id === req.user.id;
    const metadata = { ...(source.metadata || {}) };
    // Never expose a paid creator's original file through the public catalog.
    if (!owner && Number(source.price || 0) > 0) {
      delete metadata.fileUrl;
      delete metadata.transcriptUrl;
      delete metadata.captionsUrl;
    }
    res.json({ success: true, asset: { id: data.id, owner, kind: data.kind.slice(5), status: data.status, created_at: data.created_at, updated_at: data.updated_at, ...source, metadata } });
  } catch (err) { next(err); }
}

async function recordAssetView(req, res, next) {
  try {
    const { data, error } = await supabase.from("user_records").select("id,user_id,status,kind,data").eq("id", req.params.id).in("kind", ["earn-pdf", "earn-video"]).maybeSingle();
    if (error) throw error;
    if (!data || (data.user_id !== req.user.id && data.status !== "published")) return res.status(404).json({ success: false, message: "Published asset not found" });
    const source = data.data || {};
    const metrics = { ...(source.metrics || {}), views: Number(source.metrics?.views || 0) + 1 };
    const updated = await supabase.from("user_records").update({ data: { ...source, metrics } }).eq("id", data.id);
    if (updated.error) throw updated.error;
    res.json({ success: true, metrics });
  } catch (err) { next(err); }
}

async function getPublicMembership(req, res, next) {
  try {
    const { data, error } = await supabase.from("user_records").select("*").eq("id", req.params.id).eq("kind", "earn-membership").eq("status", "published").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Membership not found" });
    const source = data.data || {};
    const metadata = source.metadata || {};
    const publicKeys = ["groupId", "profileImage", "banner", "category", "subcategory", "rules", "valueProposition", "audience", "memberReceives", "faqs", "language", "privacy", "pricingModel", "currency", "lifetimePrice", "monthlyPrice", "quarterlyPrice", "sixMonthPrice", "annualPrice", "trial", "autoRenew", "trialReminder", "tiers", "benefits", "testimonials", "lifetimeTerms"];
    const publicMetadata = Object.fromEntries(publicKeys.filter((key) => metadata[key] !== undefined).map((key) => [key, metadata[key]]));
    res.json({ success: true, asset: { id: data.id, kind: "membership", status: data.status, created_at: data.created_at, updated_at: data.updated_at, title: source.title, description: source.description, image: source.image, price: source.price, currency: source.currency, metrics: { members: Number(source.metrics?.members || 0), rating: Number(source.metrics?.rating || 0) }, metadata: publicMetadata } });
  } catch (err) { next(err); }
}

async function uploadPdfFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Select a PDF file" });
    const fileUrl = await uploadPublicFile("pdfs", req.user.id, req.file);
    res.status(201).json({ success: true, fileUrl, fileName: req.file.originalname, fileSize: req.file.size });
  } catch (err) { next(err); }
}

async function uploadVideoFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Select a video, captions or transcript file" });
    const isVideo = req.file.mimetype.startsWith("video/");
    const fileUrl = await uploadPublicFile(isVideo ? "videos" : "video-text", req.user.id, req.file);
    res.status(201).json({ success: true, fileUrl, fileName: req.file.originalname, fileSize: req.file.size, processingStatus: isVideo ? "uploaded" : "ready" });
  } catch (err) { next(err); }
}

async function createAsset(req, res, next) {
  try {
    const { kind, subtype = "", title, description = "", image = null, status = "draft", price = 0, currency = "USD", metadata = {} } = req.body;
    if (!ASSET_KINDS.has(kind)) return res.status(400).json({ success: false, message: "Invalid asset kind" });
    if (!String(title || "").trim()) return res.status(400).json({ success: false, message: "Title is required" });
    if (!ASSET_STATUSES.has(status)) return res.status(400).json({ success: false, message: "Invalid asset status" });
    if (kind === "membership") {
      const validationError = await validateMembershipAsset(req.user.id, metadata, price, currency);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
    }
    const assetData = { subtype, title: String(title).trim(), description, image, price: Number(price) || 0, currency: String(currency).toUpperCase(), metrics: {}, metadata };
    const { data, error } = await supabase.from("user_records").insert({ user_id: req.user.id, kind: `earn-${kind}`, data: assetData, status }).select().single();
    if (error) throw error;
    const asset = { id: data.id, kind, status: data.status, created_at: data.created_at, updated_at: data.updated_at, ...data.data };
    emitAssetChange(req.user.id, "created", asset);
    res.status(201).json({ success: true, asset });
  } catch (err) { next(err); }
}

async function updateAsset(req, res, next) {
  try {
    const { data: existing, error: findError } = await supabase.from("user_records").select("*").eq("id", req.params.id).eq("user_id", req.user.id).like("kind", "earn-%").maybeSingle();
    if (findError) throw findError;
    if (!existing) return res.status(404).json({ success: false, message: "Creator asset not found" });
    if (req.body.status && !ASSET_STATUSES.has(req.body.status)) return res.status(400).json({ success: false, message: "Invalid asset status" });
    const allowed = ["subtype", "title", "description", "image", "price", "currency", "metadata"];
    const assetData = { ...existing.data, ...Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]])) };
    if (!String(assetData.title || "").trim()) return res.status(400).json({ success: false, message: "Title is required" });
    assetData.title = String(assetData.title).trim();
    assetData.price = Number(assetData.price) || 0;
    assetData.currency = String(assetData.currency || "USD").toUpperCase();
    if (existing.kind === "earn-membership") {
      const validationError = await validateMembershipAsset(req.user.id, assetData.metadata, assetData.price, assetData.currency);
      if (validationError) return res.status(400).json({ success: false, message: validationError });
    }
    const { data, error } = await supabase.from("user_records").update({ data: assetData, status: req.body.status || existing.status }).eq("id", req.params.id).eq("user_id", req.user.id).select().maybeSingle();
    if (error) throw error;
    const asset = { id: data.id, kind: data.kind.slice(5), status: data.status, created_at: data.created_at, updated_at: data.updated_at, ...data.data };
    emitAssetChange(req.user.id, "updated", asset);
    res.json({ success: true, asset });
  } catch (err) { next(err); }
}

async function deleteAsset(req, res, next) {
  try {
    const { data, error } = await supabase.from("user_records").delete().eq("id", req.params.id).eq("user_id", req.user.id).like("kind", "earn-%").select("id,kind").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Creator asset not found" });
    emitAssetChange(req.user.id, "deleted", { id: req.params.id, kind: data.kind?.slice(5) });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function requireOwnedStore(userId, storeId) {
  const { data, error } = await supabase.from("user_records").select("id").eq("id", storeId).eq("user_id", userId).eq("kind", "earn-store").maybeSingle();
  if (error) throw error;
  return data;
}

async function getStoreOrders(req, res, next) {
  try {
    if (!await requireOwnedStore(req.user.id, req.params.id)) return res.status(404).json({ success: false, message: "Store not found" });
    const { data, error } = await supabase.from("marketplace_orders")
      .select("*, buyer:buyer_id(id,name,avatar,email)")
      .eq("store_id", req.params.id).eq("seller_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, orders: data || [] });
  } catch (err) { next(err); }
}

async function getStoreCustomers(req, res, next) {
  try {
    if (!await requireOwnedStore(req.user.id, req.params.id)) return res.status(404).json({ success: false, message: "Store not found" });
    const { data, error } = await supabase.from("marketplace_orders")
      .select("buyer_id,total_amount,status,created_at,buyer:buyer_id(id,name,avatar,email)")
      .eq("store_id", req.params.id).eq("seller_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const customers = [...(data || []).reduce((map, order) => {
      const current = map.get(order.buyer_id) || { id: order.buyer_id, ...(order.buyer || {}), orders: 0, spent: 0, lastOrderAt: order.created_at };
      current.orders += 1;
      if (["paid", "complete", "completed"].includes(order.status)) current.spent += Number(order.total_amount || 0) / 100;
      map.set(order.buyer_id, current);
      return map;
    }, new Map()).values()];
    res.json({ success: true, customers });
  } catch (err) { next(err); }
}

async function createStoreProduct(req, res, next) {
  try {
    const { data: store, error: storeError } = await supabase.from("user_records").select("*").eq("id", req.params.id).eq("user_id", req.user.id).eq("kind", "earn-store").maybeSingle();
    if (storeError) throw storeError;
    if (!store) return res.status(404).json({ success: false, message: "Store not found" });
    const product = req.body;
    if (!String(product.title || "").trim() || !product.category) return res.status(400).json({ success: false, message: "Product title and category are required" });
    const { data: listing, error } = await supabase.from("marketplace_products").insert({
      seller_id: req.user.id, store_id: store.id, title: String(product.title).trim(), description: product.description || "",
      photo: product.image || null, price: Number(product.price) || 0, currency: store.data?.currency || "USD",
      category: product.category, is_featured: false, is_active: product.status === "published",
    }).select().single();
    if (error) throw error;
    const storedProduct = { ...product, id: listing.id };
    const metadata = { ...(store.data?.metadata || {}), products: [...(store.data?.metadata?.products || []), storedProduct] };
    const assetData = { ...store.data, metadata };
    const { data: updated, error: updateError } = await supabase.from("user_records").update({ data: assetData }).eq("id", store.id).select().single();
    if (updateError) { await supabase.from("marketplace_products").delete().eq("id", listing.id); throw updateError; }
    const asset = { id: updated.id, kind: "store", status: updated.status, created_at: updated.created_at, updated_at: updated.updated_at, ...updated.data };
    emitAssetChange(req.user.id, "updated", asset);
    res.status(201).json({ success: true, product: storedProduct, asset });
  } catch (err) { next(err); }
}

async function getSummary(req, res, next) {
    try {
      const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "6m": 183, "1y": 365 };
      const range = Object.prototype.hasOwnProperty.call(rangeDays, req.query.range) ? req.query.range : "lifetime";
      const rangeCutoff = range === "lifetime" ? null : Date.now() - rangeDays[range] * 86400000;
    const [entryResult, payoutResult, assetResult, blogResult, articleResult, productResult, orderResult, referralResult] = await Promise.all([
      supabase.from("earn_entries").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false }),
      supabase.from("payouts").select("*").eq("user_id", req.user.id).maybeSingle(),
      supabase.from("user_records").select("kind,status,data").eq("user_id", req.user.id).like("kind", "earn-%"),
      supabase.from("blog_sites").select("id,status").eq("user_id", req.user.id),
      supabase.from("articles").select("earned,created_at").eq("user_id", req.user.id),
      supabase.from("marketplace_products").select("id,price,sold_count,is_active").eq("seller_id", req.user.id),
      supabase.from("marketplace_orders").select("total_amount,platform_fee_amount,status,paid_at,created_at").eq("seller_id", req.user.id),
      supabase.from("referrals").select("id,status,reward").eq("referrer_id", req.user.id),
    ]);
    for (const result of [entryResult, payoutResult, assetResult, blogResult, articleResult, productResult, orderResult, referralResult]) if (result.error) throw result.error;
    const entries = entryResult.data || [];
    const monthlyCutoff = Date.now() - 30 * 86400000;
    const blogEarnings = (articleResult.data || []).reduce((sum, item) => sum + Number(item.earned || 0), 0);
    const paidOrders = (orderResult.data || []).filter((item) => item.status === "paid" || item.status === "complete" || item.status === "completed");
    const storeEarnings = paidOrders.reduce((sum, item) => sum + Math.max(0, Number(item.total_amount || 0) - Number(item.platform_fee_amount || 0)) / 100, 0);
    const monthlyBlog = (articleResult.data || []).filter((item) => new Date(item.created_at).getTime() >= monthlyCutoff).reduce((sum, item) => sum + Number(item.earned || 0), 0);
      const monthlyStore = paidOrders.filter((item) => new Date(item.paid_at || item.created_at).getTime() >= monthlyCutoff).reduce((sum, item) => sum + Math.max(0, Number(item.total_amount || 0) - Number(item.platform_fee_amount || 0)) / 100, 0);
      const periodBlog = (articleResult.data || []).filter((item) => !rangeCutoff || new Date(item.created_at).getTime() >= rangeCutoff).reduce((sum, item) => sum + Number(item.earned || 0), 0);
      const periodStore = paidOrders.filter((item) => !rangeCutoff || new Date(item.paid_at || item.created_at).getTime() >= rangeCutoff).reduce((sum, item) => sum + Math.max(0, Number(item.total_amount || 0) - Number(item.platform_fee_amount || 0)) / 100, 0);
    const total = blogEarnings + storeEarnings;
    const monthly = monthlyBlog + monthlyStore;
    const payout = payoutResult.data || {};
    const sourceTotals = { blogs: blogEarnings, stores: storeEarnings };
      res.json({ success: true, summary: { balance: Number(payout.pending || 0), lifetimeEarnings: total, periodEarnings: periodBlog + periodStore, range, last30Days: monthly, availableBalance: Number(payout.pending || 0), pendingEarnings: Number(payout.pending || 0), totalWithdrawn: Number(payout.paid_out || 0), sourceTotals, counts: { assets: (assetResult.data || []).length, blogs: (blogResult.data || []).length, products: (productResult.data || []).length, referrals: (referralResult.data || []).length } }, entries, payout, assets: assetResult.data || [] });
  } catch (err) { next(err); }
}

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
    const stripe=getStripe();
    const {data:user,error:userError}=await supabase.from("users").select("email,name").eq("id",req.user.id).single();if(userError)throw userError;
    let {data:payout}=await supabase.from("payouts").select("*").eq("user_id",req.user.id).maybeSingle();
    if(!payout){const created=await supabase.from("payouts").insert({user_id:req.user.id}).select().single();if(created.error)throw created.error;payout=created.data;}
    let accountId=payout.stripe_account_id;
    if(!accountId){const account=await stripe.accounts.create({type:"express",country:req.body.country||process.env.STRIPE_DEFAULT_COUNTRY||"US",email:user.email,business_profile:{name:user.name||undefined},capabilities:{card_payments:{requested:true},transfers:{requested:true}},metadata:{teamcalUserId:req.user.id}});accountId=account.id;const saved=await supabase.from("payouts").update({provider:"stripe",account:accountId,stripe_account_id:accountId,stripe_account_status:"onboarding"}).eq("user_id",req.user.id).select().single();if(saved.error)throw saved.error;payout=saved.data;}
    const base=(process.env.PUBLIC_APP_URL||"http://localhost:8081").replace(/\/$/,"");
    const link=await stripe.accountLinks.create({account:accountId,refresh_url:`${base}/stripe/connect/refresh`,return_url:`${base}/stripe/connect/return`,type:"account_onboarding",collection_options:{fields:"eventually_due"}});
    res.json({success:true,payout,onboardingUrl:link.url,expiresAt:link.expires_at});
  } catch (err) {
    next(err);
  }
}

async function payoutStatus(req,res,next){try{const {data:payout,error}=await supabase.from("payouts").select("*").eq("user_id",req.user.id).maybeSingle();if(error)throw error;if(!payout?.stripe_account_id)return res.json({success:true,payout:payout||null,requirements:[]});const account=await getStripe().accounts.retrieve(payout.stripe_account_id);const updated=await updateConnectedAccount(account);res.json({success:true,payout:updated,requirements:account.requirements?.currently_due||[],disabledReason:account.requirements?.disabled_reason||null});}catch(e){next(e);}}
async function payoutLoginLink(req,res,next){try{const {data:payout}=await supabase.from("payouts").select("stripe_account_id").eq("user_id",req.user.id).maybeSingle();if(!payout?.stripe_account_id)return res.status(400).json({success:false,message:"No Stripe account connected"});const link=await getStripe().accounts.createLoginLink(payout.stripe_account_id);res.json({success:true,url:link.url});}catch(e){next(e);}}

/** POST /api/earn/payout/disconnect */
async function disconnectPayout(req, res, next) {
  try {
    const { data: payout, error } = await supabase
      .from("payouts")
      .update({ connected: false, stripe_account_status: "disconnected" })
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
    if(!payout.stripe_account_id||!payout.stripe_payouts_enabled)return res.status(400).json({success:false,message:"Stripe payouts are not enabled"});
    const currency=String(req.body.currency||"usd").toLowerCase();const amountMinor=Math.round(amount*100);
    const stripePayout=await getStripe().payouts.create({amount:amountMinor,currency,metadata:{teamcalUserId:req.user.id}},{stripeAccount:payout.stripe_account_id,idempotencyKey:`withdraw:${req.user.id}:${req.body.idempotencyKey||randomUUID()}`});
    const entry = { id: randomUUID(), stripePayoutId:stripePayout.id, amount, currency, status: stripePayout.status, createdAt: new Date() };
    const newHistory = [entry, ...(payout.history || [])];

    const { data: updated, error } = await supabase
      .from("payouts")
      .update({ history: newHistory })
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
  getPayout, connectPayout, payoutStatus, payoutLoginLink, disconnectPayout, withdraw, dailyCheckin, redeemReward, getRedemptions,
  getSummary, getAssets, getAsset, getPublicAsset, recordAssetView, getPublicMembership, getStoreOrders, getStoreCustomers, createStoreProduct, createAsset, updateAsset, deleteAsset, uploadPdfFile, uploadVideoFile,
};
