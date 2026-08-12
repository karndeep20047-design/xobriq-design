-- Run once against the Supabase project's SQL editor.
-- Backs the /console/guard dashboard: every Guard /assess call made via
-- lib/ai-client.ts#scoreGuardTransaction is logged here.
-- No RLS policy: only ever read/written via the service-role admin client
-- (same pattern as audit_logs).

create table guard_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,                      -- nullable now; populate once Guard API keys map to orgs
  created_at timestamptz not null default now(),
  step int not null,
  type text not null,
  amount numeric not null,
  oldbalance_org numeric not null,
  newbalance_orig numeric not null,
  oldbalance_dest numeric not null,
  newbalance_dest numeric not null,
  action text not null,             -- BLOCK | REVIEW | ALLOW
  rule_action text not null,
  model_score numeric,
  reasons jsonb not null default '[]',
  versions jsonb not null default '{}',
  shadow jsonb
);

create index guard_decisions_created_at_idx on guard_decisions (created_at desc);
create index guard_decisions_org_id_idx on guard_decisions (org_id);
