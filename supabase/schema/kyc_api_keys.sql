-- Run once against the Supabase project's SQL editor.
-- Real API keys for external callers of /api/v1/kyc/*. Only key_prefix
-- (e.g. "xob_live_a1b2c3d4") is ever readable in plaintext — key_hash is a
-- sha256 digest of the actual secret (see lib/kyc/api-keys.ts), and the
-- full secret is shown to the org exactly once, at generation/rotation
-- time, never persisted or logged anywhere.
--
-- RLS here genuinely matters (unlike kyc_verifications' policies) because
-- the (platform)/api-keys page and its actions use the session-scoped
-- Supabase client, not the admin client — matching the existing
-- (platform)/layout.tsx and (platform)/actions.ts convention. Application
-- code still never selects key_hash even though RLS would technically
-- allow an org member to read their own row's every column.

create table if not exists kyc_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id),
  name text not null,
  environment text not null check (environment in ('test', 'live')),
  key_prefix text not null,
  key_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  rotated_at timestamptz,
  revoked_at timestamptz
);

create index if not exists kyc_api_keys_org_idx on kyc_api_keys (organization_id);
create index if not exists kyc_api_keys_hash_idx on kyc_api_keys (key_hash);

alter table kyc_api_keys enable row level security;

drop policy if exists "org members can view their own api keys" on kyc_api_keys;
create policy "org members can view their own api keys"
  on kyc_api_keys for select
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can create their own api keys" on kyc_api_keys;
create policy "org members can create their own api keys"
  on kyc_api_keys for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "org members can rotate or revoke their own api keys" on kyc_api_keys;
create policy "org members can rotate or revoke their own api keys"
  on kyc_api_keys for update
  to authenticated
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  )
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = (select auth.uid())
    )
  );
