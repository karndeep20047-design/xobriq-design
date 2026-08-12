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
