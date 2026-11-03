alter table data_sources add column if not exists is_active boolean not null default true;
alter table data_sources add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_data_sources_active on data_sources (company_id, is_active);
