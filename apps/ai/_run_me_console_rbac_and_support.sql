-- Run this once against Supabase before deploying this branch's code.
-- Safe to re-run (every statement is idempotent).

-- ─── Console notification "seen" state ─────────────────────────────────
alter table public.profiles
  add column if not exists console_notifications_seen_at timestamptz;

-- ─── Staff RBAC migration: seed dynamic roles + backfill custom_staff_role_id ──
insert into public.staff_roles (name, permissions) values
  ('Chief Technology Officer', '{"guard":true,"metrics":true,"audit":true,"kyc_ops":true,"api_usage":true}'),
  ('Tech Lead',               '{"guard":true,"metrics":true,"kyc_ops":true,"api_usage":true}'),
  ('Senior Developer',        '{"guard":true,"metrics":true,"kyc_ops":true,"api_usage":true}'),
  ('Developer',               '{"guard":true,"metrics":true,"kyc_ops":true,"api_usage":true}'),
  ('ML Lead',                 '{"guard":true,"metrics":true,"kyc_ops":true,"api_usage":true}'),
  ('Cyber Security',          '{"guard":true,"metrics":true,"audit":true,"kyc_ops":true,"api_usage":true}'),
  ('Product Manager',         '{"clients":true,"product_access":true,"subscriptions":true,"inquiries":true,"kyc_ops":true,"kyc_ops_financial":true,"api_usage":true,"api_usage_export":true,"api_usage_wallet":true}'),
  ('Finance & HR',            '{"clients":true,"inquiries":true,"kyc_ops":true,"kyc_ops_financial":true,"api_usage":true,"api_usage_export":true,"api_usage_wallet":true}'),
  ('Head of Marketing',       '{"blog_write":true,"blog_review":true,"inquiries":true}'),
  ('Content Admin',           '{"blog_write":true,"blog_review":true,"inquiries":true}'),
  ('Content Writer',          '{"blog_write":true}')
on conflict (name) do nothing;

update public.profiles p
set custom_staff_role_id = r.id
from public.staff_roles r, (
  select unnest(array['cto','tech_lead','senior_dev','developer','ml_lead','cyber_sec',
                       'product_manager','finance_hr','marketing_head','content_admin','content_writer']) as role,
         unnest(array['Chief Technology Officer','Tech Lead','Senior Developer','Developer','ML Lead','Cyber Security',
                       'Product Manager','Finance & HR','Head of Marketing','Content Admin','Content Writer']) as label
) m
where p.xobriq_staff_role = m.role and r.name = m.label and p.custom_staff_role_id is null;

-- ─── Inquiry reply thread ───────────────────────────────────────────────
create table if not exists public.inquiry_replies (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sent_by uuid references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_replies_inquiry_id_idx on public.inquiry_replies (inquiry_id);
