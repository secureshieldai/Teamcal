const crypto = require("crypto");
const { supabase } = require("../config/supabase");

const APP_SCHEME = process.env.MOBILE_APP_SCHEME || "teamcal";
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");

const PROVIDERS = {
  instagram: {
    env: "INSTAGRAM", auth: "https://www.instagram.com/oauth/authorize", token: "https://api.instagram.com/oauth/access_token",
    profile: "https://graph.instagram.com/me?fields=id,username", scope: "instagram_business_basic,instagram_business_content_publish",
  },
  facebook: {
    env: "FACEBOOK", auth: "https://www.facebook.com/v23.0/dialog/oauth", token: "https://graph.facebook.com/v23.0/oauth/access_token",
    profile: "https://graph.facebook.com/v23.0/me?fields=id,name,picture", scope: "public_profile,pages_show_list,pages_manage_posts",
  },
  linkedin: {
    env: "LINKEDIN", auth: "https://www.linkedin.com/oauth/v2/authorization", token: "https://www.linkedin.com/oauth/v2/accessToken",
    profile: "https://api.linkedin.com/v2/userinfo", scope: "openid profile w_member_social",
  },
  x: {
    env: "X", auth: "https://twitter.com/i/oauth2/authorize", token: "https://api.x.com/2/oauth2/token",
    profile: "https://api.x.com/2/users/me?user.fields=profile_image_url,name,username", scope: "tweet.read tweet.write users.read offline.access", pkce: true, basic: true, omitClientIdInToken: true,
  },
  reddit: {
    env: "REDDIT", auth: "https://www.reddit.com/api/v1/authorize", token: "https://www.reddit.com/api/v1/access_token",
    profile: "https://oauth.reddit.com/api/v1/me", scope: "identity submit read", basic: true, extraAuth: { duration: "permanent" },
  },
  discord: {
    env: "DISCORD", auth: "https://discord.com/oauth2/authorize", token: "https://discord.com/api/v10/oauth2/token",
    profile: "https://discord.com/api/v10/users/@me", scope: "identify",
  },
  tiktok: {
    env: "TIKTOK", auth: "https://www.tiktok.com/v2/auth/authorize/", token: "https://open.tiktokapis.com/v2/oauth/token/",
    profile: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", scope: "user.info.basic", clientKey: true,
  },
  whatsapp: {
    env: "WHATSAPP", auth: "https://www.facebook.com/v23.0/dialog/oauth", token: "https://graph.facebook.com/v23.0/oauth/access_token",
    profile: "https://graph.facebook.com/v23.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name}", scope: "business_management,whatsapp_business_management",
  },
};

function credentials(provider) {
  const prefix = provider.env;
  return { id: process.env[`${prefix}_CLIENT_ID`] || process.env[`${prefix}_CLIENT_KEY`], secret: process.env[`${prefix}_CLIENT_SECRET`] };
}

function callbackUrl(platform) { return `${PUBLIC_API_URL}/api/social-auth/callback/${platform}`; }
function b64url(value) { return Buffer.from(value).toString("base64url"); }
function verifier() { return b64url(crypto.randomBytes(48)); }
function challenge(value) { return crypto.createHash("sha256").update(value).digest("base64url"); }

function encrypt(value) {
  const key = crypto.createHash("sha256").update(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET).digest();
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decrypt(value) {
  const key = crypto.createHash("sha256").update(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET).digest();
  const [iv, tag, encrypted] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv); decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"));
}

function appRedirect(res, status, platform, message) {
  const query = new URLSearchParams({ status, platform, ...(message ? { message } : {}) });
  return res.redirect(`${APP_SCHEME}://social-auth/callback?${query}`);
}

async function connect(req, res) {
  const platform = String(req.params.platform || "").toLowerCase();
  if (platform === "quora") return res.status(400).json({ success: false, message: "Quora does not provide a public OAuth account connection API." });
  const provider = PROVIDERS[platform];
  if (!provider) return res.status(400).json({ success: false, message: "Unsupported social platform" });
  const creds = credentials(provider);
  if (!creds.id || !creds.secret) return res.status(503).json({ success: false, message: `${platform} OAuth is not configured on the server yet.` });

  const codeVerifier = provider.pkce ? verifier() : undefined;
  const state = encrypt({ userId: req.user.id, platform, codeVerifier, nonce: b64url(crypto.randomBytes(16)), expiresAt: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({ response_type: "code", redirect_uri: callbackUrl(platform), state, scope: provider.scope });
  params.set(provider.clientKey ? "client_key" : "client_id", creds.id);
  if (provider.pkce) { params.set("code_challenge", challenge(codeVerifier)); params.set("code_challenge_method", "S256"); }
  for (const [key, value] of Object.entries(provider.extraAuth || {})) params.set(key, value);
  res.json({ success: true, authUrl: `${provider.auth}?${params}` });
}

async function exchangeCode(platform, provider, code, codeVerifier) {
  const creds = credentials(provider); const redirectUri = callbackUrl(platform);
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
  if (!provider.omitClientIdInToken) body.set(provider.clientKey ? "client_key" : "client_id", creds.id);
  if (!provider.basic) body.set("client_secret", creds.secret);
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  const headers = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (provider.basic) headers.Authorization = `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}`;
  const response = await fetch(provider.token, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.message || "Token exchange failed");
  return data;
}

async function getProfile(platform, provider, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  if (platform === "reddit") headers["User-Agent"] = process.env.REDDIT_USER_AGENT || "TeamCal/1.0";
  const response = await fetch(provider.profile, { headers, signal: AbortSignal.timeout(15000) });
  const raw = await response.json();
  if (!response.ok) throw new Error(raw.message || "Unable to load social profile");
  if (platform === "whatsapp") {
    const businesses = raw.data || [];
    const business = businesses.find(item => item.owned_whatsapp_business_accounts?.data?.length);
    const account = business?.owned_whatsapp_business_accounts?.data?.[0];
    if (!account) throw new Error("No WhatsApp Business account was found for this Meta account");
    return { accountId: String(account.id), displayName: account.name || business.name || "WhatsApp Business", username: account.name || String(account.id) };
  }
  const p = raw.data || raw;
  return {
    accountId: String(p.id || p.sub || p.open_id),
    displayName: p.name || p.display_name || p.global_name || p.username || "Connected account",
    username: p.username || p.preferred_username || p.name || p.display_name || String(p.id || p.sub || p.open_id),
    avatar: p.picture?.data?.url || p.picture || p.profile_image_url || p.avatar_url || (platform === "discord" && p.avatar ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png` : undefined),
  };
}

async function callback(req, res) {
  const platform = String(req.params.platform || "").toLowerCase(); const provider = PROVIDERS[platform];
  if (!provider) return appRedirect(res, "error", platform, "Unsupported platform");
  try {
    if (req.query.error) throw new Error(String(req.query.error_description || req.query.error));
    const state = decrypt(String(req.query.state || ""));
    if (state.platform !== platform || !state.userId || Date.now() > state.expiresAt) throw new Error("Invalid or expired OAuth state");
    const tokens = await exchangeCode(platform, provider, String(req.query.code || ""), state.codeVerifier);
    const profile = await getProfile(platform, provider, tokens.access_token);
    const record = { user_id: state.userId, kind: "audience-account", external_key: `${platform}:${profile.accountId}`, status: "active", data: { platform, ...profile, status: "connected", connectedAt: new Date().toISOString(), credentials: encrypt(tokens) } };
    const { error } = await supabase.from("user_records").upsert(record, { onConflict: "user_id,kind,external_key" });
    if (error) throw error;
    return appRedirect(res, "success", platform);
  } catch (error) { return appRedirect(res, "error", platform, error.message || "Connection failed"); }
}

function platformStatus(_req, res) {
  const platforms = Object.fromEntries(Object.entries(PROVIDERS).map(([key, provider]) => { const c = credentials(provider); return [key, { supported: true, configured: Boolean(c.id && c.secret) }]; }));
  platforms.quora = { supported: false, configured: false, reason: "No public OAuth API" };
  res.json({ success: true, platforms });
}

module.exports = { connect, callback, platformStatus };
