# Monorepo

O repositório usa `pnpm` workspaces e Turborepo. Os aplicativos ficam em
`apps/*` e pacotes reutilizáveis em `packages/*`.

## Contrato do pacote compartilhado

`@universum/shared` é um pacote ESM compilado. O código-fonte está em `src`,
mas somente `dist` é exposto para consumidores:

- `dist/index.js`: módulo ESM executável;
- `dist/index.d.ts`: declarações de tipo;
- `package.json#exports`: única entrada pública do pacote.

Essa separação impede que o Node ou o `tsx` tentem interpretar arquivos
TypeScript do pacote como JavaScript em runtime.

## Ordem de tarefas

`build` gera primeiro os pacotes dos quais cada aplicação depende. As tarefas
`typecheck` e `dev` dependem de `^build`; assim, um checkout limpo compila o
pacote compartilhado antes de iniciar Fastify ou Vite. O modo `dev` do pacote
compartilhado também observa mudanças em suas fontes para desenvolvimento
local.

## Aliases

O alias `@/*` é exclusivo de `apps/web`: TypeScript e Vite o resolvem para
`apps/web/src`. Comunicação entre aplicações deve usar pacotes de workspace,
nunca aliases relativos entre pastas.
