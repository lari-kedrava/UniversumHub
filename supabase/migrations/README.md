# Migrações do banco de dados

As migrações devem permanecer com o prefixo numérico. O Supabase usa essa ordem
para registrar o histórico de alterações; por isso, não renomeie nem reordene um
arquivo depois que ele tiver sido aplicado no projeto.

| Arquivo | Finalidade |
| --- | --- |
| `0001_init_core.sql` | Estrutura inicial: empresas, usuários, perfis e permissões básicas. |
| `0002_clients_module.sql` | Cadastro principal de clientes. |
| `0003_dashboards_widgets.sql` | Dashboards e widgets configuráveis. |
| `0004_permission_overrides.sql` | Exceções e ajustes de permissões por usuário. |
| `0005_work_management.sql` | Projetos, agenda e tarefas base. |
| `0006_extend_permission_resources.sql` | Recursos adicionais usados pelo controle de acesso. |
| `0007_client_details_and_equipment.sql` | Dados complementares de clientes e equipamentos vinculados. |
| `0008_task_details.sql` | Campos detalhados de tarefas, incluindo tipo, prioridade e período. |
| `0024_top_client_rankings.sql` | Ranking manual de prioridades sincronizado e ordenado no Supabase. |
| `0009_team_details.sql` | Informações complementares de equipe e atendentes. |
| `0010_staff_and_task_assignees.sql` | Cadastro de atendentes internos e vínculo do responsável à tarefa. |
| `0011_system_customizations.sql` | Configurações personalizadas criadas pelo administrador. |

## Regra para novas alterações

Crie o próximo arquivo com o número seguinte e um nome descritivo, por exemplo:

```text
0012_integrations_sources.sql
```

Não edite uma migração já aplicada. Para corrigir algo, crie uma nova migração.
