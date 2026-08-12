-- Run once against the Supabase project's SQL editor.
-- Backs the real Creditinfo KYC integration: every identity/phone/business
-- verification submitted from the Xobriq KYC dashboard (apps/kyc) via
-- apps/ai/lib/kyc/verify-and-record.ts is persisted here.
-- RLS policies for this table live in kyc_rls_policies.sql (run that file
-- after this one) — they're defense-in-depth for any access path other than
-- today's admin-client-based routes, which bypass RLS like every other
-- service-role query in this codebase.

create table if not exists kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  requested_by uuid references auth.users (id),
  requested_by_email text,              -- denormalized so the console/UI never has to join profiles
  ref text not null unique,             -- display reference, e.g. "HKY-XXXXXXXX"
  verification_type text not null check (verification_type in ('identity', 'phone', 'business')),
  provider text not null default 'creditinfo',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  identifier_type text,                 -- identity only: national_id | krapinalien_id | ...
  identifier_number text not null,      -- the doc/mobile/registration number submitted
  last_name text,                       -- identity only: display-only, never sent to Creditinfo
  matched boolean,
  result jsonb,                         -- normalized IdentityVerificationResult | PhoneVerificationResult | BusinessVerificationResult
  raw_response jsonb,                   -- untouched Creditinfo EndQuery body
  error_message text,
  duration_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Defensive: guarantees every column exists even if kyc_verifications was
-- already created by an earlier partial run of this file (in which case
-- "create table if not exists" above is a no-op against whatever schema
-- already exists) — same pattern as kyc_wallet_transactions.sql. Added
-- nullable rather than NOT NULL/UNIQUE since a pre-existing table may
-- already have rows; every real insert (lib/kyc/verify-and-record.ts)
-- always supplies these anyway, and the unique index below still enforces
-- ref uniqueness going forward.
alter table kyc_verifications add column if not exists organization_id uuid references organizations (id);
alter table kyc_verifications add column if not exists requested_by uuid references auth.users (id);
alter table kyc_verifications add column if not exists requested_by_email text;
alter table kyc_verifications add column if not exists ref text;
alter table kyc_verifications add column if not exists verification_type text;
alter table kyc_verifications add column if not exists provider text default 'creditinfo';
alter table kyc_verifications add column if not exists status text default 'pending';
alter table kyc_verifications add column if not exists identifier_type text;
alter table kyc_verifications add column if not exists identifier_number text;
alter table kyc_verifications add column if not exists last_name text;
alter table kyc_verifications add column if not exists matched boolean;
alter table kyc_verifications add column if not exists result jsonb;
alter table kyc_verifications add column if not exists raw_response jsonb;
alter table kyc_verifications add column if not exists error_message text;
alter table kyc_verifications add column if not exists duration_ms integer;
alter table kyc_verifications add column if not exists ip_address text;
alter table kyc_verifications add column if not exists user_agent text;
alter table kyc_verifications add column if not exists created_at timestamptz default now();
alter table kyc_verifications add column if not exists completed_at timestamptz;
create unique index if not exists kyc_verifications_ref_key on kyc_verifications (ref);

create index if not exists kyc_verifications_org_created_idx on kyc_verifications (organization_id, created_at desc);
create index if not exists kyc_verifications_created_idx on kyc_verifications (created_at desc);
create index if not exists kyc_verifications_status_idx on kyc_verifications (status);

-- Defensive: a kyc_verifications table created by an older prototype (before
-- this schema existed) can carry legacy columns this app never writes to —
-- "reference" (distinct from "ref" above), "doc_type", "doc_number", and
-- "score" — each NOT NULL with no default, which blocks every real insert
-- from lib/kyc/verify-and-record.ts. Relaxing them is safe whether or not
-- they exist/are already nullable; a fresh table created by this file has
-- none of them, so these are no-ops there.
alter table kyc_verifications alter column reference drop not null;
alter table kyc_verifications alter column doc_type drop not null;
alter table kyc_verifications alter column doc_number drop not null;
alter table kyc_verifications alter column score drop not null;

-- Same legacy-prototype concern: a CHECK constraint scoped to that older
-- table's own status/doc_type vocabulary would reject every real insert
-- under a different error than the NOT NULL ones above. Drop it under
-- Postgres's default auto-generated name; harmless no-op otherwise.
alter table kyc_verifications drop constraint if exists kyc_verifications_status_check;
alter table kyc_verifications drop constraint if exists kyc_verifications_doc_type_check;
