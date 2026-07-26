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
