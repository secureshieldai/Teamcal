const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { supabase } = require("../config/supabase");
const { verifyFirebaseToken } = require("../config/firebase");
const { handleReferralJoin } = require("./earn.controller");
const { issueVerificationCode, verifyCode } = require("../services/verification.service");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

function signVerificationToken(id) {
  return jwt.sign({ id, purpose: "email-verification" }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function readVerificationToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.purpose !== "email-verification") {
    const error = new Error("Invalid verification session");
    error.statusCode = 401;
    throw error;
  }
  return decoded;
}

function signPurposeToken(id,purpose,expiresIn="15m"){return jwt.sign({id,purpose},process.env.JWT_SECRET,{expiresIn});}
function readPurposeToken(token,purpose){const decoded=jwt.verify(token,process.env.JWT_SECRET);if(decoded.purpose!==purpose){const e=new Error("Invalid or expired session");e.statusCode=401;throw e;}return decoded;}

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { email, password, name, referralCode } = req.body;

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      if (!existing.verified && await bcrypt.compare(password, existing.password_hash)) {
        await issueVerificationCode(existing);
        return res.json({
          success: true,
          verificationToken: signVerificationToken(existing.id),
          message: "A new verification code was sent",
        });
      }
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newReferralCode = randomUUID().slice(0, 8).toUpperCase();

    const { data: user, error } = await supabase
      .from("users")
      .insert({ email: email.toLowerCase(), password_hash: passwordHash, name: name || "", referral_code: newReferralCode })
      .select()
      .single();

    if (error) throw error;

    try {
      await issueVerificationCode(user);
    } catch (deliveryError) {
      await supabase.from("email_verification_otps").delete().eq("user_id", user.id);
      await supabase.from("users").delete().eq("id", user.id);
      throw deliveryError;
    }

    await supabase.from("payouts").insert({ user_id: user.id });

    // Credit referrer if a valid referral code was provided
    if (referralCode) {
      handleReferralJoin(referralCode.toUpperCase(), user.id).catch(() => {
        // Non-fatal — don't fail registration if referral credit fails
      });
    }

    res.status(201).json({
      success: true,
      verificationToken: signVerificationToken(user.id),
      message: "Verification code sent",
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/verification/resend */
async function resendVerification(req, res, next) {
  try {
    const { id } = readVerificationToken(req.body.verificationToken);
    const { data: user, error } = await supabase.from("users").select("id,email,verified").eq("id", id).single();
    if (error || !user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.verified) return res.status(409).json({ success: false, message: "Email is already verified" });

    await issueVerificationCode(user, { enforceCooldown: true });
    res.json({ success: true, message: "A new verification code was sent" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/verification/verify */
async function verifyEmail(req, res, next) {
  try {
    const { id } = readVerificationToken(req.body.verificationToken);
    await verifyCode(id, req.body.code);

    const { data: user, error } = await supabase
      .from("users")
      .update({ verified: true, verified_at: Date.now() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const token = signToken(user.id);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.verified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    }

    const token = signToken(user.id);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me */
async function me(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();
    if (error) throw error;
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/firebase
 * Body: { idToken } — Firebase ID token from Google/Apple sign-in
 * Verifies the token with Firebase Admin, then finds or creates the user
 * in Supabase and returns our own JWT.
 */
async function firebaseAuth(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    // Verify with Firebase Admin
    const decoded = await verifyFirebaseToken(idToken);
    if (!decoded) {
      return res.status(503).json({ success: false, message: "Firebase not configured on server" });
    }

    const email = decoded.email?.toLowerCase();
    const name = decoded.name || "";
    const avatar = decoded.picture || null;
    const provider = decoded.firebase?.sign_in_provider || "unknown";

    if (!email) {
      return res.status(400).json({ success: false, message: "No email from provider" });
    }

    // Find existing user
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      // Auto-create user — no password needed for OAuth
      const referralCode = randomUUID().slice(0, 8).toUpperCase();
      const { data: created, error } = await supabase
        .from("users")
        .insert({
          email,
          password_hash: await bcrypt.hash(randomUUID(), 10), // random unusable password
          name,
          avatar,
          referral_code: referralCode,
          verified: true,
          verified_at: Date.now(),
        })
        .select()
        .single();

      if (error) throw error;
      user = created;

      // Create payout record for new user
      await supabase.from("payouts").insert({ user_id: user.id });
    } else {
      // Update avatar/name from provider if missing
      const patch = {};
      if (!user.avatar && avatar) patch.avatar = avatar;
      if (!user.name && name) patch.name = name;
      if (!user.verified) {
        patch.verified = true;
        patch.verified_at = Date.now();
      }
      if (Object.keys(patch).length) {
        await supabase.from("users").update(patch).eq("id", user.id);
        user = { ...user, ...patch };
      }
    }

    const token = signToken(user.id);
    res.json({ success: true, token, user: publicUser(user), provider });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { data: user, error } = await supabase
      .from("users").select("password_hash").eq("id", req.user.id).single();
    if (error) throw error;
    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from("users").update({ password_hash }).eq("id", req.user.id);
    if (updateError) throw updateError;
    res.json({ success: true, message: "Password updated" });
  } catch (err) { next(err); }
}

async function requestPasswordReset(req,res,next){try{const {data:user}=await supabase.from("users").select("id,email").eq("email",req.body.email.toLowerCase()).maybeSingle();if(!user)return res.status(404).json({success:false,message:"No account found for that email"});await issueVerificationCode(user,{purpose:"password-reset"});res.json({success:true,verificationToken:signPurposeToken(user.id,"password-reset-verification"),message:"Reset code sent"});}catch(e){next(e);}}
async function verifyPasswordReset(req,res,next){try{const {id}=readPurposeToken(req.body.verificationToken,"password-reset-verification");await verifyCode(id,req.body.code);res.json({success:true,resetToken:signPurposeToken(id,"password-reset","10m")});}catch(e){next(e);}}
async function resetPassword(req,res,next){try{const {id}=readPurposeToken(req.body.resetToken,"password-reset");const password_hash=await bcrypt.hash(req.body.newPassword,12);const {error}=await supabase.from("users").update({password_hash}).eq("id",id);if(error)throw error;res.json({success:true,message:"Password updated"});}catch(e){next(e);}}

module.exports = { register, login, me, firebaseAuth, resendVerification, verifyEmail, changePassword, requestPasswordReset, verifyPasswordReset, resetPassword };
