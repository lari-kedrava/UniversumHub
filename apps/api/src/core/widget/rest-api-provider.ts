/**
 * Provider de dados "rest_api" — busca dados de uma API REST externa
 * configurada pelo usuário (URL + headers), sem passar pelo sistema
 * de Plugins. Usado para integrações rápidas/ad-hoc.
 */
import type { DataSourceConfig, DataSourceProvider, DataSourceResult } from "@universum/shared";

export const restApiProvider: DataSourceProvider = {
  kind: "rest_api",

  async fetch(config: DataSourceConfig): Promise<DataSourceResult> {
    const url = config.settings.url as string | undefined;
    const headers = (config.settings.headers as Record<string, string>) ?? {};
    if (!url) throw new Error("Fonte de dados REST sem URL configurada.");

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Falha ao consultar API externa: ${response.status}`);

    const data = await response.json();
    const rows = Array.isArray(data) ? data : [data];
    return { rows, total: rows.length };
  },
};
