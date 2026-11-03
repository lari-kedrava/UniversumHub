# Arquitetura — Universum Hub

## Visão geral

Monorepo (pnpm workspaces + Turborepo) com três pacotes principais:

- `apps/web` — frontend React + Vite + TypeScript + Tailwind
- `apps/api` — backend Fastify (Service Layer + Repository Pattern)
- `packages/shared` — tipos e schemas Zod compartilhados entre web e api

## Multi-tenancy

Cada empresa é uma linha em `companies`. Todo dado de negócio carrega
`company_id`. O isolamento é garantido em duas camadas:

1. **RLS no Postgres/Supabase** (defesa primária) — policies baseadas na
   função `auth_company_id()`.
2. **Filtro explícito no Repository** (defesa em profundidade) — necessário
   porque o backend usa a Service Role Key, que ignora RLS.

## Fluxo de uma requisição (módulo Clientes como referência)

```
Frontend (ClientsPage)
  -> lib/api.ts (injeta token JWT do Supabase)
  -> Fastify route (clients.routes.ts)      -> valida input com Zod
  -> Service (clients.service.ts)           -> regra de negócio
  -> Repository (clients.repository.ts)     -> acesso a dados (filtra company_id)
  -> Supabase/Postgres (protegido por RLS)
```

Todo novo módulo de negócio deve seguir exatamente este padrão de 3 camadas.

## Sistema de Plugins

Plugins implementam a interface `Plugin` (`packages/shared/src/types/plugin.ts`)
e são registrados em `apps/api/src/plugins/index.ts`. Nenhum plugin importa
código de `apps/api/src/modules/*` — a única superfície de contato é o
`PluginRegistry`. Isso garante que adicionar uma integração nova (Auvo, Omie,
Google Calendar etc.) nunca exige alterar o núcleo.

## Sistema de Widgets/Dashboards

Modelado em `packages/shared/src/types/widget.ts` e `data-source.ts`.
Todo widget consome dados através da interface `DataSourceProvider`
(`internal`, `plugin`, `rest_api`, `sql`, `csv`, `excel`, `webhook`).

Fluxo de dados de um widget:
```
DashboardGrid (frontend, react-grid-layout)
  -> WidgetRenderer                          -> escolhe o componente visual pelo `type`
  -> useWidgetData (React Query)             -> GET /api/widgets/:id/data
  -> widgets.routes -> widgets.service.resolveData
  -> data-source-resolver.ts                 -> despacha por `kind`
  -> internal-provider | rest-api-provider | plugin-provider
```

Persistência de layout (posição/tamanho) é feita a cada `onDragStop`/
`onResizeStop` do grid, via `PATCH /api/widgets/:id`.

Tipos de widget com renderer implementado nesta etapa: `indicator`,
`table`, `cards`, `text`, `clock`, `iframe`/`html`. Os demais tipos já
estão modelados no banco e nos tipos compartilhados — adicionar o
renderer é o único passo necessário (`components/widgets/widget-renderer.tsx`).

Fontes de dados (`data_sources`) são cadastradas via
`POST /api/data-sources` e referenciadas pelo `dataSourceId` do widget.
O provider `internal` usa uma allowlist de tabelas por segurança
(`core/widget/internal-provider.ts`) — nunca aceita nome de tabela
arbitrário vindo do cliente.

## Próximas etapas sugeridas

1. Módulo de Permissões (RBAC dinâmico por empresa)
2. Renderers restantes de widget (gráficos com recharts, mapa, agenda, RSS)
3. Templates de dashboard e duplicação
4. Módulos de negócio restantes (Funcionários, Equipes, Agenda, Projetos,
   Tarefas, Indicadores, Relatórios, Notificações, Logs)
5. Plugins reais (Auvo, Omie, Google Calendar, Microsoft 365)
6. Modo Apresentação (rotação automática de dashboards em TVs/monitores)
