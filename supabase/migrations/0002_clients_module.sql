-- ============================================================================
-- Módulo Clientes — tabela de referência para os demais módulos de
-- negócio seguirem o mesmo padrão de multiempresa + RLS.
-- ============================================================================

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_company on clients (company_id);

alter table clients enable row level security;

create policy "clients_select_same_company"
  on clients for select
  using (company_id = auth_company_id());

create policy "clients_insert_same_company"
  on clients for insert
  with check (company_id = auth_company_id());

create policy "clients_update_same_company"
  on clients for update
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create policy "clients_delete_same_company"
  on clients for delete
  using (company_id = auth_company_id());

-- Mantém `updated_at` sempre atualizado.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at
  before update on clients
  for each row
  execute function set_updated_at();
