# Projetos, tarefas e agenda

Os módulos standalone de trabalho foram adicionados na migration `0005_work_management.sql`.
Todas as tabelas possuem `company_id`, políticas RLS e também recebem filtro explícito
no backend, pois os repositories usam a chave de serviço do Supabase.

## Limites de responsabilidade

- `modules/projects`: ciclo de vida dos projetos.
- `modules/tasks`: tarefas, prioridade, responsável e vínculo opcional a projeto ou cliente.
- `modules/calendar`: compromissos em intervalo de tempo.

Cada módulo mantém a sequência Route → Service → Repository. As rotas utilizam
`requirePermission` antes de acessar dados. Os recursos de RBAC correspondentes são
`projects`, `tasks` e `calendar`.

## Endpoints

- `GET|POST /api/projects`, `GET|PATCH|DELETE /api/projects/:id`
- `GET|POST /api/tasks`, `GET|PATCH|DELETE /api/tasks/:id`
- `GET|POST /api/calendar-events`, `GET|PATCH|DELETE /api/calendar-events/:id`

`GET /api/calendar-events` aceita os filtros ISO `from` e `to`.
