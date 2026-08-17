-- ============================================================
-- TeamCal – Supabase Migrations
-- Run these ONLY if you already applied schema.sql from a
-- previous version. New setups should only run schema.sql.
-- ============================================================

-- Migration 001: Ensure appointments.pro_id is text
alter table if exists appointments
  alter column pro_id type text using pro_id::text;

-- Migration 002: Refresh earn_entries source constraint to TeamCal values
alter table if exists earn_entries
  drop constraint if exists earn_entries_source_check;

alter table if exists earn_entries
  add constraint earn_entries_source_check
  check (source in ('referral','challenge','daily-checkin','workout','meal-log','bonus','contest'));

-- Migration 003: Performance indexes
create index if not exists idx_fast_logs_started_at   on fast_logs(user_id, started_at desc);
create index if not exists idx_tracker_entries_ts      on tracker_entries(user_id, tracker, ts desc);
create unique index if not exists idx_unique_synced_steps_per_source_day
  on tracker_entries(user_id, tracker, (meta->>'syncKey'))
  where tracker = 'steps' and meta ? 'syncKey';

-- Migration 004: retained for numbering compatibility. Blog routes are active,
-- so their backing tables must not be dropped.

-- Migration 005: Normalize community comments and likes.
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
  create trigger trg_post_comments_updated_at before update on post_comments
  for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_post_likes_user on post_likes(user_id, created_at desc);

insert into post_comments (id, post_id, user_id, body, created_at)
select te.id, (te.meta->>'postId')::uuid, te.user_id, trim(te.meta->>'text'),
       coalesce(te.created_at, to_timestamp(te.ts / 1000.0))
from tracker_entries te
where te.tracker = 'post-comment'
  and te.meta->>'postId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and nullif(trim(te.meta->>'text'), '') is not null
  and exists (select 1 from posts p where p.id = (te.meta->>'postId')::uuid)
on conflict (id) do nothing;

insert into post_likes (post_id, user_id)
select p.id, liked_user
from posts p cross join lateral unnest(coalesce(p.liked_by, '{}'::uuid[])) liked_user
on conflict (post_id, user_id) do nothing;

update posts p set likes = (select count(*) from post_likes pl where pl.post_id = p.id);
alter table post_comments enable row level security;
alter table post_likes enable row level security;

-- Migration 006: Restore the backing tables for registered /api/blogs routes.
create table if not exists email_verification_otps (
  user_id uuid primary key references users(id) on delete cascade,
  code_hash text not null, expires_at timestamptz not null, attempts int not null default 0,
  last_sent_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists blog_sites (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  name text not null, slug text not null, category text, language text default 'English', country text default 'US',
  description text default '', logo text, cover text, theme text default 'clean', writing_style text default '',
  ai_prefs text default '', monetizations jsonb default '[]', auto_blog_enabled boolean default false,
  auto_blog_frequency text default 'weekly', auto_blog_topics jsonb default '[]', auto_blog_tone text,
  created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id, slug)
);
create index if not exists idx_blog_sites_user on blog_sites(user_id, created_at desc);
do $$ begin create trigger trg_blog_sites_updated_at before update on blog_sites for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;

create table if not exists articles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  blog_id uuid not null references blog_sites(id) on delete cascade, title text not null, cover text, body text default '',
  category text, tags text[] default '{}', status text default 'draft', scheduled_for timestamptz, read_minutes int default 1,
  views bigint default 0, earned numeric default 0, daily jsonb default '[]', daily_earn jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists idx_articles_user on articles(user_id, created_at desc);
create index if not exists idx_articles_blog on articles(blog_id, created_at desc);
do $$ begin create trigger trg_articles_updated_at before update on articles for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
alter table email_verification_otps enable row level security;
alter table blog_sites enable row level security;
alter table articles enable row level security;

-- Migration 007: Extend challenges with type/goal/capacity/rules for the guided creation flow.
alter table if exists challenges add column if not exists challenge_type text default 'cyustom';
alter table if exists challenges add column if not exists goal_target numeric;
alter table if exists challenges add column if not exists goal_unit text;
alter table if exists challenges add column if not exists max_participants int;
alter table if exists challenges add column if not exists rules text;

-- Migration 008: User-owned content, separate from frontend showcase data.
create table if not exists user_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  kind text not null, external_key text, data jsonb not null default '{}', status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, kind, external_key)
);
create index if not exists idx_user_records_owner_kind on user_records(user_id, kind, updated_at desc);
do $$ begin create trigger trg_user_records_updated_at before update on user_records for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
alter table user_records enable row level security;

-- Migration 009: Stripe Connect accounts, Checkout orders, refunds, disputes, and idempotent webhooks.
alter table payouts add column if not exists stripe_account_id text unique;
alter table payouts add column if not exists stripe_details_submitted boolean not null default false;
alter table payouts add column if not exists stripe_charges_enabled boolean not null default false;
alter table payouts add column if not exists stripe_payouts_enabled boolean not null default false;
alter table payouts add column if not exists stripe_account_status text not null default 'not-connected';
create table if not exists marketplace_orders (id uuid primary key default gen_random_uuid(),buyer_id uuid not null references users(id),seller_id uuid not null references users(id),currency text not null,total_amount bigint not null check(total_amount>=0),platform_fee_amount bigint not null default 0,status text not null,items jsonb not null default '[]',stripe_checkout_session_id text unique,stripe_payment_intent_id text unique,paid_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table marketplace_products add column if not exists store_id uuid references user_records(id) on delete cascade;
alter table marketplace_orders add column if not exists store_id uuid references user_records(id) on delete set null;
create index if not exists idx_marketplace_products_store on marketplace_products(store_id,created_at desc);
create index if not exists idx_marketplace_orders_store on marketplace_orders(store_id,created_at desc);
with single_stores as (select user_id,min(id::text)::uuid as store_id from user_records where kind='earn-store' group by user_id having count(*)=1) update marketplace_products p set store_id=s.store_id from single_stores s where p.seller_id=s.user_id and p.store_id is null;
update marketplace_orders o set store_id=p.store_id from marketplace_products p where o.store_id is null and p.id=(o.items->0->>'id')::uuid and p.store_id is not null;
create index if not exists idx_marketplace_orders_buyer on marketplace_orders(buyer_id,created_at desc);create index if not exists idx_marketplace_orders_seller on marketplace_orders(seller_id,created_at desc);
create table if not exists stripe_refunds (id text primary key,order_id uuid not null references marketplace_orders(id),amount bigint not null,currency text not null,status text,reason text,requested_by uuid references users(id),raw jsonb,created_at timestamptz not null default now());
create table if not exists stripe_disputes (id text primary key,order_id uuid references marketplace_orders(id),charge_id text,payment_intent_id text,amount bigint,currency text,reason text,status text,evidence_due_by timestamptz,raw jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists stripe_webhook_events (id text primary key,type text not null,stripe_account_id text,livemode boolean not null default false,processed_at timestamptz not null default now());
do $$ begin create trigger trg_marketplace_orders_updated_at before update on marketplace_orders for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;do $$ begin create trigger trg_stripe_disputes_updated_at before update on stripe_disputes for each row execute function set_updated_at(); exception when duplicate_object then null; end $$;
create or replace function increment_product_sold_count(product_id uuid,increment_by int default 1) returns void language sql as $$ update marketplace_products set sold_count=coalesce(sold_count,0)+greatest(increment_by,0) where id=product_id; $$;
alter table marketplace_orders enable row level security;alter table stripe_refunds enable row level security;alter table stripe_disputes enable row level security;alter table stripe_webhook_events enable row level security;

-- Migration 010: Ordered multi-image social posts (legacy image remains as a cover).
alter table if exists posts add column if not exists image_urls text[] not null default '{}';
update posts set image_urls = array[image] where image is not null and cardinality(image_urls) = 0;

-- Migration 011: AI-generated meal plans (wizard preferences + generated days/meals as jsonb).
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

-- Migration 012: Workout scheduling + per-set exercise performance history (Previous/Target, PRs).
alter table if exists workouts add column if not exists scheduled_days jsonb not null default '[]';
alter table if exists workouts add column if not exists rest_days jsonb not null default '[]';
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

-- Migration 013: Sleep tracker (tap-to-sleep active sessions + smart-alarm preferences).
create table if not exists sleep_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  started_at     bigint not null,
  ended_at       bigint,
  duration_hours numeric,
  score          int,
  stages         jsonb,
  active         boolean default false,
  created_at     timestamptz default now()
);
create index if not exists idx_sleep_logs_user_id on sleep_logs(user_id);
create index if not exists idx_sleep_logs_user_active on sleep_logs(user_id, active);
create index if not exists idx_sleep_logs_started_at on sleep_logs(user_id, started_at desc);
alter table users add column if not exists sleep_alarm_prefs jsonb not null default '{"wakeTime":"06:30","smartAlarm":true,"wakeWindowMin":30,"sound":"Sunrise"}';
alter table sleep_logs enable row level security;

-- Migration 014: auditable legal consent captured during email registration.
alter table users add column if not exists terms_accepted_at timestamptz;
alter table users add column if not exists terms_version text;

-- Account deletion must not be blocked by referral or commerce relationships.
alter table users drop constraint if exists users_referred_by_fkey;
alter table users add constraint users_referred_by_fkey foreign key (referred_by) references users(id) on delete set null;
alter table referrals drop constraint if exists referrals_referred_user_id_fkey;
alter table referrals add constraint referrals_referred_user_id_fkey foreign key (referred_user_id) references users(id) on delete set null;
alter table marketplace_orders drop constraint if exists marketplace_orders_buyer_id_fkey;
alter table marketplace_orders add constraint marketplace_orders_buyer_id_fkey foreign key (buyer_id) references users(id) on delete cascade;
alter table marketplace_orders drop constraint if exists marketplace_orders_seller_id_fkey;
alter table marketplace_orders add constraint marketplace_orders_seller_id_fkey foreign key (seller_id) references users(id) on delete cascade;
alter table stripe_refunds drop constraint if exists stripe_refunds_order_id_fkey;
alter table stripe_refunds add constraint stripe_refunds_order_id_fkey foreign key (order_id) references marketplace_orders(id) on delete cascade;
alter table stripe_refunds drop constraint if exists stripe_refunds_requested_by_fkey;
alter table stripe_refunds add constraint stripe_refunds_requested_by_fkey foreign key (requested_by) references users(id) on delete set null;

-- Migration 015: Persist the guided community workflow settings.
alter table if exists groups add column if not exists metadata jsonb not null default '{}';
