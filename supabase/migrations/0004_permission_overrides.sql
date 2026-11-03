-- Exceções de acesso por usuário. A matriz padrão de cada papel está no backend.
create table if not exists user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references app_users (id) on delete cascade,
  resource text not null check (resource in ('clients', 'dashboards', 'widgets', 'data_sources', 'users', 'permissions', 'plugins')),
  action text not null check (action in ('create', 'read', 'update', 'delete', 'manage')),
  granted boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource, action)
);
create index if not exists idx_permission_overrides_company_user on user_permission_overrides (company_id, user_id);
alter table user_permission_overrides enable row level security;
create policy "permission_overrides_same_company" on user_permission_overrides for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create trigger trg_permission_overrides_updated_at before update on user_permission_overrides for each row execute function set_updated_at();
