# 🚨 CRITICAL SECURITY FIXES REQUIRED

## ⚠️ IMMEDIATE ACTIONS (Do these RIGHT NOW)

### 1. EXPOSED SECRETS IN GIT HISTORY ❌
**Status**: CRITICAL - Secrets are committed to git

**Files compromised**:
- `backend/.env` (committed with real secrets)
- Contains: Supabase keys, Stripe keys, Firebase private key, JWT secrets

**Actions Required**:
1. **ROTATE ALL KEYS IMMEDIATELY**:
   - Supabase service key (Supabase dashboard → Settings → API)
   - Stripe secret keys (Stripe dashboard → Developers → API keys)
   - Firebase private key (Firebase console → Service accounts)
   - Generate new JWT secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - Resend API key
   - USDA API key
   - All social media client secrets

2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   git push origin --force --tags
   ```

3. **Update .env files** with new secrets (already in .gitignore)

---

### 2. NO ROW LEVEL SECURITY POLICIES ❌
**Status**: CRITICAL - Database is wide open

**Problem**: Anyone can query/modify any data directly via Supabase client

**Fix Required**: Add RLS policies to schema.sql (see section below)

---

### 3. STRIPE WEBHOOK VERIFICATION MISSING ❌
**Status**: CRITICAL - Payment fraud possible

**Current code** in `marketplace.controller.js`:
```javascript
// NO SIGNATURE VERIFICATION!
async function stripeWebhook(req, res) {
  const event = req.body;
  // processes payments without verifying they're from Stripe
}
```

**Fix Required**: Verify webhook signatures

---

### 4. NO IDEMPOTENCY ON FINANCIAL TRANSACTIONS ❌
**Status**: CRITICAL - Duplicate charges possible

**Problem**: No idempotency keys, users can be charged multiple times

**Fix Required**: Add idempotency checks

---

### 5. JWT_SECRET SET TO PLACEHOLDER ❌
**Status**: CRITICAL - Tokens can be forged

**Current value**: `change_this_to_a_long_random_secret_at_least_64_chars`

**Fix Required**: Generate secure random secret

---

## 🔴 HIGH PRIORITY FIXES

### 6. Missing Authentication on Some Routes
**Routes to check**:
- Auth routes (login, register) - should be public ✓
- Webhook routes - need signature verification
- Public showcase routes - need sanitization

### 7. No Admin Role Checking
**Problem**: No middleware to verify admin privileges

**Fix Required**: Create `requireAdmin` middleware

### 8. No Rate Limiting on Critical Endpoints
**Problem**: Limited rate limiting implementation

**Current**: Only on AI endpoints

**Fix Required**: Add to auth, payments, data modification

### 9. No Audit Trail
**Problem**: No logging of financial/admin actions

**Fix Required**: Add audit_log table and logging

### 10. No Input Sanitization
**Problem**: SQL injection, XSS possible

**Fix Required**: Add validation middleware everywhere

---

## 📋 ROW LEVEL SECURITY POLICIES TO ADD

Add to `schema.sql` after all table creations:

```sql
-- Users can only read/update their own data
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Posts
create policy "Users can view non-deleted posts" on posts
  for select using (deleted_at is null);

create policy "Users can create own posts" on posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts" on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on posts
  for delete using (auth.uid() = user_id);

-- Marketplace products
create policy "Anyone can view published products" on marketplace_products
  for select using (is_published = true);

create policy "Sellers can manage own products" on marketplace_products
  for all using (auth.uid() = user_id);

-- Orders - users can only see their own
create policy "Users can view own orders" on marketplace_orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Workouts
create policy "Users can view own workouts" on workouts
  for select using (auth.uid() = user_id or is_template = true);

create policy "Users can manage own workouts" on workouts
  for all using (auth.uid() = user_id);

-- Add similar policies for ALL tables...
```

---

## 🛠️ FIXES IN PROGRESS

1. ✅ Auth middleware exists and is applied to most routes
2. ⏳ Need to add webhook verification
3. ⏳ Need to add RLS policies
4. ⏳ Need to rotate all keys
5. ⏳ Need to add admin middleware
6. ⏳ Need to add audit logging

---

## 📊 SECURITY CHECKLIST

- [ ] All secrets rotated
- [ ] Secrets removed from git history
- [ ] JWT_SECRET is strong random value
- [ ] RLS policies added to all tables
- [ ] Stripe webhook signature verification
- [ ] Idempotency keys on payments
- [ ] Admin role middleware
- [ ] Rate limiting on auth endpoints
- [ ] Input validation everywhere
- [ ] Audit logging for financial actions
- [ ] Database backup strategy
- [ ] Error messages don't leak info
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Security headers added

---

## 🚀 DEPLOYMENT SECURITY

Before going to production:
1. Environment variables properly set
2. Debug mode disabled
3. Error logging (not console.log)
4. Database backups automated
5. Monitoring/alerting setup
6. Security audit completed
7. Penetration testing done
8. GDPR/privacy compliance checked

---

**NEXT STEPS**: I will now start implementing these fixes systematically, starting with the most critical ones.
