-- ============================================================================
-- Motor de Dashboards + Widgets + Fontes de Dados
-- ============================================================================

create table if not exists data_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  kind text not null check (kind in ('internal','plugin','rest_api','sql','csv','excel','webhook')),
  label text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists dashboards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  owner_id uuid not null references app_users (id) on delete cascade,
  is_shared boolean not null default false,
  is_presentation_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists widgets (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references dashboards (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  type text not null check (type in
    ('table','cards','text','image','video','agenda','calendar','indicator',
     'chart','map','list','ranking','notice','clock','html','iframe','rss')),
  title text not null,
  data_source_id uuid references data_sources (id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  layout_x int not null default 0,
  layout_y int not null default 0,
  layout_w int not null default 4,
  layout_h int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_data_sources_company on data_sources (company_id);
create index if not exists idx_dashboards_company on dashboards (company_id);
create index if not exists idx_widgets_dashboard on widgets (dashboard_id);
create index if not exists idx_widgets_company on widgets (company_id);

alter table data_sources enable row level security;
alter table dashboards enable row level security;
alter table widgets enable row level security;

create policy "data_sources_all_same_company"
  on data_sources for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create policy "dashboards_select_same_company"
  on dashboards for select
  using (company_id = auth_company_id());

create policy "dashboards_insert_same_company"
  on dashboards for insert
  with check (company_id = auth_company_id());

create policy "dashboards_update_same_company"
  on dashboards for update
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create policy "dashboards_delete_own_or_admin"
  on dashboards for delete
  using (company_id = auth_company_id());

create policy "widgets_all_same_company"
  on widgets for all
  using (company_id = auth_company_id())
  with check (company_id = auth_company_id());

create trigger trg_dashboards_updated_at
  before update on dashboards
  for each row
  execute function set_updated_at();

create trigger trg_widgets_updated_at
  before update on widgets
  for each row
  execute function set_updated_at();
