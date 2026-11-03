# Universum Hub

Plataforma empresarial modular (SaaS), construída como monorepo.

> As implantações de produção são acionadas a partir da branch `main`.

## Estrutura

```
apps/
  web/      → Frontend (React + Vite + TS + Tailwind)
  api/      → Backend (Fastify)
packages/
  shared/    → Tipos e schemas compartilhados
supabase/
  migrations/ → SQL das tabelas e políticas de RLS
docs/
  ARCHITECTURE.md → Decisões arquiteturais
```

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 20+
- pnpm 9+ (`npm i -g pnpm`)
- Uma conta/projeto no [Supabase](https://supabase.com)

### 2. Instalar dependências
```bash
pnpm install
```

### 3. Configurar variáveis de ambiente
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Mantenha credenciais de backend apenas em `apps/api/.env`. Variáveis `VITE_`
são públicas e nunca devem conter segredos.

### 4. Rodar as migrations
No painel do Supabase (SQL Editor), execute em ordem os arquivos de
`supabase/migrations/`. (Alternativa: usar a Supabase CLI com
`supabase db push`.)

### 5. Subir o projeto
```bash
pnpm dev
```
- Web: http://localhost:5173
- API: http://localhost:3333

## Módulo de referência

O módulo **Clientes** (`apps/api/src/modules/clients`,
`apps/web/src/pages/clients`) implementa o padrão completo
(Repository → Service → Route → API client → React Query) que todo
novo módulo de negócio deve seguir. Veja `docs/ARCHITECTURE.md`.

## Autoria

O sistema foi criado por **Larissa Terezinha Rosa**.
