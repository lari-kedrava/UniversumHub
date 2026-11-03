-- Perfis operacionais solicitados: administrador e simples.
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users add constraint app_users_role_check
  check (role in ('owner', 'admin', 'simple', 'manager', 'member', 'viewer', 'agenda'));
