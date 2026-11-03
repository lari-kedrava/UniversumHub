/**
 * Contrato que toda integração externa (Auvo, Omie, Google Calendar, etc.)
 * deve implementar para ser registrada no sistema de plugins.
 *
 * Regra de arquitetura: um plugin NUNCA importa nem depende de código do
 * núcleo (apps/api/src/modules/*). A comunicação acontece apenas através
 * deste contrato, registrado no Plugin Registry (apps/api/src/core/plugin).
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  /** Tipos de dados que este plugin é capaz de sincronizar/expor */
  provides: string[];
}

export interface PluginContext {
  companyId: string;
  settings: Record<string, unknown>;
}

export interface Plugin {
  manifest: PluginManifest;
  /** Verifica se as credenciais/configurações informadas são válidas */
  testConnection(ctx: PluginContext): Promise<boolean>;
  /** Sincroniza dados externos para o formato interno do Universum Hub */
  sync(ctx: PluginContext): Promise<{ synced: number }>;
}
