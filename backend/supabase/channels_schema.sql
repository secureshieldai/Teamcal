-- ============================================================
-- TEAMCAL CHANNELS SYSTEM - Database Schema
-- Run this after the main schema.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- CHANNELS
-- ─────────────────────────────────────────────────────────────
create table if not exists channels (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references users(id) on delete cascade,
  name                  text not null,
  username              text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  description           text default '',
  avatar                text,
  cover_image           text,
  category              text default 'general',
  rules                 text default '',
  
  -- visibility & permissions
  is_public             boolean default true,
  allow_comments        boolean default true,
  allow_reactions       boolean default true,
  allow_sharing         boolean default true,
  allow_downloads       boolean default false,
  
  -- analytics (basic)
  follower_count        int default 0,
  post_count            int default 0,
  
  -- monetization (phase 4)
  is_monetized          boolean default false,
  monetization_status   text check (monetization_status in ('not_applied','pending','approved','rejected')),
  monetization_applied_at timestamptz,
  monetization_approved_at timestamptz,
  revenue_share_percent numeric default 40 check (revenue_share_percent >= 0 and revenue_share_percent <= 100),
  
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

drop index if exists idx_channels_owner;
drop index if exists idx_channels_username;
drop index if exists idx_channels_category;
drop index if exists idx_channels_public;
create index idx_channels_owner on channels(owner_id);
create index idx_channels_username on channels(username);
create index idx_channels_category on channels(category);
create index idx_channels_public on channels(is_public) where is_public = true;

drop trigger if exists channels_updated_at on channels;
create trigger channels_updated_at before update on channels
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_MEMBERS
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_members (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references channels(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  role          text default 'follower' check (role in ('owner','admin','moderator','follower')),
  
  -- permissions (for admins/mods)
  can_post      boolean default false,
  can_edit      boolean default false,
  can_delete    boolean default false,
  can_pin       boolean default false,
  can_moderate  boolean default false,
  can_manage    boolean default false,
  
  followed_at   timestamptz default now(),
  
  unique(channel_id, user_id)
);

drop index if exists idx_channel_members_channel;
drop index if exists idx_channel_members_user;
drop index if exists idx_channel_members_role;
create index idx_channel_members_channel on channel_members(channel_id);
create index idx_channel_members_user on channel_members(user_id);
create index idx_channel_members_role on channel_members(channel_id, role);

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_POSTS
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_posts (
  id              uuid primary key default gen_random_uuid(),
  channel_id      uuid not null references channels(id) on delete cascade,
  author_id       uuid not null references users(id) on delete cascade,
  
  content_type    text not null check (content_type in ('text','image','video','audio','document','link','poll','announcement')),
  text_content    text,
  media_url       text,
  link_url        text,
  link_title      text,
  link_image      text,
  
  -- poll data (json: {question, options: [{text, votes}]})
  poll_data       jsonb,
  poll_ends_at    timestamptz,
  
  -- engagement
  view_count      int default 0,
  reaction_count  int default 0,
  comment_count   int default 0,
  share_count     int default 0,
  
  is_pinned       boolean default false,
  is_announcement boolean default false,
  
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

drop index if exists idx_channel_posts_channel;
drop index if exists idx_channel_posts_author;
drop index if exists idx_channel_posts_pinned;
create index idx_channel_posts_channel on channel_posts(channel_id, created_at desc);
create index idx_channel_posts_author on channel_posts(author_id);
create index idx_channel_posts_pinned on channel_posts(channel_id, is_pinned) where is_pinned = true;

drop trigger if exists channel_posts_updated_at on channel_posts;
create trigger channel_posts_updated_at before update on channel_posts
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_POST_REACTIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references channel_posts(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  emoji      text not null check (emoji in ('👍','❤️','😂','🙏','😢','😮','🔥')),
  created_at timestamptz default now(),
  
  unique(post_id, user_id)
);

drop index if exists idx_post_reactions_post;
drop index if exists idx_post_reactions_user;
create index idx_post_reactions_post on channel_post_reactions(post_id);
create index idx_post_reactions_user on channel_post_reactions(user_id);

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_POST_COMMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_post_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references channel_posts(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  parent_id    uuid references channel_post_comments(id) on delete cascade, -- for replies
  content      text not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

drop index if exists idx_post_comments_post;
drop index if exists idx_post_comments_user;
drop index if exists idx_post_comments_parent;
create index idx_post_comments_post on channel_post_comments(post_id, created_at);
create index idx_post_comments_user on channel_post_comments(user_id);
create index idx_post_comments_parent on channel_post_comments(parent_id);

drop trigger if exists channel_post_comments_updated_at on channel_post_comments;
create trigger channel_post_comments_updated_at before update on channel_post_comments
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_ANALYTICS (daily aggregates)
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_analytics (
  id                 uuid primary key default gen_random_uuid(),
  channel_id         uuid not null references channels(id) on delete cascade,
  date               date not null,
  
  new_followers      int default 0,
  unfollows          int default 0,
  post_views         int default 0,
  reactions          int default 0,
  comments           int default 0,
  shares             int default 0,
  
  -- monetization metrics (phase 4)
  ad_impressions     int default 0,
  ad_clicks          int default 0,
  ad_revenue_usd     numeric default 0,
  creator_revenue_usd numeric default 0,
  
  unique(channel_id, date)
);

drop index if exists idx_channel_analytics_channel_date;
create index idx_channel_analytics_channel_date on channel_analytics(channel_id, date desc);

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_REPORTS
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_reports (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid references channels(id) on delete cascade,
  post_id     uuid references channel_posts(id) on delete cascade,
  reporter_id uuid not null references users(id) on delete cascade,
  reason      text not null,
  details     text,
  status      text default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at  timestamptz default now()
);

drop index if exists idx_channel_reports_status;
drop index if exists idx_channel_reports_channel;
create index idx_channel_reports_status on channel_reports(status, created_at);
create index idx_channel_reports_channel on channel_reports(channel_id);

-- ─────────────────────────────────────────────────────────────
-- AD SYSTEM TABLES (Phase 4 - placeholders)
-- ─────────────────────────────────────────────────────────────

create table if not exists ad_campaigns (
  id                uuid primary key default gen_random_uuid(),
  advertiser_id     uuid not null references users(id) on delete cascade,
  name              text not null,
  budget_usd        numeric not null,
  spent_usd         numeric default 0,
  pricing_model     text not null check (pricing_model in ('cpm','cpc','cpa')),
  target_categories text[],
  target_age_min    int,
  target_age_max    int,
  status            text default 'draft' check (status in ('draft','active','paused','completed')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  created_at        timestamptz default now()
);

create table if not exists ad_impressions (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references ad_campaigns(id) on delete cascade,
  channel_id   uuid not null references channels(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  clicked      boolean default false,
  converted    boolean default false,
  revenue_usd  numeric default 0,
  created_at   timestamptz default now()
);

drop index if exists idx_ad_impressions_campaign;
drop index if exists idx_ad_impressions_channel;
create index idx_ad_impressions_campaign on ad_impressions(campaign_id, created_at);
create index idx_ad_impressions_channel on ad_impressions(channel_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- CHANNEL_WITHDRAWALS (monetization payouts)
-- ─────────────────────────────────────────────────────────────
create table if not exists channel_withdrawals (
  id              uuid primary key default gen_random_uuid(),
  channel_id      uuid not null references channels(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  amount          numeric not null check (amount >= 50),
  payment_method  text default 'stripe',
  status          text default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  requested_at    timestamptz default now(),
  completed_at    timestamptz,
  transaction_id  text
);

drop index if exists idx_channel_withdrawals_channel;
drop index if exists idx_channel_withdrawals_user;
drop index if exists idx_channel_withdrawals_status;
create index idx_channel_withdrawals_channel on channel_withdrawals(channel_id);
create index idx_channel_withdrawals_user on channel_withdrawals(user_id);
create index idx_channel_withdrawals_status on channel_withdrawals(status);

-- ─────────────────────────────────────────────────────────────
-- VIEWS (helpful queries)
-- ─────────────────────────────────────────────────────────────

create or replace view channel_feed_posts as
select
  p.*,
  u.name as author_name,
  u.avatar as author_avatar,
  c.name as channel_name,
  c.username as channel_username,
  c.avatar as channel_avatar
from channel_posts p
join users u on u.id = p.author_id
join channels c on c.id = p.channel_id
order by p.created_at desc;

-- ─────────────────────────────────────────────────────────────
-- FUNCTIONS (business logic helpers)
-- ─────────────────────────────────────────────────────────────

-- Increment follower count when someone follows
create or replace function increment_channel_followers()
returns trigger language plpgsql as $$
begin
  update channels set follower_count = follower_count + 1 where id = new.channel_id;
  return new;
end;
$$;

drop trigger if exists channel_member_added on channel_members;
create trigger channel_member_added after insert on channel_members
for each row execute function increment_channel_followers();

-- Decrement follower count when someone unfollows
create or replace function decrement_channel_followers()
returns trigger language plpgsql as $$
begin
  update channels set follower_count = follower_count - 1 where id = old.channel_id;
  return old;
end;
$$;

drop trigger if exists channel_member_removed on channel_members;
create trigger channel_member_removed after delete on channel_members
for each row execute function decrement_channel_followers();

-- Increment post count when a post is created
create or replace function increment_channel_posts()
returns trigger language plpgsql as $$
begin
  update channels set post_count = post_count + 1 where id = new.channel_id;
  return new;
end;
$$;

drop trigger if exists channel_post_added on channel_posts;
create trigger channel_post_added after insert on channel_posts
for each row execute function increment_channel_posts();

-- Update reaction count on post
create or replace function update_post_reaction_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update channel_posts set reaction_count = reaction_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update channel_posts set reaction_count = reaction_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_reaction_changed on channel_post_reactions;
create trigger post_reaction_changed after insert or delete on channel_post_reactions
for each row execute function update_post_reaction_count();

-- Update comment count on post
create or replace function update_post_comment_count()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'INSERT') then
    update channel_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif (TG_OP = 'DELETE') then
    update channel_posts set comment_count = comment_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_comment_changed on channel_post_comments;
create trigger post_comment_changed after insert or delete on channel_post_comments
for each row execute function update_post_comment_count();
