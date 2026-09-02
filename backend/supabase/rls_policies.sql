-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- These policies control data access at the database level
-- Apply after running schema.sql

-- Note: Backend uses SUPABASE_SERVICE_KEY which bypasses RLS
-- These policies protect against direct client-side access

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Users can view all non-deleted users (for social features)
create policy "Users can view active users" on users
  for select using (deleted_at is null);

-- Users can only update their own profile
create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- ============================================================================
-- POSTS & SOCIAL
-- ============================================================================
-- Anyone can view non-deleted posts
create policy "Anyone can view posts" on posts
  for select using (deleted_at is null);

-- Users can create their own posts
create policy "Users can create posts" on posts
  for insert with check (auth.uid() = user_id);

-- Users can update/delete their own posts
create policy "Users can update own posts" on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on posts
  for delete using (auth.uid() = user_id);

-- Post comments
create policy "Anyone can view comments" on post_comments
  for select using (true);

create policy "Users can create comments" on post_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments" on post_comments
  for delete using (auth.uid() = user_id);

-- Post likes
create policy "Anyone can view likes" on post_likes
  for select using (true);

create policy "Users can like posts" on post_likes
  for all using (auth.uid() = user_id);

-- ============================================================================
-- TRACKER & PERSONAL DATA
-- ============================================================================
-- Users can only access their own tracker data
create policy "Users can view own tracker entries" on tracker_entries
  for select using (auth.uid() = user_id);

create policy "Users can manage own tracker entries" on tracker_entries
  for all using (auth.uid() = user_id);

-- Fast logs
create policy "Users can view own fast logs" on fast_logs
  for select using (auth.uid() = user_id);

create policy "Users can manage own fast logs" on fast_logs
  for all using (auth.uid() = user_id);

-- Sleep logs
create policy "Users can view own sleep logs" on sleep_logs
  for select using (auth.uid() = user_id);

create policy "Users can manage own sleep logs" on sleep_logs
  for all using (auth.uid() = user_id);

-- User records (saved content, bookmarks, etc.)
create policy "Users can view own records" on user_records
  for select using (auth.uid() = user_id);

create policy "Users can manage own records" on user_records
  for all using (auth.uid() = user_id);

-- ============================================================================
-- WORKOUTS & EXERCISE
-- ============================================================================
-- Users can view published templates or their own workouts
create policy "Users can view workouts" on workouts
  for select using (auth.uid() = user_id or is_template = true);

-- Users can manage only their own workouts
create policy "Users can manage own workouts" on workouts
  for all using (auth.uid() = user_id);

-- Workout logs
create policy "Users can view own workout logs" on workout_logs
  for select using (auth.uid() = user_id);

create policy "Users can manage own workout logs" on workout_logs
  for all using (auth.uid() = user_id);

-- Exercise performances
create policy "Users can view own exercise perf" on exercise_performances
  for select using (auth.uid() = user_id);

create policy "Users can manage own exercise perf" on exercise_performances
  for all using (auth.uid() = user_id);

-- ============================================================================
-- MARKETPLACE & COMMERCE
-- ============================================================================
-- Anyone can view published products
create policy "Anyone can view published products" on marketplace_products
  for select using (is_published = true or auth.uid() = user_id);

-- Users can manage their own products
create policy "Users can manage own products" on marketplace_products
  for all using (auth.uid() = user_id);

-- Orders - buyers and sellers can view their orders
create policy "Users can view own orders" on marketplace_orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Only buyers can create orders (prevents sellers from creating fake orders)
create policy "Users can create orders" on marketplace_orders
  for insert with check (auth.uid() = buyer_id);

-- Sellers can update order status
create policy "Sellers can update orders" on marketplace_orders
  for update using (auth.uid() = seller_id);

-- Payouts - users can view their own
create policy "Users can view own payouts" on payouts
  for select using (auth.uid() = user_id);

create policy "Users can manage own payouts" on payouts
  for all using (auth.uid() = user_id);

-- ============================================================================
-- CHALLENGES & GROUPS
-- ============================================================================
-- Anyone can view challenges
create policy "Anyone can view challenges" on challenges
  for select using (true);

-- Challenge members
create policy "Anyone can view challenge members" on challenge_members
  for select using (true);

create policy "Users can join challenges" on challenge_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave challenges" on challenge_members
  for delete using (auth.uid() = user_id);

-- Groups
create policy "Anyone can view groups" on groups
  for select using (true);

create policy "Users can create groups" on groups
  for insert with check (auth.uid() = created_by);

create policy "Group owners can update groups" on groups
  for update using (auth.uid() = created_by);

-- Group members
create policy "Anyone can view group members" on group_members
  for select using (true);

create policy "Users can join groups" on group_members
  for insert with check (auth.uid() = user_id);

create policy "Users can leave groups" on group_members
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- BLOGS & ARTICLES
-- ============================================================================
-- Anyone can view blog sites
create policy "Anyone can view blog sites" on blog_sites
  for select using (true);

-- Users can manage their own blogs
create policy "Users can manage own blogs" on blog_sites
  for all using (auth.uid() = user_id);

-- Anyone can view published articles
create policy "Anyone can view articles" on articles
  for select using (published = true or auth.uid() = user_id);

-- Users can manage their own articles
create policy "Users can manage own articles" on articles
  for all using (auth.uid() = user_id);

-- ============================================================================
-- EARN & REFERRALS
-- ============================================================================
-- Users can view their own earn entries
create policy "Users can view own earn entries" on earn_entries
  for select using (auth.uid() = user_id);

-- Users can view their referrals
create policy "Users can view own referrals" on referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- ============================================================================
-- HEALTH & APPOINTMENTS
-- ============================================================================
-- Users can view appointments where they're involved
create policy "Users can view own appointments" on appointments
  for select using (auth.uid() = user_id or auth.uid() = with_user_id);

create policy "Users can manage own appointments" on appointments
  for all using (auth.uid() = user_id);

-- Health invites
create policy "Users can view invites involving them" on health_invites
  for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "Users can manage sent invites" on health_invites
  for all using (auth.uid() = inviter_id);

-- ============================================================================
-- SHOPPING & MEAL PLANS
-- ============================================================================
-- Users can manage their own shopping list
create policy "Users can view own shopping" on shopping_items
  for select using (auth.uid() = user_id);

create policy "Users can manage own shopping" on shopping_items
  for all using (auth.uid() = user_id);

-- Meal plans
create policy "Users can view own meal plans" on meal_plans
  for select using (auth.uid() = user_id);

create policy "Users can manage own meal plans" on meal_plans
  for all using (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS & PUSH
-- ============================================================================
-- Users can only see their own push tokens
create policy "Users can view own tokens" on push_tokens
  for select using (auth.uid() = user_id);

create policy "Users can manage own tokens" on push_tokens
  for all using (auth.uid() = user_id);

-- ============================================================================
-- PROTECTED TABLES (Backend only - no client access)
-- ============================================================================
-- These tables should NEVER be accessed directly from client
-- No policies = all operations blocked (except via service_role key)

-- email_verification_otps - backend only
-- stripe_webhook_events - backend only
-- stripe_disputes - backend only  
-- stripe_refunds - backend only

-- ============================================================================
-- ADMIN OPERATIONS
-- ============================================================================
-- For admin operations, backend will use service_role key which bypasses RLS
-- No need for admin policies

-- ============================================================================
-- BOTS  (see bots_schema.sql)
-- ============================================================================
-- All bot management goes through the backend (service key). These policies
-- only guard accidental direct client access.

alter table bots enable row level security;
alter table bot_space_connections enable row level security;
alter table bot_automations enable row level security;
alter table bot_sequences enable row level security;
alter table bot_scheduled_items enable row level security;
alter table bot_conversations enable row level security;
alter table bot_messages enable row level security;
alter table bot_leads enable row level security;
alter table bot_notes enable row level security;
alter table bot_events enable row level security;

-- Owners can manage their own bots; anyone may read an active bot (public link).
create policy "Owners manage own bots" on bots
  for all using (auth.uid() = owner_id);
create policy "Anyone can view active bots" on bots
  for select using (status = 'active');

-- Child tables: owner of the parent bot only.
create policy "Owner manages bot connections" on bot_space_connections
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner manages bot automations" on bot_automations
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner manages bot sequences" on bot_sequences
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner manages bot scheduled items" on bot_scheduled_items
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner manages bot conversations" on bot_conversations
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner reads bot messages" on bot_messages
  for all using (exists (
    select 1 from bot_conversations c join bots b on b.id = c.bot_id
    where c.id = conversation_id and b.owner_id = auth.uid()));
create policy "Owner manages bot leads" on bot_leads
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));
create policy "Owner manages bot notes" on bot_notes
  for all using (exists (
    select 1 from bot_conversations c join bots b on b.id = c.bot_id
    where c.id = conversation_id and b.owner_id = auth.uid()));
create policy "Owner reads bot events" on bot_events
  for all using (exists (select 1 from bots b where b.id = bot_id and b.owner_id = auth.uid()));

