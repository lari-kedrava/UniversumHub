-- Mantem as duas listas da tela Top Clientes como dados compartilhados no Supabase.
create table if not exists public.top_prioridades (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  periodo_inicio timestamptz not null,
  periodo_fim timestamptz not null,
  posicao integer not null check (posicao > 0),
  cliente_nome text not null check (length(btrim(cliente_nome)) > 0),
  quantidade_atendimentos integer not null default 0 check (quantidade_atendimentos >= 0),
  calculado_em timestamptz not null default now()
);

create index if not exists idx_top_prioridades_company_batch_position
  on public.top_prioridades (company_id, calculado_em desc, posicao);

alter table public.top_prioridades enable row level security;

drop policy if exists "top_prioridades_select_same_company" on public.top_prioridades;
create policy "top_prioridades_select_same_company"
  on public.top_prioridades for select to authenticated
  using (company_id = public.auth_company_id());

drop policy if exists "top_prioridades_manage_same_company" on public.top_prioridades;
create policy "top_prioridades_manage_same_company"
  on public.top_prioridades for all to authenticated
  using (company_id = public.auth_company_id())
  with check (company_id = public.auth_company_id());

grant select, insert, update, delete on public.top_prioridades to authenticated;
grant all on public.top_prioridades to service_role;

notify pgrst, 'reload schema';
