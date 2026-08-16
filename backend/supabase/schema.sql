-- ============================================================
-- TeamCal – Supabase PostgreSQL Schema
-- Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger (defined first — referenced by all tables)
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique not null,
  password_hash       text not null,
  name                text default '',
  bio                 text default '',
  avatar              text,
  dm_enabled          boolean default true,
  verified            boolean default false,
  verified_at         bigint,

  -- body metrics
  age                 int,
  height_cm           numeric,
  weight_kg           numeric,
  gender              text check (gender in ('male','female','other')),

  -- preferences
  goals               text[] default '{}',
  fasting_plan        text default '16:8',
  fast_hours          int default 16,
  eat_hours           int default 8,
  onboarding_complete boolean default false,

  -- gamification
  level               int default 1,
  xp                  int default 0,
  coins               int default 0,

  -- notification prefs
  notif_milestones    boolean default true,
  notif_streaks       boolean default true,
  notif_hydration     boolean default true,
  notif_insights      boolean default true,
  notif_contests      boolean default true,
  notif_social        boolean default false,
  notif_commerce      boolean default false,
  notif_updates       boolean default true,

  -- daily goals
  goal_fast_hours     numeric default 16,
  goal_water_ml       int default 2500,
  goal_steps          int default 8000,
  goal_sleep_hours    numeric default 8,
  goal_kcal           int default 2000,
  goal_protein_g      int default 140,
  goal_carbs_g        int default 200,
  goal_fats_g         int default 65,
  goal_weight_kg      numeric default 75,
  goal_focus_areas    text[] default '{}',

  -- referral
  referred_by         uuid references users(id) on delete set null,
  referral_code       text unique,
  terms_accepted_at   timestamptz,
  terms_version       text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists email_verification_otps (
  user_id       uuid primary key references users(id) on delete cascade,
  code_hash     text not null,
  expires_at    timestamptz not null,
  attempts      int not null default 0,
  last_sent_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

do $$ begin
  create trigger trg_users_updated_at
    before update on users for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- FASTING LOGS
-- ─────────────────────────────────────────────────────────────
create table if not exists fast_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  protocol       text not null,               -- e.g. "16:8", "18:6", "OMAD"
  started_at     bigint not null,             -- unix ms
  ended_at       bigint,
  target_hours   numeric not null,
  achieved_hours numeric default 0,
  active         boolean default false,
  created_at     timestamptz default now()
);

create index if not exists idx_fast_logs_user_id     on fast_logs(user_id);
create index if not exists idx_fast_logs_user_active  on fast_logs(user_id, active);
create index if not exists idx_fast_logs_started_at   on fast_logs(user_id, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- SLEEP LOGS (tap-to-sleep active session tracking)
-- ─────────────────────────────────────────────────────────────
create table if not exists sleep_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  started_at     bigint not null,
  ended_at       bigint,
  duration_hours numeric,
  score          int,
  stages         jsonb, -- {awake,light,rem,deep} percentages
  active         boolean default false,
  created_at     timestamptz default now()
);

create index if not exists idx_sleep_logs_user_id    on sleep_logs(user_id);
create index if not exists idx_sleep_logs_user_active on sleep_logs(user_id, active);
create index if not exists idx_sleep_logs_started_at on sleep_logs(user_id, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- TRACKER ENTRIES
-- Generic time-series log for: calories, water, steps, weight,
-- workouts, sleep, meals, meal-scan
-- ─────────────────────────────────────────────────────────────
create table if not exists tracker_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  tracker    text not null,   -- 'calories'|'water'|'steps'|'weight'|'workouts'|'sleep'|'meals'|'meal-scan'
  ts         bigint not null, -- unix ms
  value      numeric not null,
  meta       jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_tracker_entries_user_tracker on tracker_entries(user_id, tracker, ts desc);
create unique index if not exists idx_unique_synced_steps_per_source_day
  on tracker_entries(user_id, tracker, (meta->>'syncKey'))
  where tracker = 'steps' and meta ? 'syncKey';

-- ─────────────────────────────────────────────────────────────
-- POSTS  (community feed)
-- ─────────────────────────────────────────────────────────────
create table if not exists posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  text            text default '',
  image           text,
  image_urls      text[] not null default '{}',
  likes           int default 0,
  liked_by        uuid[] default '{}',
  community       text,         -- group id when post belongs to a group
  community_cover text,
  deleted_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_posts_user_id on posts(user_id, created_at desc);
create index if not exists idx_posts_feed    on posts(created_at desc) where deleted_at is null;

do $$ begin
  create trigger trg_posts_updated_at
    before update on posts for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Relational comments and likes for persisted community posts.
create table if not exists post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  body       text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post on post_comments(post_id, created_at);
create index if not exists idx_post_comments_user on post_comments(user_id, created_at desc);

do $$ begin
  create trigger trg_post_comments_updated_at
    before update on post_comments for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

create table if not exists post_likes (
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists idx_post_likes_user on post_likes(user_id, created_at desc);

-- Creator publishing data used by /api/blogs.
create table if not exists blog_sites (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  name                text not null,
  slug                text not null,
  category            text,
  language            text default 'English',
  country             text default 'US',
  description         text default '',
  logo                text,
  cover               text,
  theme               text default 'clean',
  writing_style       text default '',
  ai_prefs            text default '',
  monetizations       jsonb default '[]',
  auto_blog_enabled   boolean default false,
  auto_blog_frequency text default 'weekly',
  auto_blog_topics    jsonb default '[]',
  auto_blog_tone      text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (user_id, slug)
);
create index if not exists idx_blog_sites_user on blog_sites(user_id, created_at desc);
do $$ begin create trigger trg_blog_sites_updated_at before update on blog_sites for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  blog_id       uuid not null references blog_sites(id) on delete cascade,
  title         text not null,
  cover         text,
  body          text default '',
  category      text,
  tags          text[] default '{}',
  status        text default 'draft',
  scheduled_for timestamptz,
  read_minutes  int default 1,
  views         bigint default 0,
  earned        numeric default 0,
  daily         jsonb default '[]',
  daily_earn    jsonb default '[]',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_articles_user on articles(user_id, created_at desc);
create index if not exists idx_articles_blog on articles(blog_id, created_at desc);
do $$ begin create trigger trg_articles_updated_at before update on articles for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────────────────────────
create table if not exists challenges (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid references users(id) on delete set null,
  title         text not null,
  description   text default '',
  photo         text,
  icon          text default 'trophy-outline',
  icon_color    text default '#FF6A2B',
  duration_days int not null default 7,
  total_days    int not null default 7,
  joined_count  int default 0,
  is_featured   boolean default false,
  is_public     boolean default true,
  status        text default 'active' check (status in ('active','completed','archived')),
  starts_at     bigint,
  ends_at       bigint,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_challenges_status   on challenges(status, created_at desc);
create index if not exists idx_challenges_featured on challenges(is_featured) where is_featured = true;

do $$ begin
  create trigger trg_challenges_updated_at
    before update on challenges for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- CHALLENGE MEMBERS
-- ─────────────────────────────────────────────────────────────
create table if not exists challenge_members (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  joined_at    timestamptz default now(),
  current_day  int default 0,
  completed    boolean default false,
  unique (challenge_id, user_id)
);

create index if not exists idx_challenge_members_user_id      on challenge_members(user_id);
create index if not exists idx_challenge_members_challenge_id on challenge_members(challenge_id);

-- ─────────────────────────────────────────────────────────────
-- GROUPS  (Power Squads / Teams)
-- ─────────────────────────────────────────────────────────────
create table if not exists groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text default '',
  cover        text,
  avatar       text,
  metadata     jsonb not null default '{}',
  is_private   boolean default false,
  member_count int default 1,
  created_by   uuid not null references users(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_groups_created_by on groups(created_by);

do $$ begin
  create trigger trg_groups_updated_at
    before update on groups for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- GROUP MEMBERS
-- ─────────────────────────────────────────────────────────────
create table if not exists group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  role      text default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

create index if not exists idx_group_members_user_id  on group_members(user_id);
create index if not exists idx_group_members_group_id on group_members(group_id);

-- ─────────────────────────────────────────────────────────────
-- WORKOUTS  (templates + user-created plans)
-- ─────────────────────────────────────────────────────────────
create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,
  title       text not null,
  subtitle    text default '',
  duration    int default 45,             -- minutes
  difficulty  text default 'intermediate' check (difficulty in ('beginner','intermediate','advanced')),
  category    text default 'strength',
  is_template boolean default false,
  is_public   boolean default true,
  exercises   jsonb default '[]',         -- [{ id, name, detail, sets, reps, restSeconds, notes, muscles, image }]
  scheduled_days jsonb not null default '[]', -- ['Mon','Thu']
  rest_days      jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_workouts_user_id  on workouts(user_id);
create index if not exists idx_workouts_template on workouts(is_template) where is_template = true;

do $$ begin
  create trigger trg_workouts_updated_at
    before update on workouts for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- WORKOUT LOGS  (completed sessions)
-- ─────────────────────────────────────────────────────────────
create table if not exists workout_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  workout_id uuid references workouts(id) on delete set null,
  title      text not null,
  duration   int,
  exercises  jsonb default '[]',
  notes      text default '',
  started_at bigint not null,
  ended_at   bigint,
  created_at timestamptz default now()
);

create index if not exists idx_workout_logs_user_id on workout_logs(user_id, started_at desc);

-- ─────────────────────────────────────────────────────────────
-- MARKETPLACE PRODUCTS
-- ─────────────────────────────────────────────────────────────
create table if not exists marketplace_products (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid references users(id) on delete set null,
  title       text not null,
  description text default '',
  photo       text,
  price       numeric not null default 0,
  currency    text default 'USD',
  category    text not null,             -- 'healthy-meals'|'supplements'|'trainers'|'workouts'|'ebooks'|'programs'|'equipment'|'coaching'
  is_featured boolean default false,
  is_active   boolean default true,
  sold_count  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_marketplace_category on marketplace_products(category, created_at desc);
create index if not exists idx_marketplace_featured on marketplace_products(is_featured) where is_featured = true;

do $$ begin
  create trigger trg_marketplace_updated_at
    before update on marketplace_products for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- EARN ENTRIES  (points ledger)
-- ─────────────────────────────────────────────────────────────
create table if not exists earn_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  source     text not null check (source in (
               'referral','challenge','daily-checkin','workout','meal-log','bonus','contest'
             )),
  label      text not null,
  amount     numeric not null check (amount >= 0),
  created_at timestamptz default now()
);

create index if not exists idx_earn_entries_user_id on earn_entries(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- REFERRALS
-- ─────────────────────────────────────────────────────────────
create table if not exists referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references users(id) on delete cascade,
  referred_user_id uuid references users(id) on delete set null,
  name             text not null,
  status           text default 'invited' check (status in ('invited','joined','converted')),
  reward           numeric default 0,
  created_at       timestamptz default now()
);

create index if not exists idx_referrals_referrer_id on referrals(referrer_id);

-- ─────────────────────────────────────────────────────────────
-- PAYOUTS
-- ─────────────────────────────────────────────────────────────
create table if not exists payouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references users(id) on delete cascade,
  connected  boolean default false,
  provider   text check (provider in ('stripe','paypal','bank') or provider is null),
  account    text default '',
  pending    numeric default 0,
  paid_out   numeric default 0,
  history    jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$ begin
  create trigger trg_payouts_updated_at
    before update on payouts for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- APPOINTMENTS  (coach / health pro bookings)
-- ─────────────────────────────────────────────────────────────
create table if not exists appointments (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id) on delete cascade,
  pro_id    text not null,
  pro_name  text not null,
  pro_role  text not null,
  type      text not null check (type in ('video','chat')),
  ts        bigint not null,
  duration  int not null,
  notes     text default '',
  status    text default 'upcoming' check (status in ('upcoming','completed','canceled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_appointments_user_id on appointments(user_id, ts desc);

do $$ begin
  create trigger trg_appointments_updated_at
    before update on appointments for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- HEALTH INVITES  (share data with doctor / nutritionist)
-- ─────────────────────────────────────────────────────────────
create table if not exists health_invites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  email       text not null,
  name        text,
  role        text,
  access      text[] default '{}',
  status      text default 'pending' check (status in ('pending','accepted','declined')),
  sent_at     bigint not null,
  accepted_at bigint,
  created_at  timestamptz default now()
);

create index if not exists idx_health_invites_user_id on health_invites(user_id);

-- ─────────────────────────────────────────────────────────────
-- SHOPPING ITEMS  (AI grocery list)
-- ─────────────────────────────────────────────────────────────
create table if not exists shopping_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  qty        text,
  checked    boolean default false,
  source     text,
  ts         bigint not null,
  created_at timestamptz default now()
);

create index if not exists idx_shopping_items_user_id on shopping_items(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- PUSH TOKENS
-- ─────────────────────────────────────────────────────────────
create table if not exists push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token      text not null unique,
  platform   text check (platform in ('ios','android','web')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_push_tokens_user_id on push_tokens(user_id);

do $$ begin
  create trigger trg_push_tokens_updated_at
    before update on push_tokens for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Backend uses service_role key which bypasses RLS.
-- Enabled as a safety net against accidental anon key usage.
-- ─────────────────────────────────────────────────────────────
alter table users                enable row level security;
alter table email_verification_otps enable row level security;
alter table fast_logs            enable row level security;
alter table tracker_entries      enable row level security;
alter table posts                enable row level security;
alter table post_comments        enable row level security;
alter table post_likes           enable row level security;
alter table blog_sites           enable row level security;
alter table articles             enable row level security;
alter table challenges           enable row level security;
alter table challenge_members    enable row level security;
alter table groups               enable row level security;
alter table group_members        enable row level security;
alter table workouts             enable row level security;
alter table workout_logs         enable row level security;
alter table marketplace_products enable row level security;
alter table earn_entries         enable row level security;
alter table referrals            enable row level security;
alter table payouts              enable row level security;
alter table appointments         enable row level security;
alter table health_invites       enable row level security;
alter table shopping_items       enable row level security;
alter table push_tokens          enable row level security;

-- User-owned content remains separate from bundled frontend showcase records.
create table if not exists user_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  kind text not null, external_key text, data jsonb not null default '{}', status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, kind, external_key)
);
create index if not exists idx_user_records_owner_kind on user_records(user_id, kind, updated_at desc);
do $$ begin create trigger trg_user_records_updated_at before update on user_records for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
alter table user_records enable row level security;

-- Stripe Connect and marketplace payment lifecycle.
alter table payouts add column if not exists stripe_account_id text unique;
alter table payouts add column if not exists stripe_details_submitted boolean not null default false;
alter table payouts add column if not exists stripe_charges_enabled boolean not null default false;
alter table payouts add column if not exists stripe_payouts_enabled boolean not null default false;
alter table payouts add column if not exists stripe_account_status text not null default 'not-connected';

create table if not exists marketplace_orders (
  id uuid primary key default gen_random_uuid(), buyer_id uuid not null references users(id) on delete cascade, seller_id uuid not null references users(id) on delete cascade,
  currency text not null, total_amount bigint not null check(total_amount>=0), platform_fee_amount bigint not null default 0,
  status text not null, items jsonb not null default '[]', stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique, paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_marketplace_orders_buyer on marketplace_orders(buyer_id,created_at desc);
create index if not exists idx_marketplace_orders_seller on marketplace_orders(seller_id,created_at desc);
create table if not exists stripe_refunds (id text primary key,order_id uuid not null references marketplace_orders(id) on delete cascade,amount bigint not null,currency text not null,status text,reason text,requested_by uuid references users(id) on delete set null,raw jsonb,created_at timestamptz not null default now());
create table if not exists stripe_disputes (id text primary key,order_id uuid references marketplace_orders(id),charge_id text,payment_intent_id text,amount bigint,currency text,reason text,status text,evidence_due_by timestamptz,raw jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists stripe_webhook_events (id text primary key,type text not null,stripe_account_id text,livemode boolean not null default false,processed_at timestamptz not null default now());
do $$ begin create trigger trg_marketplace_orders_updated_at before update on marketplace_orders for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger trg_stripe_disputes_updated_at before update on stripe_disputes for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
create or replace function increment_product_sold_count(product_id uuid,increment_by int default 1) returns void language sql as $$ update marketplace_products set sold_count=coalesce(sold_count,0)+greatest(increment_by,0) where id=product_id; $$;
alter table marketplace_orders enable row level security;alter table stripe_refunds enable row level security;alter table stripe_disputes enable row level security;alter table stripe_webhook_events enable row level security;

-- AI-generated meal plans (wizard preferences + generated days/meals as jsonb).
create table if not exists meal_plans (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references users(id) on delete cascade,
  duration_days        int not null default 7,
  daily_calories       int not null default 2000,
  meal_types           jsonb not null default '["breakfast","lunch","dinner","snack"]',
  dietary_restrictions jsonb not null default '[]',
  diet_preference      text not null default 'balanced',
  allergies            jsonb not null default '[]',
  health_conditions    jsonb not null default '[]',
  notes                text default '',
  days                 jsonb not null default '[]',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_meal_plans_user on meal_plans(user_id, created_at desc);
do $$ begin create trigger trg_meal_plans_updated_at before update on meal_plans for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
alter table meal_plans enable row level security;

-- Per-set exercise performance history (powers Previous/Target progression and personal records).
create table if not exists exercise_performances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  exercise_name text not null,
  set_index     int not null default 1,
  weight        numeric not null default 0,
  reps          int not null default 0,
  ts            bigint not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_exercise_perf_user_exercise on exercise_performances(user_id, exercise_name, set_index, ts desc);
alter table exercise_performances enable row level security;

-- Smart-alarm preferences (settings only — no server-side notification scheduling yet).
alter table users add column if not exists sleep_alarm_prefs jsonb not null default '{"wakeTime":"06:30","smartAlarm":true,"wakeWindowMin":30,"sound":"Sunrise"}';
alter table sleep_logs enable row level security;
