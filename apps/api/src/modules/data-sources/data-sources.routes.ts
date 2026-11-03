/**
 * Rotas do módulo Fontes de Dados. Permite ao administrador cadastrar
 * de onde os widgets podem puxar dados (interno, REST, plugin, etc.).
 */
import type { FastifyInstance } from "fastify";
import { createDataSourceInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js";
import { requirePermission } from "../../core/http/require-permission.js";
import { dataSourcesRepository } from "./data-sources.repository.js";

export async function dataSourcesRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get("/data-sources", { preHandler: requirePermission("data_sources", "read") }, async (request) => {
    return dataSourcesRepository.findAll(request.ctx!.companyId);
  });

  server.post("/data-sources", { preHandler: requirePermission("data_sources", "create") }, async (request, reply) => {
    const input = createDataSourceInput.parse(request.body);
    const created = await dataSourcesRepository.create(request.ctx!.companyId, input);
    return reply.code(201).send(created);
  });
  server.patch<{ Params: { id: string }; Body: { label?: string; kind?: string; settings?: Record<string, unknown>; isActive?: boolean } }>("/data-sources/:id", { preHandler: requirePermission("data_sources", "update") }, async (request, reply) => {
    const body = request.body ?? {};
    const updated = await dataSourcesRepository.update(request.ctx!.companyId, request.params.id, { label: body.label, kind: body.kind, settings: body.settings, is_active: body.isActive });
    if (!updated) return reply.notFound("Integração não encontrada.");
    return updated;
  });
  server.post<{ Params: { id: string } }>("/data-sources/:id/test", { preHandler: requirePermission("data_sources", "read") }, async (request, reply) => {
    const source = await dataSourcesRepository.findById(request.ctx!.companyId, request.params.id);
    if (!source) return reply.notFound("Integração não encontrada.");
    if (source.kind === "rest_api" && !String((source.settings as Record<string, unknown>).url ?? "").startsWith("http")) return reply.badRequest("A URL da API REST não está configurada.");
    return { ok: true, message: "Configuração validada. A conexão será consultada quando o widget consumir esta fonte." };
  });

  server.delete<{ Params: { id: string } }>("/data-sources/:id", { preHandler: requirePermission("data_sources", "delete") }, async (request, reply) => {
    await dataSourcesRepository.delete(request.ctx!.companyId, request.params.id);
    return reply.code(204).send();
  });
}
