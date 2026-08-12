-- Run once against the Supabase project's SQL editor.
-- Append-only ledger of every balance change on kyc_wallets — one row per
-- top-up, per verification debit, or per manual adjustment. `balance_after`
-- is a snapshot taken at the moment the row was written (inside the same
-- statement sequence as the balance update, via kyc_wallet_apply_transaction
-- in kyc_wallet_functions.sql), so the ledger stays correct even if a later
-- top-up/debit changes the current balance.
--
-- `verification_id` is only set on 'debit' rows (the verification that was
-- billed) — 'topup'/'adjustment' rows leave it null. `created_by` is the
-- staff member who approved a top-up, or null for automated debit rows and
-- for the API-key auth path (no Supabase Auth user behind an API key).

create table if not exists kyc_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  type text not null check (type in ('topup', 'debit', 'adjustment')),
  amount numeric not null, -- always positive; sign is implied by `type`
  balance_after numeric not null,
  verification_id uuid references kyc_verifications (id),
  reference text,
  note text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Defensive: guarantees the column exists even if kyc_wallet_transactions
-- was already created by an earlier partial run of this file (in which
-- case "create table if not exists" above is a no-op against whatever
-- schema already exists) — safe/idempotent either way.
alter table kyc_wallet_transactions add column if not exists verification_id uuid references kyc_verifications (id);

create index if not exists kyc_wallet_transactions_org_created_idx
  on kyc_wallet_transactions (organization_id, created_at desc);
create unique index if not exists kyc_wallet_transactions_verification_idx
  on kyc_wallet_transactions (verification_id)
  where verification_id is not null;

alter table kyc_wallet_transactions enable row level security;

drop policy if exists "org members can view their own wallet transactions" on kyc_wallet_transactions;
create policy "org members can view their own wallet transactions"
  on kyc_wallet_transactions for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

-- No insert/update/delete policy for `authenticated` — only
-- kyc_wallet_apply_transaction(...) (service role) writes these rows.
