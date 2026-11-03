/**
 * Ponto único de resolução de fontes de dados. Todo widget, seja qual
 * for seu tipo (tabela, gráfico, card etc.), busca seus dados através
 * deste resolver — que apenas despacha para o provider correto
 * conforme `DataSourceConfig.kind`.
 *
 * Adicionar um novo tipo de fonte de dados (ex: "sql", "csv") significa
 * apenas implementar `DataSourceProvider` e registrar aqui, sem tocar
 * em nenhum módulo de widget ou dashboard.
 */
import type { DataSourceConfig, DataSourceProvider, DataSourceQueryParams, DataSourceResult } from "@universum/shared";
import { internalProvider } from "./internal-provider.js";
import { restApiProvider } from "./rest-api-provider.js";
import { pluginProvider } from "./plugin-provider.js";

const providers: Record<string, DataSourceProvider> = {
  internal: internalProvider,
  rest_api: restApiProvider,
  plugin: pluginProvider,
};

export async function resolveDataSource(
  config: DataSourceConfig,
  params: DataSourceQueryParams = {}
): Promise<DataSourceResult> {
  const provider = providers[config.kind];
  if (!provider) {
    throw new Error(`Nenhum provider registrado para o tipo de fonte de dados: ${config.kind}`);
  }
  return provider.fetch(config, params);
}
