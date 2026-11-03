# Integração Auvo no Supabase

## Funções

- `auvo-sync`: sincroniza tarefas e agenda; recebe período e busca detalhe completo somente na primeira sincronização, ou com `full: true`.
- `auvo-sync-resources`: sincroniza usuários, clientes, tipos, equipes e catálogos do projeto.
- `auvo-webhook`: recebe eventos do Auvo e registra para processamento seguro.
- `auvo-agenda`: expõe para a TV somente os campos necessários e respeita o `company_id` do usuário autenticado.

## Secrets a preencher no Supabase

Preencha somente no painel/CLI de Secrets. Nunca crie `VITE_` para estes valores e nunca os coloque em Git.

```text
AUVO_BEARER_TOKEN=token_bearer_atual_do_auvo
# Alternativa legada: AUVO_API_KEY e AUVO_API_TOKEN
AUVO_SYNC_SECRET=segredo_longo_aleatorio_para_chamadas_de_sincronizacao
AUVO_WEBHOOK_SECRET=segredo_longo_aleatorio_para_webhooks
APP_ORIGIN=https://seu-dominio-no-vercel.app
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são fornecidos às Edge Functions pelo ambiente Supabase. Não os exponha no frontend.

## Publicação após a auditoria

```powershell
supabase functions deploy auvo-sync
supabase functions deploy auvo-sync-resources
supabase functions deploy auvo-webhook --no-verify-jwt
supabase functions deploy auvo-agenda
```

Após publicar, crie uma chamada protegida para `auvo-sync` com `x-auvo-sync-secret` e um período curto para validar os dados antes de habilitar a TV.
