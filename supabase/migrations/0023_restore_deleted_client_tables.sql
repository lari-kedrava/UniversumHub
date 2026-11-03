-- Recupera as tabelas de clientes removidas acidentalmente.
-- A migration e idempotente para poder ser aplicada com seguranca.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legal_name text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  address_line text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  state text,
  postal_code text,
  contact_name text,
  whatsapp text,
  priority_level text not null default 'normal'
    check (priority_level in ('normal', 'high', 'urgent')),
  priority_notes text
);

create index if not exists idx_clients_company
  on public.clients (company_id);

alter table public.clients enable row level security;

drop policy if exists "clients_select_same_company" on public.clients;
create policy "clients_select_same_company"
  on public.clients for select to authenticated
  using (company_id = public.auth_company_id());

drop policy if exists "clients_insert_same_company" on public.clients;
create policy "clients_insert_same_company"
  on public.clients for insert to authenticated
  with check (company_id = public.auth_company_id());

drop policy if exists "clients_update_same_company" on public.clients;
create policy "clients_update_same_company"
  on public.clients for update to authenticated
  using (company_id = public.auth_company_id())
  with check (company_id = public.auth_company_id());

drop policy if exists "clients_delete_same_company" on public.clients;
create policy "clients_delete_same_company"
  on public.clients for delete to authenticated
  using (company_id = public.auth_company_id());

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create table if not exists public.client_equipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  equipment_type text not null,
  system_type text,
  name text,
  serial_number text,
  description text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_client_equipments_company_client
  on public.client_equipments(company_id, client_id);

alter table public.client_equipments enable row level security;

drop policy if exists "client_equipments_same_company" on public.client_equipments;
create policy "client_equipments_same_company"
  on public.client_equipments for all to authenticated
  using (company_id = public.auth_company_id())
  with check (company_id = public.auth_company_id());

drop trigger if exists trg_client_equipments_updated_at on public.client_equipments;
create trigger trg_client_equipments_updated_at
  before update on public.client_equipments
  for each row execute function public.set_updated_at();

create table if not exists public.priority_clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  contact_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create index if not exists idx_priority_clients_company_name
  on public.priority_clients (company_id, lower(name));

alter table public.priority_clients enable row level security;

drop policy if exists "priority_clients_select_same_company" on public.priority_clients;
create policy "priority_clients_select_same_company"
  on public.priority_clients for select to authenticated
  using (company_id = public.auth_company_id());

drop policy if exists "priority_clients_manage_elevated" on public.priority_clients;
create policy "priority_clients_manage_elevated"
  on public.priority_clients for all to authenticated
  using (
    company_id = public.auth_company_id()
    and exists (
      select 1 from public.app_users
      where auth_user_id = auth.uid()
        and company_id = public.priority_clients.company_id
        and role in ('owner', 'admin')
        and is_active
    )
  )
  with check (
    company_id = public.auth_company_id()
    and exists (
      select 1 from public.app_users
      where auth_user_id = auth.uid()
        and company_id = public.priority_clients.company_id
        and role in ('owner', 'admin')
        and is_active
    )
  );

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.client_equipments to authenticated;
grant select, insert, update, delete on public.priority_clients to authenticated;
grant all on public.clients to service_role;
grant all on public.client_equipments to service_role;
grant all on public.priority_clients to service_role;

-- O DROP ... CASCADE removeu estas FKs. Recria apenas quando os dados
-- remanescentes nao apontam para IDs de clientes que foram perdidos.
do $$
begin
  if to_regclass('public.tasks') is not null
     and not exists (
       select 1 from public.tasks t
       where t.client_id is not null
         and not exists (select 1 from public.clients c where c.id = t.client_id)
     )
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.tasks'::regclass
         and conname = 'tasks_client_id_fkey'
     ) then
    alter table public.tasks
      add constraint tasks_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete set null;
  end if;

  if to_regclass('public.client_equipments') is not null
     and not exists (
       select 1 from public.client_equipments e
       where not exists (select 1 from public.clients c where c.id = e.client_id)
     )
     and not exists (
       select 1 from pg_constraint
       where conrelid = 'public.client_equipments'::regclass
         and conname = 'client_equipments_client_id_fkey'
     ) then
    alter table public.client_equipments
      add constraint client_equipments_client_id_fkey
      foreign key (client_id) references public.clients(id) on delete cascade;
  end if;
end
$$;

notify pgrst, 'reload schema';
