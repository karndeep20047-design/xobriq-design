-- Run once against the Supabase project's SQL editor.
-- Logs every individual call made to a KYC provider (Creditinfo today) —
-- one row per verification attempt, plus manual health checks — so the
-- /console/kyc Operations Dashboard can show real provider status
-- (rolling success rate, latency, recent errors) independent of whether
-- the underlying verification itself matched or not.
-- No RLS policy: only ever read/written via the service-role admin client
-- (same pattern as audit_logs/guard_decisions/kyc_verifications).

create table if not exists kyc_provider_requests (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid references kyc_verifications (id), -- null for standalone health checks
  provider text not null default 'creditinfo',
  request_type text not null check (request_type in ('identity', 'phone', 'business', 'health_check')),
  success boolean not null,
  error_message text,
  duration_ms integer not null,
  created_at timestamptz not null default now()
);

create index if not exists kyc_provider_requests_created_idx on kyc_provider_requests (created_at desc);
create index if not exists kyc_provider_requests_type_created_idx on kyc_provider_requests (request_type, created_at desc);
