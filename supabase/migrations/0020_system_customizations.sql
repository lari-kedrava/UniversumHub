create table if not exists system_customizations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  category text not null, name text not null, config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true, sort_order integer not null default 0,
  created_by uuid references app_users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, category, name)
);
alter table system_customizations enable row level security;
drop policy if exists "system_customizations_same_company" on system_customizations;
create policy "system_customizations_same_company" on system_customizations for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
