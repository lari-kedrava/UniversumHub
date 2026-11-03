/**
 * Registro central de Plugins (integrações).
 *
 * Este é o ÚNICO ponto de acoplamento entre o núcleo e uma integração.
 * Adicionar um novo plugin significa apenas chamar `pluginRegistry.register(...)`
 * em `plugins/index.ts` — nenhum módulo de negócio precisa ser alterado.
 */
import type { Plugin } from "@universum/shared";

class PluginRegistry {
  private plugins = new Map<string, Plugin>();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin já registrado: ${plugin.manifest.id}`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
