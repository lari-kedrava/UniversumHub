-- Recursos complementares da integração Auvo. Credenciais ficam apenas em Edge Function Secrets.
create table if not exists public.auvo_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_user_id text not null, name text, email text, is_active boolean, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, auvo_user_id)
);
create table if not exists public.auvo_customers (
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_customer_id text not null, name text, document text, email text, phone text, address text, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, auvo_customer_id)
);
create table if not exists public.auvo_task_types (
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_task_type_id text not null, description text, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, auvo_task_type_id)
);
create table if not exists public.auvo_teams (
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_team_id text not null, name text, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, auvo_team_id)
);
create table if not exists public.auvo_team_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_team_id text not null, auvo_user_id text not null, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, auvo_team_id, auvo_user_id)
);
create table if not exists public.auvo_catalog_items (
  company_id uuid not null references public.companies(id) on delete cascade,
  resource_type text not null, auvo_item_id text not null, name text, raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(), primary key (company_id, resource_type, auvo_item_id)
);
create table if not exists public.auvo_sync_runs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  resource text not null, status text not null check (status in ('running','success','failed')), started_at timestamptz not null default now(), finished_at timestamptz,
  records_processed integer not null default 0, error text
);

do $$ declare target text; begin
  foreach target in array array['auvo_users','auvo_customers','auvo_task_types','auvo_teams','auvo_team_members','auvo_catalog_items','auvo_sync_runs'] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('revoke all on public.%I from anon, authenticated', target);
    if target <> 'auvo_sync_runs' then
      execute format('grant select on public.%I to authenticated', target);
      execute format('create policy %I on public.%I for select to authenticated using (company_id = public.auth_company_id())', target || '_select_own_company', target);
    end if;
  end loop;
end $$;

create index if not exists auvo_catalog_company_resource_idx on public.auvo_catalog_items(company_id, resource_type);
create index if not exists auvo_sync_runs_company_idx on public.auvo_sync_runs(company_id, started_at desc);
