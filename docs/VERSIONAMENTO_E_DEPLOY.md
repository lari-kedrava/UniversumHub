# Versionamento e deploy

A visibilidade do repositório deve seguir a política de acesso definida para o projeto.

## O que pode ir ao GitHub

- Código em `apps/`, `packages/` e `supabase/`.
- Migrações SQL, Edge Functions e arquivos `.env.example` sem valores reais.

## O que nunca pode ir ao GitHub ou Vercel como variável pública

- Arquivos `.env`, `.env.local`, chaves `service_role`, tokens Auvo, senhas e `AUVO_SYNC_SECRET`.
- Qualquer variável com o prefixo `VITE_` contendo segredo. Variáveis `VITE_` são enviadas ao navegador.

## Publicação segura

1. Use o repositório do projeto no GitHub e mantenha seu README atualizado.
2. Adicione o remoto e envie o primeiro commit:

```powershell
git remote add origin https://github.com/SEU-USUARIO/UniversumHub.git
git branch -M main
git push -u origin main
```

3. No Vercel, importe o repositório do projeto. Cadastre `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_API_URL` no projeto web. Nunca cadastre uma service role como variável `VITE_`.
4. Para a API Fastify, use um serviço de backend separado ou migre os endpoints para Edge Functions. Cadastre `SUPABASE_SERVICE_ROLE_KEY` somente nesse backend/Edge Function.
5. Registre os segredos do Auvo exclusivamente como Edge Function Secrets no Supabase.
