/**
 * Contexto de requisição autenticada. É montado pelo hook `onRequest`
 * (ver core/http/auth-hook.ts) a partir do token JWT do Supabase e
 * injetado em toda rota, garantindo que nenhum handler acesse dados
 * sem saber explicitamente de qual empresa (companyId) eles são.
 */
export interface RequestContext {
  userId: string;
  companyId: string;
  role: string;
}

declare module "fastify" {
  interface FastifyRequest {
    ctx?: RequestContext;
  }
}
