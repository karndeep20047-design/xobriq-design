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
