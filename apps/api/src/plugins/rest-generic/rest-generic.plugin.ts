/**
 * Plugin de exemplo: consome uma API REST genérica configurada pelo
 * usuário (URL + headers) e expõe os dados como fonte para Widgets.
 *
 * Serve como referência de implementação para futuros plugins
 * (Auvo, Omie, Google Calendar etc.) — todos seguem este mesmo contrato.
 */
import type { Plugin, PluginContext } from "@universum/shared";

export const restGenericPlugin: Plugin = {
  manifest: {
    id: "rest-generic",
    name: "API REST Genérica",
    version: "1.0.0",
    description: "Conecta o Universum Hub a qualquer API REST configurável.",
    provides: ["custom_data"],
  },

  async testConnection(ctx: PluginContext): Promise<boolean> {
    const url = ctx.settings.baseUrl as string | undefined;
    if (!url) return false;
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  },

  async sync(ctx: PluginContext): Promise<{ synced: number }> {
    const url = ctx.settings.baseUrl as string | undefined;
    if (!url) return { synced: 0 };
    const response = await fetch(url);
    const data = await response.json();
    const rows = Array.isArray(data) ? data : [data];
    return { synced: rows.length };
  },
};
