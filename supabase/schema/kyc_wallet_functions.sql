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
