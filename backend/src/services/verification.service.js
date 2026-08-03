const crypto = require("crypto");
const { supabase } = require("../config/supabase");
const { sendVerificationEmail, sendPasswordResetEmail } = require("./email.service");

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(userId, code) {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  return crypto.createHmac("sha256", secret).update(`${userId}:${code}`).digest("hex");
}

async function issueVerificationCode(user, { enforceCooldown = false, purpose = "verification" } = {}) {
  if (enforceCooldown) {
    const { data: existing } = await supabase
      .from("email_verification_otps")
      .select("last_sent_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing && Date.now() - new Date(existing.last_sent_at).getTime() < RESEND_COOLDOWN_MS) {
      const error = new Error("Please wait 60 seconds before requesting another code");
      error.statusCode = 429;
      throw error;
    }
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const now = new Date();
  const { error } = await supabase.from("email_verification_otps").upsert({
    user_id: user.id,
    code_hash: hashCode(user.id, code),
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    last_sent_at: now.toISOString(),
  });
  if (error) throw error;

  try {
    await (purpose === "password-reset" ? sendPasswordResetEmail(user.email, code) : sendVerificationEmail(user.email, code));
  } catch (error) {
    await supabase.from("email_verification_otps").delete().eq("user_id", user.id);
    throw error;
  }
}

async function verifyCode(userId, code) {
  const { data: record, error } = await supabase
    .from("email_verification_otps")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!record || new Date(record.expires_at).getTime() < Date.now()) {
    const expired = new Error("The verification code has expired. Request a new one.");
    expired.statusCode = 400;
    throw expired;
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    const limited = new Error("Too many incorrect attempts. Request a new code.");
    limited.statusCode = 429;
    throw limited;
  }

  const suppliedHash = hashCode(userId, code);
  const valid = crypto.timingSafeEqual(Buffer.from(record.code_hash), Buffer.from(suppliedHash));
  if (!valid) {
    await supabase.from("email_verification_otps").update({ attempts: record.attempts + 1 }).eq("user_id", userId);
    const invalid = new Error("Incorrect verification code");
    invalid.statusCode = 400;
    throw invalid;
  }

  await supabase.from("email_verification_otps").delete().eq("user_id", userId);
}

module.exports = { issueVerificationCode, verifyCode };
