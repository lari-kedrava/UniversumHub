-- Padronização dos nomes da integração Auvo. Preserva integralmente os dados, índices, RLS e triggers.
do $$ begin
  if to_regclass('public.integration_auvo_tasks') is not null and to_regclass('public.auvo_tasks') is null then alter table public.integration_auvo_tasks rename to auvo_tasks; end if;
  if to_regclass('public.integration_auvo_webhook_events') is not null and to_regclass('public.auvo_webhook_events') is null then alter table public.integration_auvo_webhook_events rename to auvo_webhook_events; end if;
end $$;
