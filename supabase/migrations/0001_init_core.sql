-- ============================================================================
-- Universum Hub — Migração inicial (núcleo multiempresa)
-- Cria as tabelas base de tenant (companies) e usuários (app_users),
-- e habilita Row Level Security como primeira barreira de isolamento
-- entre empresas.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'member', 'viewer')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_users_company on app_users (company_id);

-- Função auxiliar: retorna o company_id do usuário autenticado atual.
-- Usada em todas as policies de RLS deste projeto.
create or replace function auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from app_users where auth_user_id = auth.uid()
$$;

alter table companies enable row level security;
alter table app_users enable row level security;

-- Um usuário só enxerga a própria empresa.
create policy "companies_select_own"
  on companies for select
  using (id = auth_company_id());

-- Um usuário só enxerga usuários da própria empresa.
create policy "app_users_select_same_company"
  on app_users for select
  using (company_id = auth_company_id());
