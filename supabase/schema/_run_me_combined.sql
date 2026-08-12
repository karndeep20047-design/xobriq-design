-- ============================================================
-- FILE: kyc_verifications.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- Backs the real Creditinfo KYC integration: every identity/phone/business
-- verification submitted from the Xobriq KYC dashboard (apps/kyc) via
-- apps/ai/lib/kyc/verify-and-record.ts is persisted here.
-- RLS policies for this table live in kyc_rls_policies.sql (run that file
-- after this one) — they're defense-in-depth for any access path other than
-- today's admin-client-based routes, which bypass RLS like every other
-- service-role query in this codebase.

create table if not exists kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  requested_by uuid references auth.users (id),
  requested_by_email text,              -- denormalized so the console/UI never has to join profiles
  ref text not null unique,             -- display reference, e.g. "HKY-XXXXXXXX"
  verification_type text not null check (verification_type in ('identity', 'phone', 'business')),
  provider text not null default 'creditinfo',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  identifier_type text,                 -- identity only: national_id | krapinalien_id | ...
  identifier_number text not null,      -- the doc/mobile/registration number submitted
  last_name text,                       -- identity only: display-only, never sent to Creditinfo
  matched boolean,
  result jsonb,                         -- normalized IdentityVerificationResult | PhoneVerificationResult | BusinessVerificationResult
  raw_response jsonb,                   -- untouched Creditinfo EndQuery body
  error_message text,
  duration_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists kyc_verifications_org_created_idx on kyc_verifications (organization_id, created_at desc);
create index if not exists kyc_verifications_created_idx on kyc_verifications (created_at desc);
create index if not exists kyc_verifications_status_idx on kyc_verifications (status);


-- ============================================================
-- FILE: kyc_provider_requests.sql
-- ============================================================
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


-- ============================================================
-- FILE: kyc_rls_policies.sql
-- ============================================================
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


-- ============================================================
-- FILE: kyc_provider_pricing.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- What Creditinfo actually costs Xobriq per verification type. Never
-- client-reachable — RLS enabled with zero policies, service-role only,
-- same pattern as kyc_transaction_costs and guard_decisions.
--
-- Temporal (not update-in-place): the currently-active row for a given
-- (provider, verification_type) has effective_to = null; changing a price
-- means inserting a new row and setting the old row's effective_to, so
-- historical transactions can still be costed against the price that was
-- actually in effect when they happened. The partial unique index below
-- enforces "at most one active row per provider+type".

create table if not exists kyc_provider_pricing (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'creditinfo',
  verification_type text not null check (verification_type in ('identity', 'phone', 'business')),
  cost_amount numeric not null,
  currency text not null default 'KES',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists kyc_provider_pricing_active_idx
  on kyc_provider_pricing (provider, verification_type)
  where effective_to is null;

alter table kyc_provider_pricing enable row level security;
-- Zero policies — service-role only. Xobriq's cost basis must never be
-- readable by a client, under any query path.

-- PLACEHOLDER SEED — replace with your real Creditinfo commercial rate
-- before any profit number derived from this table is trustworthy. KES 20
-- flat across all three types is a guess, not a real figure.
insert into kyc_provider_pricing (provider, verification_type, cost_amount, currency) values
  ('creditinfo', 'identity', 20, 'KES'),
  ('creditinfo', 'phone', 20, 'KES'),
  ('creditinfo', 'business', 20, 'KES')
on conflict (provider, verification_type) where effective_to is null do nothing;


-- ============================================================
-- FILE: kyc_client_pricing.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- What a specific client organization is charged per verification type.
-- Same temporal shape as kyc_provider_pricing (a new row per price change,
-- old row's effective_to closed out) so historical billing_transactions
-- stay costed against the price that was active at the time.
--
-- Seeded by enableKycForClientAction() (console/clients/actions.ts) from a
-- plan-tiered default (organizations.plan: free/sandbox/growth/enterprise)
-- when staff "enable KYC" for a client — see kyc-pricing-defaults.ts.

create table if not exists kyc_client_pricing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  verification_type text not null check (verification_type in ('identity', 'phone', 'business')),
  price_amount numeric not null,
  currency text not null default 'KES',
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create unique index if not exists kyc_client_pricing_active_idx
  on kyc_client_pricing (organization_id, verification_type)
  where effective_to is null;

create index if not exists kyc_client_pricing_org_idx on kyc_client_pricing (organization_id);

alter table kyc_client_pricing enable row level security;

-- Org members can see their own current/historical pricing (useful once a
-- client-facing billing UI reads this) — but only the service role can
-- write it (staff-driven onboarding/pricing-change actions), so no
-- insert/update policy for `authenticated`.
drop policy if exists "org members can view their own pricing" on kyc_client_pricing;
create policy "org members can view their own pricing"
  on kyc_client_pricing for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );


-- ============================================================
-- FILE: kyc_api_keys.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- Real API keys for external callers of /api/v1/kyc/*. Only key_prefix
-- (e.g. "xob_live_a1b2c3d4") is ever readable in plaintext — key_hash is a
-- sha256 digest of the actual secret (see lib/kyc/api-keys.ts), and the
-- full secret is shown to the org exactly once, at generation/rotation
-- time, never persisted or logged anywhere.
--
-- RLS here genuinely matters (unlike kyc_verifications' policies) because
-- the (platform)/api-keys page and its actions use the session-scoped
-- Supabase client, not the admin client — matching the existing
-- (platform)/layout.tsx and (platform)/actions.ts convention. Application
-- code still never selects key_hash even though RLS would technically
-- allow an org member to read their own row's every column.

create table if not exists kyc_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  name text not null,
  environment text not null check (environment in ('test', 'live')),
  key_prefix text not null,
  key_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz
);

create index if not exists kyc_api_keys_org_idx on kyc_api_keys (organization_id);
create index if not exists kyc_api_keys_hash_idx on kyc_api_keys (key_hash);

alter table kyc_api_keys enable row level security;

drop policy if exists "org members can view their own api keys" on kyc_api_keys;
create policy "org members can view their own api keys"
  on kyc_api_keys for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can create their own api keys" on kyc_api_keys;
create policy "org members can create their own api keys"
  on kyc_api_keys for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can rotate or revoke their own api keys" on kyc_api_keys;
create policy "org members can rotate or revoke their own api keys"
  on kyc_api_keys for update
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  )
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );


-- ============================================================
-- FILE: kyc_billing_transactions.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- One row per billable verification — client-facing revenue ledger. What
-- Creditinfo actually cost Xobriq and the resulting profit deliberately do
-- NOT live here (see kyc_transaction_costs.sql) — this table only ever
-- holds what the client themselves was charged, so it's safe for a future
-- client-facing billing UI to read directly.
--
-- Written by verify-and-record.ts whenever a verification reaches
-- status = 'completed' (matched or not) — a hard failure (timeout, network
-- error) is never billed, consistent with the "Not billed — verification
-- did not complete" copy already in apps/kyc/src/routes/verify.tsx.

create table if not exists kyc_billing_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  verification_id uuid not null references kyc_verifications (id),
  verification_type text not null check (verification_type in ('identity', 'phone', 'business')),
  client_price numeric not null,
  currency text not null default 'KES',
  created_at timestamptz not null default now()
);

create index if not exists kyc_billing_transactions_org_created_idx
  on kyc_billing_transactions (organization_id, created_at desc);
create unique index if not exists kyc_billing_transactions_verification_idx
  on kyc_billing_transactions (verification_id);

alter table kyc_billing_transactions enable row level security;

drop policy if exists "org members can view their own billing transactions" on kyc_billing_transactions;
create policy "org members can view their own billing transactions"
  on kyc_billing_transactions for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

-- No insert/update/delete policy for `authenticated` — only
-- verify-and-record.ts (service role) writes these rows.


-- ============================================================
-- FILE: kyc_transaction_costs.sql
-- ============================================================
-- Run once against the Supabase project's SQL editor.
-- Xobriq-only: what Creditinfo actually cost for a given billing
-- transaction, and the resulting profit (client_price snapshot minus
-- provider_cost, both frozen at transaction time so a later price change
-- doesn't retroactively rewrite historical margin). RLS enabled with ZERO
-- policies — this is never reachable by any client, under any query path,
-- same pattern as kyc_provider_pricing.
--
-- Split into its own table (rather than extra columns on
-- kyc_billing_transactions) specifically so cost/profit can never leak
-- through that table's org-member SELECT policy — there is no column-level
-- trick to get wrong here, the data simply isn't in a client-reachable
-- table at all.

create table if not exists kyc_transaction_costs (
  id uuid primary key default gen_random_uuid(),
  billing_transaction_id uuid not null references kyc_billing_transactions (id),
  provider_cost numeric not null,
  client_price numeric not null, -- snapshot, so profit stays correct if client pricing later changes
  profit numeric not null,
  currency text not null default 'KES',
  created_at timestamptz not null default now()
);

create unique index if not exists kyc_transaction_costs_txn_idx on kyc_transaction_costs (billing_transaction_id);
create index if not exists kyc_transaction_costs_created_idx on kyc_transaction_costs (created_at desc);

alter table kyc_transaction_costs enable row level security;
-- Zero policies — service-role only, ever.


