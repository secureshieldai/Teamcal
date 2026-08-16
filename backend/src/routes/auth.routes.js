const express = require("express");
const { body } = require("express-validator");
const { register, login, me, firebaseAuth, resendVerification, verifyEmail, changePassword, deleteAccount, requestPasswordReset, verifyPasswordReset, resetPassword } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const authAttemptLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many failed sign-in attempts. Please try again later." },
});

router.post(
  "/register",
  authAttemptLimit,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").optional().trim(),
    body("referralCode").optional().trim().toUpperCase(),
    body("acceptedTerms").custom((value) => value === true).withMessage("You must agree to the Terms of Use and acknowledge the Privacy Policy"),
  ],
  validate,
  register
);

router.post(
  "/verification/verify",
  [body("verificationToken").notEmpty(), body("code").matches(/^\d{6}$/)],
  validate,
  verifyEmail
);

router.post(
  "/verification/resend",
  [body("verificationToken").notEmpty()],
  validate,
  resendVerification
);

router.post(
  "/login",
  authAttemptLimit,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  login
);

router.get("/me", protect, me);
router.delete("/account", protect, deleteAccount);
router.patch(
  "/password",
  protect,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  validate,
  changePassword
);

// Firebase OAuth (Google / Apple) — sends Firebase ID token, gets back our JWT
router.post("/firebase", authAttemptLimit, [body("idToken").notEmpty()], validate, firebaseAuth);
router.post("/password-reset/request", authAttemptLimit, [body("email").isEmail().normalizeEmail()], validate, requestPasswordReset);
router.post("/password-reset/verify", authAttemptLimit, [body("verificationToken").notEmpty(),body("code").matches(/^\d{6}$/)], validate, verifyPasswordReset);
router.post("/password-reset/complete", authAttemptLimit, [body("resetToken").notEmpty(),body("newPassword").isLength({min:8})], validate, resetPassword);

module.exports = router;
