alter table clients
  add column if not exists legal_name text,
  add column if not exists status text not null default 'active' check (status in ('active', 'inactive')),
  add column if not exists address_line text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists contact_name text,
  add column if not exists whatsapp text;

create table if not exists client_equipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
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
create index if not exists idx_client_equipments_company_client on client_equipments(company_id, client_id);
alter table client_equipments enable row level security;
drop policy if exists "client_equipments_same_company" on client_equipments;
create policy "client_equipments_same_company" on client_equipments for all using (company_id = auth_company_id()) with check (company_id = auth_company_id());
drop trigger if exists trg_client_equipments_updated_at on client_equipments;
create trigger trg_client_equipments_updated_at before update on client_equipments for each row execute function set_updated_at();
