/**
 * Ponto único de registro de plugins. Para adicionar uma nova
 * integração, crie a pasta em `plugins/<nome>` seguindo o padrão de
 * `rest-generic`, implemente a interface `Plugin` e registre-a aqui.
 */
import { pluginRegistry } from "../core/plugin/plugin.registry.js";
import { restGenericPlugin } from "./rest-generic/rest-generic.plugin.js";

export function registerPlugins(): void {
  pluginRegistry.register(restGenericPlugin);
}
