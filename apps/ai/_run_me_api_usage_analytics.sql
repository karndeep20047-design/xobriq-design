-- Run once against the Supabase project's SQL editor.
-- Backs the internal console's API Usage analytics page (app/(console)/
-- console/api-usage/**): attributes verifications to the API key that made
-- them, and adds a handful of aggregation functions so usage/cost rollups
-- are computed in Postgres instead of pulling raw verification rows into
-- the browser.

-- 1. Per-API-key attribution -------------------------------------------
-- Nullable: historical rows and anything initiated from the KYC dashboard
-- itself (the /verify form, bulk CSV upload) go through a Supabase session,
-- not a bearer-token API key, and correctly have no key to attribute to.
-- "Environment" is deliberately NOT duplicated onto kyc_verifications — a
-- request's environment is derived via api_key_id -> api_keys.environment
-- wherever needed, so there's exactly one place that value lives.
alter table kyc_verifications add column if not exists api_key_id uuid references api_keys(id);

create index if not exists kyc_verifications_api_key_id_idx
  on kyc_verifications (api_key_id)
  where api_key_id is not null;

-- Every org-scoped, date-ranged query this feature runs (org detail page,
-- time series filtered to one org) filters on exactly this pair.
create index if not exists kyc_verifications_org_created_idx
  on kyc_verifications (organization_id, created_at desc);

-- Platform-wide (all-orgs) status/service distribution scans group on these.
create index if not exists kyc_verifications_status_idx
  on kyc_verifications (status);

create index if not exists kyc_verifications_verification_type_idx
  on kyc_verifications (verification_type);

-- Wallet ledger pagination on the org detail page.
create index if not exists kyc_wallet_transactions_org_created_idx
  on kyc_wallet_transactions (organization_id, created_at desc);

-- Defensive — likely already covered by the FK's implicit index, but not
-- confirmed, and the org rollup/api-key-count queries lean on it directly.
create index if not exists api_keys_organization_id_idx
  on api_keys (organization_id);

-- Not indexing kyc_verifications.provider or .environment (on api_keys):
-- provider is a single hardcoded value ("creditinfo") today and environment
-- only has two values with roughly even distribution — neither is
-- selective enough for an index to help over a sequential scan combined
-- with the indexes above.

-- 2. Time series ----------------------------------------------------------
-- p_bucket is validated against a fixed enum (defaulting to 'day') rather
-- than passed straight into date_trunc, so a typo'd bucket value degrades
-- gracefully instead of erroring.
create or replace function api_usage_timeseries(
  p_from timestamptz,
  p_to timestamptz,
  p_bucket text default 'day',
  p_organization_id uuid default null,
  p_environment text default null,
  p_verification_type text default null,
  p_api_key_id uuid default null
)
returns table (
  bucket_start timestamptz,
  total bigint,
  successful bigint,
  failed bigint,
  pending bigint,
  amount_charged numeric,
  billable_count bigint
)
language sql
stable
as $$
  select
    date_trunc(
      case when p_bucket in ('hour', 'day', 'week', 'month') then p_bucket else 'day' end,
      v.created_at
    ) as bucket_start,
    count(*) as total,
    count(*) filter (where v.status = 'completed' and v.matched is true) as successful,
    count(*) filter (where v.status = 'failed') as failed,
    count(*) filter (where v.status = 'pending') as pending,
    coalesce(sum(bt.client_price), 0) as amount_charged,
    count(bt.id) as billable_count
  from kyc_verifications v
  left join api_keys k on k.id = v.api_key_id
  left join kyc_billing_transactions bt on bt.verification_id = v.id
  where v.created_at >= p_from
    and v.created_at < p_to
    and (p_organization_id is null or v.organization_id = p_organization_id)
    and (p_verification_type is null or v.verification_type = p_verification_type)
    and (p_api_key_id is null or v.api_key_id = p_api_key_id)
    and (p_environment is null or k.environment = p_environment)
  group by 1
  order by 1;
$$;

-- 3. Service (verification_type) distribution ------------------------------
create or replace function api_usage_service_distribution(
  p_from timestamptz,
  p_to timestamptz,
  p_organization_id uuid default null,
  p_environment text default null,
  p_status text default null,
  p_api_key_id uuid default null
)
returns table (
  verification_type text,
  total bigint,
  successful bigint,
  failed bigint,
  pending bigint,
  amount_charged numeric,
  avg_response_ms numeric
)
language sql
stable
as $$
  select
    v.verification_type,
    count(*) as total,
    count(*) filter (where v.status = 'completed' and v.matched is true) as successful,
    count(*) filter (where v.status = 'failed') as failed,
    count(*) filter (where v.status = 'pending') as pending,
    coalesce(sum(bt.client_price), 0) as amount_charged,
    avg(v.duration_ms) filter (where v.duration_ms is not null) as avg_response_ms
  from kyc_verifications v
  left join api_keys k on k.id = v.api_key_id
  left join kyc_billing_transactions bt on bt.verification_id = v.id
  where v.created_at >= p_from
    and v.created_at < p_to
    and (p_organization_id is null or v.organization_id = p_organization_id)
    and (p_status is null or v.status = p_status)
    and (p_api_key_id is null or v.api_key_id = p_api_key_id)
    and (p_environment is null or k.environment = p_environment)
  group by v.verification_type
  order by total desc;
$$;

-- 4. Summary totals (one row, called twice per page load — current period
--    and previous period — so the delta is two cheap indexed aggregates
--    rather than a more complex dual-range single query) -------------------
create or replace function api_usage_summary_totals(
  p_from timestamptz,
  p_to timestamptz,
  p_organization_id uuid default null,
  p_environment text default null,
  p_verification_type text default null,
  p_status text default null,
  p_api_key_id uuid default null
)
returns table (
  total_requests bigint,
  successful bigint,
  failed bigint,
  pending bigint,
  amount_consumed numeric
)
language sql
stable
as $$
  select
    count(*) as total_requests,
    count(*) filter (where v.status = 'completed' and v.matched is true) as successful,
    count(*) filter (where v.status = 'failed') as failed,
    count(*) filter (where v.status = 'pending') as pending,
    coalesce(sum(bt.client_price), 0) as amount_consumed
  from kyc_verifications v
  left join api_keys k on k.id = v.api_key_id
  left join kyc_billing_transactions bt on bt.verification_id = v.id
  where v.created_at >= p_from
    and v.created_at < p_to
    and (p_organization_id is null or v.organization_id = p_organization_id)
    and (p_verification_type is null or v.verification_type = p_verification_type)
    and (p_status is null or v.status = p_status)
    and (p_api_key_id is null or v.api_key_id = p_api_key_id)
    and (p_environment is null or k.environment = p_environment);
$$;

-- 5. Per-organization rollup — backs the paginated org table directly
--    (limit/offset/order/wallet-state filter all applied in SQL, so
--    pagination counts stay correct; no client-side filtering after the
--    fact). The 500 KES low-balance threshold mirrors
--    lib/api-usage/metrics.ts's LOW_BALANCE_THRESHOLD_KES — there's no
--    per-org configurable threshold in the schema, so keep these two in
--    sync by hand if that constant ever changes. -------------------------
create or replace function api_usage_org_rollup(
  p_from timestamptz,
  p_to timestamptz,
  p_environment text default null,
  p_verification_type text default null,
  p_status text default null,
  p_search text default null,
  p_wallet_state text default null,
  p_sort text default 'total_requests',
  p_sort_dir text default 'desc',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  organization_id uuid,
  organization_name text,
  organization_status text,
  total_requests bigint,
  successful bigint,
  failed bigint,
  pending bigint,
  amount_consumed numeric,
  active_api_keys bigint,
  last_activity_at timestamptz,
  wallet_balance numeric,
  total_count bigint
)
language sql
stable
as $$
  with scoped as (
    select v.*, k.environment as key_environment
    from kyc_verifications v
    left join api_keys k on k.id = v.api_key_id
    where v.created_at >= p_from
      and v.created_at < p_to
      and (p_verification_type is null or v.verification_type = p_verification_type)
      and (p_status is null or v.status = p_status)
      and (p_environment is null or k.environment = p_environment)
  ),
  rollup as (
    select
      o.id as organization_id,
      o.name as organization_name,
      o.status as organization_status,
      count(s.id) as total_requests,
      count(s.id) filter (where s.status = 'completed' and s.matched is true) as successful,
      count(s.id) filter (where s.status = 'failed') as failed,
      count(s.id) filter (where s.status = 'pending') as pending,
      coalesce(sum(bt.client_price), 0) as amount_consumed,
      (select count(*) from api_keys ak where ak.organization_id = o.id and ak.status = 'active') as active_api_keys,
      max(s.created_at) as last_activity_at,
      coalesce(w.balance, 0) as wallet_balance
    from organizations o
    left join scoped s on s.organization_id = o.id
    left join kyc_billing_transactions bt on bt.verification_id = s.id
    left join kyc_wallets w on w.organization_id = o.id
    where (p_search is null or o.name ilike '%' || p_search || '%')
    group by o.id, o.name, o.status, w.balance
  ),
  filtered as (
    select r.* from rollup r
    where p_wallet_state is null
      or (p_wallet_state = 'zero' and r.wallet_balance <= 0)
      or (p_wallet_state = 'low' and r.wallet_balance > 0 and r.wallet_balance <= 500)
      or (p_wallet_state = 'healthy' and r.wallet_balance > 500)
  ),
  counted as (
    select f.*, count(*) over () as total_count
    from filtered f
  )
  select
    organization_id, organization_name, organization_status, total_requests,
    successful, failed, pending, amount_consumed, active_api_keys,
    last_activity_at, wallet_balance, total_count
  from counted
  order by
    case when p_sort = 'organization_name' and p_sort_dir = 'asc' then organization_name end asc,
    case when p_sort = 'organization_name' and p_sort_dir = 'desc' then organization_name end desc,
    case when p_sort = 'amount_consumed' and p_sort_dir = 'asc' then amount_consumed end asc,
    case when p_sort = 'amount_consumed' and p_sort_dir = 'desc' then amount_consumed end desc,
    case when p_sort = 'last_activity_at' and p_sort_dir = 'asc' then last_activity_at end asc nulls last,
    case when p_sort = 'last_activity_at' and p_sort_dir = 'desc' then last_activity_at end desc nulls last,
    case when p_sort = 'total_requests' and p_sort_dir = 'asc' then total_requests end asc,
    case when (p_sort is null or p_sort = 'total_requests') and (p_sort_dir is null or p_sort_dir = 'desc') then total_requests end desc
  limit p_limit
  offset p_offset;
$$;

-- 6. Per-API-key rollup — org detail page's API Keys section --------------
create or replace function api_usage_api_key_rollup(
  p_organization_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  api_key_id uuid,
  total_requests bigint,
  successful bigint,
  failed bigint,
  pending bigint,
  amount_consumed numeric
)
language sql
stable
as $$
  select
    k.id as api_key_id,
    count(v.id) as total_requests,
    count(v.id) filter (where v.status = 'completed' and v.matched is true) as successful,
    count(v.id) filter (where v.status = 'failed') as failed,
    count(v.id) filter (where v.status = 'pending') as pending,
    coalesce(sum(bt.client_price), 0) as amount_consumed
  from api_keys k
  left join kyc_verifications v
    on v.api_key_id = k.id
    and v.created_at >= p_from
    and v.created_at < p_to
  left join kyc_billing_transactions bt on bt.verification_id = v.id
  where k.organization_id = p_organization_id
  group by k.id;
$$;
