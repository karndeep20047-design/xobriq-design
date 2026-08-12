-- Run once against the Supabase project's SQL editor.
-- Current prepaid balance per organization. A single mutable row per org —
-- unlike kyc_client_pricing/kyc_provider_pricing this deliberately has no
-- temporal effective_from/effective_to shape, because a balance genuinely
-- is "one current number", not a priced-over-time fact. The audit trail
-- lives in kyc_wallet_transactions instead (see that file) — every change
-- to this row's balance has a matching ledger row there.
--
-- Never written directly by application code — always through the
-- kyc_wallet_apply_transaction(...) function (kyc_wallet_functions.sql),
-- which does the balance update and ledger insert together so a race
-- between two concurrent debits can't silently lose an update.

create table if not exists kyc_wallets (
  organization_id uuid primary key references organizations (id),
  balance numeric not null default 0,
  currency text not null default 'KES',
  updated_at timestamptz not null default now()
);

alter table kyc_wallets enable row level security;

drop policy if exists "org members can view their own wallet balance" on kyc_wallets;
create policy "org members can view their own wallet balance"
  on kyc_wallets for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

-- No insert/update policy for `authenticated` — balance only ever changes
-- via kyc_wallet_apply_transaction(...), called through the service role.
