-- Run once against the Supabase project's SQL editor, then delete this file.
--
-- Adds a persisted "was this failure a real Creditinfo outage" flag.
-- verifyAndRecord() already computes this in-memory (CreditinfoTransientError
-- vs. a plain Error) and returns it in the API response, but never saved it
-- — meaning a failed verification's retryability was lost the moment the
-- request/response cycle ended. This is what lets the Alerts page offer a
-- "Retry" action on a failure from an earlier session, not just the one
-- still open in the browser.
alter table kyc_verifications
  add column if not exists retryable boolean;
