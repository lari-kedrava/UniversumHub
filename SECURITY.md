# Segurança

Relate vulnerabilidades de forma privada pela opção **Security advisories** do repositório no GitHub. Não publique detalhes, provas de conceito, credenciais ou dados pessoais em issues.

Chaves, tokens e senhas devem permanecer exclusivamente nos gerenciadores de segredos dos ambientes. Se uma credencial for exposta, revogue-a antes de remover o conteúdo do Git.

## Exceção auditada

`GHSA-qwww-vcr4-c8h2` afeta exclusivamente o modo RSC do React Router. Este projeto utiliza SPA com Vite e não habilita RSC. A exceção deve ser removida assim que uma versão corrigida compatível estiver publicada.
