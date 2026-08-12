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
