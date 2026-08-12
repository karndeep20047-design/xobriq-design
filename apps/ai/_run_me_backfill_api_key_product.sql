-- Run once against the Supabase project's SQL editor.
-- api_keys.product_slug already exists as a column but has never been
-- written by the client-facing key generator — every key created before
-- today's Developer Portal change has product_slug = NULL. Every one of
-- those keys is, in practice, a KYC key (it's the only product with a
-- real API today), so this backfill is a safe, mechanical default rather
-- than a behavior change. New keys get product_slug set at creation time
-- going forward (see generateApiKeyAction).
update api_keys set product_slug = 'kyc' where product_slug is null;
