create table if not exists public.priority_clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
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

do $$
begin
  if to_regclass('public.clientes_prioritarios') is not null then
    if exists (select 1 from public.clientes_prioritarios) then
      raise exception 'clientes_prioritarios contains data and requires an explicit tenant migration';
    end if;
    drop table public.clientes_prioritarios;
  end if;
end
$$;
