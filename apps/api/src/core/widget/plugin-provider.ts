/**
 * Provider de dados "plugin" — delega a busca de dados para um Plugin
 * registrado no PluginRegistry (ex: Auvo, Omie). Esta é a ponte entre
 * o motor de Widgets e o sistema de Plugins, mantendo os dois
 * desacoplados entre si (nenhum conhece a implementação do outro).
 */
import type { DataSourceConfig, DataSourceProvider, DataSourceResult } from "@universum/shared";
import { pluginRegistry } from "../plugin/plugin.registry.js";

export const pluginProvider: DataSourceProvider = {
  kind: "plugin",

  async fetch(config: DataSourceConfig): Promise<DataSourceResult> {
    const pluginId = config.settings.pluginId as string | undefined;
    if (!pluginId) throw new Error("Fonte de dados de plugin sem pluginId configurado.");

    const plugin = pluginRegistry.get(pluginId);
    if (!plugin) throw new Error(`Plugin não encontrado: ${pluginId}`);

    const result = await plugin.sync({ companyId: config.companyId, settings: config.settings });
    return { rows: [result], total: 1 };
  },
};
