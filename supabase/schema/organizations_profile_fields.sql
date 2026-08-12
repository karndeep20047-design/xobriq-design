-- Run once against the Supabase project's SQL editor.
-- Backs the KYC dashboard's Business profile page
-- (app/(kyc)/dashboard/xobriqKYC/profile). The organizations table already
-- carries name/industry/country/plan/status/billing_email (created via
-- console/clients/actions.ts's CreateClientSchema) but has no columns for
-- the rest of that page's fields — these were pure mock/demo data with no
-- backing anywhere. Added nullable/defensive so this is safe to run
-- regardless of how many rows already exist.
alter table organizations add column if not exists trading_name text;
alter table organizations add column if not exists kra_pin text;
alter table organizations add column if not exists brs_number text;
alter table organizations add column if not exists phone text;
alter table organizations add column if not exists website text;
alter table organizations add column if not exists address text;
alter table organizations add column if not exists about text;
alter table organizations add column if not exists compliance_officer_name text;
alter table organizations add column if not exists compliance_officer_email text;
alter table organizations add column if not exists compliance_officer_phone text;
