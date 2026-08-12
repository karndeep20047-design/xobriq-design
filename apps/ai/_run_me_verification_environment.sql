-- Run once against the Supabase project's SQL editor.
-- kyc_verifications never recorded which Creditinfo environment
-- (sandbox/production) a given call actually used — verifyAndRecord()
-- decided it in memory but never persisted it. That's the root of a real
-- bug: the dashboard's result screen hardcoded "IPRS - Sandbox" regardless
-- of what actually ran, and the console's per-request usage table could
-- only guess environment via a join to api_keys (which is always NULL for
-- dashboard-originated verifications, so those always looked
-- unattributed). This column makes it a real, queryable fact instead.
alter table kyc_verifications add column if not exists environment text
  check (environment in ('sandbox', 'production'));

create index if not exists kyc_verifications_environment_idx
  on kyc_verifications (environment);
