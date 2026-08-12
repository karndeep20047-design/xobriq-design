-- Run once against the Supabase project's SQL editor.
-- verify-and-record.ts sanitizes the client-facing errorMessage whenever a
-- failure has a known, stable cause (currently CreditinfoResponseFormatError)
-- — but that decision only happened in memory, at the moment of the original
-- failure. A failed row re-read later (e.g. two concurrent requests racing on
-- the same idempotency key) had no way to know it needed sanitizing again.
-- This column makes that decision persist with the row instead.
alter table kyc_verifications add column if not exists error_code text;
