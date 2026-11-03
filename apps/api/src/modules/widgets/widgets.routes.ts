/**
 * Rotas do módulo Widgets, aninhadas sob um dashboard
 * (`/dashboards/:dashboardId/widgets`) e uma rota extra para resolver
 * os dados de um widget específico em tempo real.
 */
import type { FastifyInstance } from "fastify";
import { createWidgetInput, updateWidgetInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js";
import { requirePermission } from "../../core/http/require-permission.js";
import { widgetsService } from "./widgets.service.js";

export async function widgetsRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get<{ Params: { dashboardId: string } }>(
    "/dashboards/:dashboardId/widgets",
    { preHandler: requirePermission("widgets", "read") },
    async (request) => widgetsService.listByDashboard(request.ctx!.companyId, request.params.dashboardId)
  );

  server.post<{ Params: { dashboardId: string } }>(
    "/dashboards/:dashboardId/widgets",
    { preHandler: requirePermission("widgets", "create") },
    async (request, reply) => {
      const input = createWidgetInput.parse(request.body);
      const widget = await widgetsService.create(request.ctx!.companyId, request.params.dashboardId, input);
      return reply.code(201).send(widget);
    }
  );

  server.patch<{ Params: { id: string } }>("/widgets/:id", { preHandler: requirePermission("widgets", "update") }, async (request, reply) => {
    const input = updateWidgetInput.parse(request.body);
    const widget = await widgetsService.update(request.ctx!.companyId, request.params.id, input);
    if (!widget) return reply.notFound("Widget não encontrado.");
    return widget;
  });

  server.delete<{ Params: { id: string } }>("/widgets/:id", { preHandler: requirePermission("widgets", "delete") }, async (request, reply) => {
    await widgetsService.remove(request.ctx!.companyId, request.params.id);
    return reply.code(204).send();
  });

  server.get<{ Params: { id: string } }>("/widgets/:id/data", { preHandler: requirePermission("widgets", "read") }, async (request, reply) => {
    try {
      const result = await widgetsService.resolveData(request.ctx!.companyId, request.params.id);
      return result;
    } catch (error) {
      return reply.badRequest((error as Error).message);
    }
  });
}
