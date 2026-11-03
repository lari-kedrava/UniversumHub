import type { CreateWidgetInput, UpdateWidgetInput } from "@universum/shared";
import { widgetsRepository } from "./widgets.repository.js";
import { dataSourcesRepository } from "../data-sources/data-sources.repository.js";
import { resolveDataSource } from "../../core/widget/data-source-resolver.js";

export const widgetsService = {
  listByDashboard: (companyId: string, dashboardId: string) =>
    widgetsRepository.findByDashboard(companyId, dashboardId),

  create: (companyId: string, dashboardId: string, input: CreateWidgetInput) =>
    widgetsRepository.create(companyId, dashboardId, input),

  update: (companyId: string, id: string, input: UpdateWidgetInput) =>
    widgetsRepository.update(companyId, id, input),

  remove: (companyId: string, id: string) => widgetsRepository.delete(companyId, id),

  /**
   * Resolve os dados atuais de um widget, buscando a configuração da
   * sua fonte de dados e delegando ao resolver central do núcleo.
   */
  async resolveData(companyId: string, widgetId: string) {
    const widget = await widgetsRepository.findById(companyId, widgetId);
    if (!widget) throw new Error("Widget não encontrado.");
    if (!widget.dataSourceId) return { rows: [], total: 0 };

    const dataSource = await dataSourcesRepository.findById(companyId, widget.dataSourceId);
    if (!dataSource) throw new Error("Fonte de dados do widget não encontrada.");

    return resolveDataSource({
      id: dataSource.id,
      companyId,
      kind: dataSource.kind,
      label: dataSource.label,
      settings: dataSource.settings ?? {},
    });
  },
};
