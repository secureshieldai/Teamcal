-- ============================================================
-- TEAMCAL BOTS SYSTEM - Database Schema
-- Run this after the main schema.sql and channels_schema.sql
-- ============================================================
-- Two bot types:
--   'space'          - automates the owner's Channels / Communities
--   'conversational' - standalone bot with a public shareable link
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BOTS
-- ─────────────────────────────────────────────────────────────
create table if not exists bots (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references users(id) on delete cascade,
  type             text not null check (type in ('space','conversational')),
  name             text not null,
  avatar           text,
  description      text default '',
  purpose          text default '',
  welcome_message  text default '',
  tone             text default 'Warm & professional',
  language         text default 'English',
  status           text not null default 'draft' check (status in ('draft','active','paused')),
  public_slug      text unique,

  -- jsonb blobs
  knowledge_base   jsonb default '{}'::jsonb,   -- { business, products[], faqs[], hours, delivery, refunds, booking, membership, instructions, links[], resources[], documents[] }
  permissions      jsonb default '{}'::jsonb,   -- capability -> bool. Nothing granted by default.
  settings         jsonb default '{}'::jsonb,   -- { notify_on_error, rate_limit_per_min, ... }

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

drop index if exists idx_bots_owner;
drop index if exists idx_bots_slug;
create index idx_bots_owner on bots(owner_id);
create index idx_bots_slug on bots(public_slug) where public_slug is not null;

drop trigger if exists bots_updated_at on bots;
create trigger bots_updated_at before update on bots
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- BOT_SPACE_CONNECTIONS  (one bot ↔ many channels / communities)
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_space_connections (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references bots(id) on delete cascade,
  space_type  text not null check (space_type in ('channel','community')),
  space_id    uuid not null,
  space_name  text default '',
  created_at  timestamptz default now(),
  unique (bot_id, space_type, space_id)
);

drop index if exists idx_bot_conn_bot;
drop index if exists idx_bot_conn_space;
create index idx_bot_conn_bot on bot_space_connections(bot_id);
create index idx_bot_conn_space on bot_space_connections(space_type, space_id);

-- ─────────────────────────────────────────────────────────────
-- BOT_AUTOMATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_automations (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references bots(id) on delete cascade,
  kind        text not null check (kind in (
                'welcome_dm','onboarding','faq','announcement','reminder','poll',
                'recommend_resource','spam_detect','notify_admins','confirm_membership',
                'manage_access','collect_replies','escalate')),
  enabled     boolean default false,
  config      jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (bot_id, kind)
);

drop index if exists idx_bot_automations_bot;
create index idx_bot_automations_bot on bot_automations(bot_id);

drop trigger if exists bot_automations_updated_at on bot_automations;
create trigger bot_automations_updated_at before update on bot_automations
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- BOT_SEQUENCES  (simple no-code message sequences)
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_sequences (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references bots(id) on delete cascade,
  name        text default 'Default sequence',
  steps       jsonb default '[]'::jsonb,  -- [{ order, message, delay_minutes, buttons[], condition, action }]
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (bot_id, name)
);

drop index if exists idx_bot_sequences_bot;
create index idx_bot_sequences_bot on bot_sequences(bot_id);

drop trigger if exists bot_sequences_updated_at on bot_sequences;
create trigger bot_sequences_updated_at before update on bot_sequences
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- BOT_SCHEDULED_ITEMS  (announcements / reminders released by /process-due)
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_scheduled_items (
  id             uuid primary key default gen_random_uuid(),
  bot_id         uuid not null references bots(id) on delete cascade,
  automation_id  uuid references bot_automations(id) on delete set null,
  kind           text not null,
  payload        jsonb default '{}'::jsonb,
  targets        jsonb default '[]'::jsonb,   -- bot_space_connections ids
  scheduled_for  timestamptz not null,
  status         text not null default 'pending' check (status in ('pending','sent','failed','canceled')),
  processed_at   timestamptz,
  error          text,
  created_at     timestamptz default now()
);

drop index if exists idx_bot_sched_due;
create index idx_bot_sched_due on bot_scheduled_items(status, scheduled_for);

-- ─────────────────────────────────────────────────────────────
-- BOT_CONVERSATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_conversations (
  id                 uuid primary key default gen_random_uuid(),
  bot_id             uuid not null references bots(id) on delete cascade,
  channel            text not null default 'public' check (channel in ('public','space')),
  lead_key           text,                 -- anonymous session id for public chat
  member_user_id     uuid references users(id) on delete set null,
  status             text not null default 'open' check (status in ('open','resolved','follow_up')),
  assigned_admin_id  uuid references users(id) on delete set null,
  handoff_active     boolean default false,
  stopped            boolean default false,
  last_message_at    timestamptz default now(),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

drop index if exists idx_bot_convo_bot;
drop index if exists idx_bot_convo_leadkey;
create index idx_bot_convo_bot on bot_conversations(bot_id, status);
create index idx_bot_convo_leadkey on bot_conversations(lead_key);

drop trigger if exists bot_conversations_updated_at on bot_conversations;
create trigger bot_conversations_updated_at before update on bot_conversations
for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- BOT_MESSAGES
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references bot_conversations(id) on delete cascade,
  role             text not null check (role in ('bot','user','admin','system')),
  content          text default '',
  meta             jsonb default '{}'::jsonb,   -- { buttons[], cards[], handoff }
  created_at       timestamptz default now()
);

drop index if exists idx_bot_messages_convo;
create index idx_bot_messages_convo on bot_messages(conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- BOT_LEADS
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_leads (
  id               uuid primary key default gen_random_uuid(),
  bot_id           uuid not null references bots(id) on delete cascade,
  conversation_id  uuid unique references bot_conversations(id) on delete set null,
  name             text,
  email            text,
  phone            text,
  fields           jsonb default '{}'::jsonb,
  consent          boolean default false,
  consent_text     text default '',
  created_at       timestamptz default now()
);

drop index if exists idx_bot_leads_bot;
create index idx_bot_leads_bot on bot_leads(bot_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- BOT_NOTES  (internal admin notes on a conversation)
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_notes (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references bot_conversations(id) on delete cascade,
  admin_id         uuid references users(id) on delete set null,
  note             text not null,
  created_at       timestamptz default now()
);

drop index if exists idx_bot_notes_convo;
create index idx_bot_notes_convo on bot_notes(conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- BOT_EVENTS  (drives 30-day analytics + recent activity + activity log)
-- ─────────────────────────────────────────────────────────────
create table if not exists bot_events (
  id          uuid primary key default gen_random_uuid(),
  bot_id      uuid not null references bots(id) on delete cascade,
  type        text not null check (type in (
                'conversation_started','lead_collected','message_sent','member_welcomed',
                'question_answered','human_handoff','link_click','action_completed',
                'automation_failed')),
  meta        jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

drop index if exists idx_bot_events_bot;
create index idx_bot_events_bot on bot_events(bot_id, created_at);

-- ============================================================
-- Done. Row Level Security policies live in rls_policies.sql
-- ============================================================
