-- Mantém as exceções de permissão alinhadas aos módulos standalone.
alter table user_permission_overrides
  drop constraint if exists user_permission_overrides_resource_check;

alter table user_permission_overrides
  add constraint user_permission_overrides_resource_check
  check (resource in (
    'clients', 'dashboards', 'widgets', 'data_sources', 'users',
    'permissions', 'plugins', 'projects', 'tasks', 'calendar'
  ));
