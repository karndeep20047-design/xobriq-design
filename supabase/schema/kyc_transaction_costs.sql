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
