# Security Implementation Checklist

## ✅ COMPLETED

1. **Created RLS Policies** - `backend/supabase/rls_policies.sql`
   - Comprehensive policies for all tables
   - Proper user isolation
   - Protected financial tables

2. **Created Admin Middleware** - `backend/src/middleware/requireAdmin.js`
   - `requireAdmin()` - Requires admin role
   - `requireAdminOrOwner()` - Admin or resource owner

3. **Created Audit System** - `backend/src/services/audit.service.js`
   - Audit logging for critical operations
   - Financial transaction logging
   - Admin action logging

4. **Created Audit Table** - `backend/supabase/audit_logs_table.sql`
   - Tracks all critical operations
   - Retention policy
   - Proper indexes

5. **Verified Existing Security**:
   - ✅ Stripe webhook verification implemented
   - ✅ Idempotency via stripe_webhook_events table
   - ✅ Auth middleware exists and is used
   - ✅ `.gitignore` properly configured

---

## 🔴 IMMEDIATE MANUAL ACTIONS REQUIRED

### 1. ROTATE ALL API KEYS (Do this NOW!)

```bash
# Generate new JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('OTP_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SOCIAL_TOKEN_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Services to update**:
- [ ] Supabase service key (Dashboard → Settings → API)
- [ ] Stripe secret key (Dashboard → Developers → API keys)
- [ ] Stripe webhook secret (Dashboard → Developers → Webhooks)
- [ ] Firebase private key (Console → Service accounts → Generate new)
- [ ] JWT_SECRET (use generated value above)
- [ ] JWT_REFRESH_SECRET (use generated value above)  
- [ ] OTP_SECRET (use generated value above)
- [ ] SOCIAL_TOKEN_ENCRYPTION_KEY (use generated value above)
- [ ] Resend API key (If compromised)
- [ ] USDA API key (If compromised)
- [ ] Gemini/OpenAI API keys (If compromised)

### 2. REMOVE SECRETS FROM GIT HISTORY

⚠️ **WARNING**: This rewrites git history. Coordinate with team first!

```bash
# Backup first!
git clone https://github.com/secureshieldai/Teamcal.git teamcal-backup

# Remove sensitive files from history
cd teamcal
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env .env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - warn team!)
git push origin --force --all
git push origin --force --tags
```

Alternative (safer but requires team coordination):
```bash
# Use BFG Repo-Cleaner (easier)
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files '.env'
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

### 3. APPLY DATABASE CHANGES

Run these SQL files in Supabase SQL editor:

```bash
# 1. Apply RLS policies
# Copy content of: backend/supabase/rls_policies.sql
# Paste into Supabase SQL editor and run

# 2. Create audit logs table  
# Copy content of: backend/supabase/audit_logs_table.sql
# Paste into Supabase SQL editor and run
```

---

## 📋 CODE CHANGES TO APPLY

### 4. Update Marketplace Controller with Audit Logging

Add to `backend/src/controllers/marketplace.controller.js`:

```javascript
const { logFinancialTransaction, AUDIT_ACTIONS } = require('../services/audit.service');

// In createOrder function, after order creation:
await logFinancialTransaction({
  userId: req.user.id,
  action: AUDIT_ACTIONS.ORDER_CREATED,
  amount: totalAmount,
  currency: 'usd',
  orderId: order.id,
  ipAddress: req.ip,
});

// In webhook handler, after payment success:
await logFinancialTransaction({
  userId: order.buyer_id,
  action: AUDIT_ACTIONS.ORDER_PAID,
  amount: object.amount_total,
  currency: object.currency,
  orderId: order.id,
});
```

### 5. Add Admin Routes Protection

Create `backend/src/routes/admin.routes.js`:

```javascript
const express = require("express");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { auditMiddleware, AUDIT_ACTIONS } = require("../services/audit.service");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(requireAdmin);

// Example: Delete user (with audit logging)
router.delete(
  "/users/:id",
  auditMiddleware(AUDIT_ACTIONS.ADMIN_USER_DELETED),
  async (req, res) => {
    // Admin delete user logic
  }
);

module.exports = router;
```

### 6. Add Rate Limiting to Auth Routes

Install express-rate-limit:
```bash
npm install express-rate-limit
```

Update `backend/src/routes/auth.routes.js`:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to sensitive routes
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/forgot-password', authLimiter, forgotPassword);
```

### 7. Add Input Validation Everywhere

Already using express-validator. Ensure ALL routes have validation:

```javascript
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

router.post('/posts', [
  body('text').trim().isLength({ max: 5000 }).withMessage('Post too long'),
  body('images').optional().isArray({ max: 10 }).withMessage('Max 10 images'),
  validate,
], createPost);
```

### 8. Add Security Headers

Install helmet:
```bash
npm install helmet
```

Update `backend/src/app.js`:

```javascript
const helmet = require('helmet');

// Add after other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## 🔧 CONFIGURATION CHANGES

### 9. Update .env.example

Already done, but verify all placeholders are clear:

```env
# NEVER commit real values!
JWT_SECRET=GENERATE_WITH_CRYPTO_RANDOMBYTES_64
JWT_REFRESH_SECRET=GENERATE_WITH_CRYPTO_RANDOMBYTES_64
SUPABASE_SERVICE_KEY=GET_FROM_SUPABASE_DASHBOARD
STRIPE_SECRET_KEY=GET_FROM_STRIPE_DASHBOARD
```

### 10. Add CORS Whitelist

Update `backend/src/app.js`:

```javascript
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:19006',
  'https://teamcal.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

## 📊 MONITORING & ALERTING

### 11. Set Up Error Monitoring

Install Sentry:
```bash
npm install @sentry/node
```

Update `backend/src/app.js`:

```javascript
const Sentry = require("@sentry/node");

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

### 12. Set Up Database Backups

In Supabase Dashboard:
1. Go to Database → Backups
2. Enable automated daily backups
3. Test restoration process

---

## ✅ FINAL CHECKLIST

Before going to production:

- [ ] All API keys rotated
- [ ] Secrets removed from git history
- [ ] Team notified to pull latest changes
- [ ] RLS policies applied in Supabase
- [ ] Audit logs table created
- [ ] Audit logging added to critical endpoints
- [ ] Admin middleware applied to admin routes
- [ ] Rate limiting added to auth routes
- [ ] Helmet security headers added
- [ ] CORS whitelist configured
- [ ] Input validation on all routes verified
- [ ] Error monitoring (Sentry) configured
- [ ] Database backups enabled and tested
- [ ] All .env values are production-safe
- [ ] NODE_ENV=production on server
- [ ] SSL/HTTPS enforced
- [ ] Security audit performed
- [ ] Penetration testing done
- [ ] GDPR/compliance reviewed
- [ ] Incident response plan documented

---

## 📚 DOCUMENTATION

- [Row Level Security Policies](./backend/supabase/rls_policies.sql)
- [Audit Logs System](./backend/src/services/audit.service.js)
- [Admin Middleware](./backend/src/middleware/requireAdmin.js)
- [Security Critical Fixes](./SECURITY_CRITICAL_FIXES_REQUIRED.md)

---

## 🆘 IF BREACH SUSPECTED

1. **Immediately rotate ALL keys**
2. **Review audit logs** for suspicious activity
3. **Notify affected users** if data compromised
4. **Document the incident**
5. **Review and patch vulnerabilities**
6. **Consider legal/compliance obligations**

---

**Status**: Security fixes implemented, manual actions required
**Priority**: CRITICAL - Complete ASAP
**Owner**: Development team
**Last Updated**: 2026-09-02
