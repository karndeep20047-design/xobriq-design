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
