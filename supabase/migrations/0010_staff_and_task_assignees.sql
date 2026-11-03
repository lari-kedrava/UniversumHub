create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id) on delete cascade,
  name text not null, phone text, position text, department text, notes text,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_staff_members_company_active on staff_members(company_id, is_active);
alter table staff_members enable row level security;
drop policy if exists "staff_members_same_company" on staff_members;
create policy "staff_members_same_company" on staff_members for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
alter table tasks add column if not exists assignee_staff_id uuid references staff_members(id) on delete set null;
create index if not exists idx_tasks_assignee_staff on tasks(assignee_staff_id);
