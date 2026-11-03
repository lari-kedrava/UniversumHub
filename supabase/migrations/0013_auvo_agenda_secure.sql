-- Integração Auvo: dados de agenda isolados por empresa.
-- Credenciais do Auvo NÃO pertencem a esta tabela. Use somente Edge Function Secrets.
create table if not exists public.integration_auvo_tasks (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  auvo_task_id text not null,
  title text,
  status text,
  task_type text,
  service_type text,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  attendant_id text,
  attendant_name text,
  customer_id text,
  customer_name text,
  source_updated_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, auvo_task_id)
);

-- Compatibilidade com a tabela criada anteriormente no SQL Editor.
alter table public.integration_auvo_tasks add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.integration_auvo_tasks add column if not exists title text;
alter table public.integration_auvo_tasks add column if not exists service_type text;
alter table public.integration_auvo_tasks add column if not exists updated_at timestamptz not null default now();
alter table public.integration_auvo_tasks drop constraint if exists integration_auvo_tasks_auvo_task_id_key;
create unique index if not exists integration_auvo_tasks_company_task_key on public.integration_auvo_tasks(company_id, auvo_task_id);
create index if not exists integration_auvo_tasks_agenda_idx on public.integration_auvo_tasks(company_id, scheduled_start_at);
create index if not exists integration_auvo_tasks_filters_idx on public.integration_auvo_tasks(company_id, status, task_type, attendant_id);

create table if not exists public.integration_auvo_webhook_events (
  event_id text primary key,
  company_id uuid references public.companies(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);
alter table public.integration_auvo_webhook_events add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.integration_auvo_tasks enable row level security;
alter table public.integration_auvo_webhook_events enable row level security;
revoke all on public.integration_auvo_tasks from anon, authenticated;
revoke all on public.integration_auvo_webhook_events from anon, authenticated;
grant select on public.integration_auvo_tasks to authenticated;

drop policy if exists "auvo_tasks_select_own_company" on public.integration_auvo_tasks;
create policy "auvo_tasks_select_own_company" on public.integration_auvo_tasks
  for select to authenticated using (company_id = public.auth_company_id());

-- Nenhum usuário do navegador grava tarefas Auvo ou lê logs de webhook.
-- Somente a service_role das Edge Functions pode gravar ou processar esses dados.
drop trigger if exists trg_integration_auvo_tasks_updated_at on public.integration_auvo_tasks;
create trigger trg_integration_auvo_tasks_updated_at before update on public.integration_auvo_tasks
  for each row execute function public.set_updated_at();
