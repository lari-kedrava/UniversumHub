alter table tasks
  add column if not exists task_scope text not null default 'internal' check (task_scope in ('internal', 'external')),
  add column if not exists task_type text not null default 'general',
  add column if not exists assignee_ids uuid[] not null default '{}',
  add column if not exists location text;
create index if not exists idx_tasks_company_type on tasks(company_id, task_type);
