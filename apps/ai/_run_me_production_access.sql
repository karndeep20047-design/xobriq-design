-- Run once against the Supabase project's SQL editor.
-- Adds production-access tracking to the existing product_access_requests
-- table rather than a new organization_product_access table — this table
-- already has the exact (organization_id, product_slug) unique row plus
-- requested_by/requested_at/reviewed_by/reviewed_at/notes columns that a
-- new table would just duplicate. The existing "status" column keeps
-- meaning what it already means (general/sandbox-tier product access,
-- unchanged); production_status is a separate, independent dimension on
-- the same row, per-product, per-org.
alter table product_access_requests
  add column if not exists production_status text not null default 'not_requested'
    check (production_status in ('not_requested', 'pending', 'more_information_required', 'approved', 'rejected', 'suspended')),
  add column if not exists production_requested_at timestamptz,
  add column if not exists production_requested_by uuid,
  add column if not exists production_reviewed_at timestamptz,
  add column if not exists production_reviewed_by uuid,
  -- Staff-only — never sent to the client, mirrors how the existing
  -- "notes" column already only ever appears in the console UI.
  add column if not exists production_review_notes text,
  -- The one field explicitly safe to show the client — covers the
  -- reviewer message for more_information_required, the rejection
  -- reason, and the suspension notice, so there's exactly one place staff
  -- write client-facing text instead of three near-duplicate columns.
  add column if not exists production_client_message text,
  add column if not exists production_suspended_at timestamptz;

create index if not exists product_access_requests_production_status_idx
  on product_access_requests (production_status)
  where production_status != 'not_requested';
