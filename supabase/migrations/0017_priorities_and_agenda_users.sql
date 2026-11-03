-- Prioridades de atendimento e perfil restrito à agenda.
alter table public.clients
  add column if not exists priority_level text not null default 'normal'
  check (priority_level in ('normal', 'high', 'urgent'));

alter table public.clients
  add column if not exists priority_notes text;

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users add constraint app_users_role_check
  check (role in ('owner', 'admin', 'manager', 'member', 'viewer', 'agenda'));

create unique index if not exists one_owner_per_company
  on public.app_users (company_id) where role = 'owner';
