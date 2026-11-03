import type { FastifyInstance } from "fastify";
import { createDashboardInput, updateDashboardInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js";
import { requirePermission } from "../../core/http/require-permission.js";
import { dashboardsService } from "./dashboards.service.js";

export async function dashboardsRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get("/dashboards", { preHandler: requirePermission("dashboards", "read") }, async (request) => {
    return dashboardsService.list(request.ctx!.companyId);
  });

  server.get<{ Params: { id: string } }>("/dashboards/:id", { preHandler: requirePermission("dashboards", "read") }, async (request, reply) => {
    const dashboard = await dashboardsService.get(request.ctx!.companyId, request.params.id);
    if (!dashboard) return reply.notFound("Dashboard não encontrado.");
    return dashboard;
  });

  server.post("/dashboards", { preHandler: requirePermission("dashboards", "create") }, async (request, reply) => {
    const input = createDashboardInput.parse(request.body);
    const dashboard = await dashboardsService.create(request.ctx!.companyId, request.ctx!.userId, input);
    return reply.code(201).send(dashboard);
  });

  server.patch<{ Params: { id: string } }>("/dashboards/:id", { preHandler: requirePermission("dashboards", "update") }, async (request, reply) => {
    const input = updateDashboardInput.parse(request.body);
    const dashboard = await dashboardsService.update(request.ctx!.companyId, request.params.id, input);
    if (!dashboard) return reply.notFound("Dashboard não encontrado.");
    return dashboard;
  });

  server.delete<{ Params: { id: string } }>("/dashboards/:id", { preHandler: requirePermission("dashboards", "delete") }, async (request, reply) => {
    await dashboardsService.remove(request.ctx!.companyId, request.params.id);
    return reply.code(204).send();
  });
}
