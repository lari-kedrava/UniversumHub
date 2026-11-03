-- Controle operacional das tarefas: check-in, pausa, retomada e check-out.
alter table tasks drop constraint if exists tasks_status_check;
alter table tasks add constraint tasks_status_check check (status in ('backlog','todo','in_progress','paused','done','cancelled'));
alter table tasks
  add column if not exists execution_started_at timestamptz,
  add column if not exists execution_last_started_at timestamptz,
  add column if not exists execution_paused_at timestamptz,
  add column if not exists execution_completed_at timestamptz,
  add column if not exists active_seconds integer not null default 0,
  add column if not exists paused_seconds integer not null default 0;

create table if not exists task_execution_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  actor_id uuid not null references app_users(id) on delete restrict,
  action text not null check (action in ('check_in','pause','resume','check_out','reopen')),
  previous_status text,
  new_status text not null,
  occurred_at timestamptz not null default now(),
  active_seconds integer not null default 0,
  paused_seconds integer not null default 0,
  note text
);
create index if not exists idx_task_execution_events_task on task_execution_events(company_id, task_id, occurred_at desc);
alter table task_execution_events enable row level security;
create policy "task_execution_events_same_company" on task_execution_events for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
