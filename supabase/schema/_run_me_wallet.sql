-- Combined wallet migration: run this whole file once in the Supabase SQL Editor.
-- Order matters: kyc_wallets -> kyc_wallet_transactions -> kyc_wallet_topup_requests -> kyc_wallet_functions.

-- FILE: kyc_wallets.sql
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

-- FILE: kyc_wallet_transactions.sql
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

-- FILE: kyc_wallet_topup_requests.sql
-- Run once against the Supabase project's SQL editor.
-- A client's request to top up their wallet — NOT a real charge. There is
-- no payment gateway wired into this product yet, so a request just records
-- "we intend to send KES X via <method>, here's our reference" and sits
-- 'pending' until staff confirm the money actually arrived out-of-band
-- (bank/M-Pesa reconciliation) and approve it from the console — approval
-- is what actually calls kyc_wallet_apply_transaction(...) and moves the
-- balance. Rejecting a request never touches the balance.

create table if not exists kyc_wallet_topup_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  amount numeric not null,
  currency text not null default 'KES',
  method text not null check (method in ('mpesa', 'bank', 'card')),
  contact_reference text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid references auth.users (id),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kyc_wallet_topup_requests_org_idx
  on kyc_wallet_topup_requests (organization_id, created_at desc);
create index if not exists kyc_wallet_topup_requests_pending_idx
  on kyc_wallet_topup_requests (created_at desc)
  where status = 'pending';

alter table kyc_wallet_topup_requests enable row level security;

drop policy if exists "org members can view their own topup requests" on kyc_wallet_topup_requests;
create policy "org members can view their own topup requests"
  on kyc_wallet_topup_requests for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can submit their own topup requests" on kyc_wallet_topup_requests;
create policy "org members can submit their own topup requests"
  on kyc_wallet_topup_requests for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

-- No update/delete policy for `authenticated` — only staff (service role,
-- via approveTopupRequestAction/rejectTopupRequestAction) can change status.

-- FILE: kyc_wallet_functions.sql
-- Run once against the Supabase project's SQL editor. Depends on
-- kyc_wallets.sql and kyc_wallet_transactions.sql already having run.
--
-- Applies one balance change atomically: upserts the wallet row, adjusts
-- its balance, and inserts the matching ledger row with a `balance_after`
-- snapshot — all inside one statement sequence, so the UPDATE's row lock
-- covers the whole operation and two concurrent calls for the same org
-- (e.g. a debit racing a top-up) serialize instead of losing an update.
--
-- Deliberately has NO negative-balance guard: this function is also the
-- post-verification debit path, and by the time a verification has
-- actually run, Creditinfo has already been charged — the debit must be
-- recorded regardless. The real "can this org afford it" guard lives in
-- application code (lib/kyc/wallet.ts's checkWalletBalance), called BEFORE
-- a verification is attempted, not here.
--
-- Only ever called via the service-role admin client — same trust boundary
-- as every other write path in this schema.

create or replace function kyc_wallet_apply_transaction(
  p_organization_id uuid,
  p_type text,
  p_amount numeric,
  p_verification_id uuid default null,
  p_reference text default null,
  p_note text default null,
  p_created_by uuid default null
) returns numeric
language plpgsql
as $$
declare
  v_balance numeric;
  v_delta numeric;
begin
  if p_type not in ('topup', 'debit', 'adjustment') then
    raise exception 'invalid kyc wallet transaction type: %', p_type;
  end if;

  if p_amount <= 0 then
    raise exception 'kyc wallet transaction amount must be positive, got %', p_amount;
  end if;

  v_delta := case when p_type = 'debit' then -p_amount else p_amount end;

  insert into kyc_wallets (organization_id, balance)
  values (p_organization_id, 0)
  on conflict (organization_id) do nothing;

  update kyc_wallets
  set balance = balance + v_delta, updated_at = now()
  where organization_id = p_organization_id
  returning balance into v_balance;

  insert into kyc_wallet_transactions (
    organization_id, type, amount, balance_after, verification_id, reference, note, created_by
  ) values (
    p_organization_id, p_type, p_amount, v_balance, p_verification_id, p_reference, p_note, p_created_by
  );

  return v_balance;
end;
$$;

