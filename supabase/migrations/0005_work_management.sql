-- Núcleo standalone de trabalho: projetos, tarefas e agenda corporativa.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  name text not null, description text, status text not null default 'planned' check (status in ('planned','active','on_hold','completed','archived')),
  color text not null default '#6366f1', owner_id uuid references app_users(id) on delete set null,
  starts_at timestamptz, due_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null, client_id uuid references clients(id) on delete set null,
  title text not null, description text, status text not null default 'todo' check (status in ('backlog','todo','in_progress','done','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee_id uuid references app_users(id) on delete set null, created_by uuid not null references app_users(id),
  starts_at timestamptz, due_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  title text not null, description text, starts_at timestamptz not null, ends_at timestamptz not null,
  all_day boolean not null default false, color text not null default '#6366f1', owner_id uuid not null references app_users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (ends_at > starts_at)
);
create index if not exists idx_projects_company on projects(company_id);
create index if not exists idx_tasks_company_status on tasks(company_id, status);
create index if not exists idx_tasks_due_at on tasks(company_id, due_at);
create index if not exists idx_events_company_range on calendar_events(company_id, starts_at, ends_at);
alter table projects enable row level security; alter table tasks enable row level security; alter table calendar_events enable row level security;
create policy "projects_same_company" on projects for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "tasks_same_company" on tasks for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create policy "calendar_events_same_company" on calendar_events for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
create trigger trg_projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks for each row execute function set_updated_at();
create trigger trg_calendar_events_updated_at before update on calendar_events for each row execute function set_updated_at();
