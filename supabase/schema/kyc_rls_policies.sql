-- Run once against the Supabase project's SQL editor, after
-- kyc_verifications.sql and kyc_provider_requests.sql have been applied.
--
-- This is the first RLS in the project — every other table here
-- (guard_decisions, audit_logs, and kyc_verifications/kyc_provider_requests
-- as originally written) is service-role-only with no policies at all.
-- These policies are real, but be clear about what they do and don't
-- protect: the five existing /api/v1/kyc/* routes (verify-identity,
-- verify-phone, verify-business, verifications list/detail) all go through
-- createAdminClient() (service role), which ALWAYS bypasses RLS — that is
-- a hard Postgres/Supabase property, not something these policies can
-- override. What these policies actually protect is any *other* access
-- path: a future query written against the session-scoped client, a direct
-- PostgREST call with a user's anon+JWT token, etc. Isolation for today's
-- own admin-client code paths still depends on the .eq("organization_id",
-- ...) filters already in that application code.
--
-- Supporting index for the (select auth.uid()) subquery below — without
-- this, every RLS check on these tables is a sequential scan of
-- organization_members.
create index if not exists organization_members_user_org_idx
  on organization_members (user_id, organization_id);

alter table kyc_verifications enable row level security;

drop policy if exists "org members can view their own verifications" on kyc_verifications;
create policy "org members can view their own verifications"
  on kyc_verifications for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can create their own verifications" on kyc_verifications;
create policy "org members can create their own verifications"
  on kyc_verifications for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

-- No update/delete policy for `authenticated` — only the service role can
-- transition a verification from pending to completed/failed.

alter table kyc_provider_requests enable row level security;
-- Deliberately zero policies here: this is an internal request/latency log
-- (one row per Creditinfo round-trip, including manual health checks), not
-- a client-facing concept. Service-role only, same as kyc_provider_pricing
-- and kyc_transaction_costs below.
