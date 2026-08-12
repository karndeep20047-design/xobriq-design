-- Run once against the Supabase project's SQL editor.
-- Lets a verification request carry a client- or caller-supplied
-- idempotency key so a retried request (double form submit, network
-- retry, a re-uploaded bulk CSV) reuses the original result instead of
-- running a second real Creditinfo call and billing/debiting twice.
-- NULL (the default) means no key was supplied — behaves exactly as
-- before. Scoped per-organization since two different orgs could
-- coincidentally generate the same key.
alter table kyc_verifications add column if not exists idempotency_key text;

create unique index if not exists kyc_verifications_idempotency_idx
  on kyc_verifications (organization_id, idempotency_key)
  where idempotency_key is not null;
