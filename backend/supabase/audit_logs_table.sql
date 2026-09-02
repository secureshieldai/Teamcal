-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- Tracks all critical operations for security and compliance

create table if not exists audit_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references users(id) on delete set null,
  action            text not null,
  entity_type       text,
  entity_id         text,
  metadata          jsonb default '{}',
  ip_address        text,
  created_at        timestamptz default now()
);

-- Indexes for efficient querying
create index if not exists idx_audit_logs_user_id on audit_logs(user_id, created_at desc);
create index if not exists idx_audit_logs_action on audit_logs(action, created_at desc);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);

-- Audit logs should never be updated or deleted by users
alter table audit_logs enable row level security;

-- Only allow viewing own audit logs (admins use service_role to view all)
create policy "Users can view own audit logs" on audit_logs
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies = blocked for users (only backend can write)

-- ============================================================================
-- AUDIT LOG CLEANUP FUNCTION (Optional)
-- ============================================================================
-- Call periodically to remove old logs (e.g., older than 2 years)
-- Keep financial logs longer for compliance

create or replace function cleanup_old_audit_logs(days_to_keep int default 730)
returns void
language plpgsql
as $$
begin
  delete from audit_logs
  where created_at < now() - (days_to_keep || ' days')::interval
    and action not like 'order.%'  -- Keep financial logs
    and action not like 'payout.%';
end;
$$;

-- Example: Schedule cleanup (run monthly via cron or manually)
-- select cleanup_old_audit_logs(730); -- Keep 2 years
