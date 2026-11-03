/**
 * Rotas HTTP do módulo Clientes — camada fina que apenas:
 *  1. valida entrada (Zod, via `@universum/shared`);
 *  2. delega para o Service Layer;
 *  3. formata a resposta.
 * Nenhuma regra de negócio ou acesso a dados acontece aqui.
 */
import type { FastifyInstance } from "fastify";
import { createClientInput, updateClientInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js";
import { requirePermission } from "../../core/http/require-permission.js";
import { alertClientsService, clientsService } from "./clients.service.js";
import { createEquipmentInput, updateEquipmentInput } from "@universum/shared";
import { equipmentRepository } from "./equipment.repository.js";
import { alertsRepository } from "./alerts.repository.js";

export async function clientsRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get("/clients", { preHandler: requirePermission("clients", "read") }, async (request) => {
    return clientsService.list(request.ctx!.companyId);
  });

  server.get("/alert-clients", { preHandler: requirePermission("clients", "read") }, async (request) => {
    return alertClientsService.list(request.ctx!.companyId);
  });

  server.get("/alerts", { preHandler: requirePermission("clients", "read") }, async (request) => {
    return alertsRepository.findAll(request.ctx!.companyId);
  });

  server.post("/alert-clients", { preHandler: requirePermission("clients", "create") }, async (request, reply) => {
    const input = createClientInput.parse(request.body);
    return reply.code(201).send(await alertClientsService.create(request.ctx!.companyId, input));
  });

  server.post<{ Body: { confirmation?: string } }>("/alert-clients/priorities/clear", { preHandler: requirePermission("clients", "update") }, async (request, reply) => {
    if (request.body?.confirmation?.trim().toLocaleUpperCase("pt-BR") !== "CONFIRMO") {
      return reply.badRequest('Digite "CONFIRMO" para limpar os clientes prioritários.');
    }
    return { cleared: await alertClientsService.clearPriorities(request.ctx!.companyId) };
  });

  server.patch<{ Params: { id: string } }>("/alert-clients/:id", { preHandler: requirePermission("clients", "update") }, async (request, reply) => {
    const client = await alertClientsService.update(request.ctx!.companyId, request.params.id, updateClientInput.parse(request.body));
    return client ?? reply.notFound("Cliente de alerta não encontrado.");
  });

  server.delete<{ Params: { id: string } }>("/alert-clients/:id", { preHandler: requirePermission("clients", "delete") }, async (request, reply) => {
    await alertClientsService.remove(request.ctx!.companyId, request.params.id);
    return reply.code(204).send();
  });

  server.get<{ Params: { id: string } }>("/clients/:id", { preHandler: requirePermission("clients", "read") }, async (request, reply) => {
    const client = await clientsService.get(request.ctx!.companyId, request.params.id);
    if (!client) return reply.notFound("Cliente não encontrado.");
    return client;
  });

  server.post("/clients", { preHandler: requirePermission("clients", "create") }, async (request, reply) => {
    const input = createClientInput.parse(request.body);
    const client = await clientsService.create(request.ctx!.companyId, input);
    return reply.code(201).send(client);
  });

  server.post<{ Body: { confirmation?: string } }>("/clients/priorities/clear", { preHandler: requirePermission("clients", "update") }, async (request, reply) => {
    if (request.body?.confirmation?.trim().toLocaleUpperCase("pt-BR") !== "CONFIRMO") {
      return reply.badRequest('Digite "CONFIRMO" para limpar os clientes prioritários.');
    }
    const cleared = await clientsService.clearPriorities(request.ctx!.companyId);
    return { cleared };
  });

  server.patch<{ Params: { id: string } }>("/clients/:id", { preHandler: requirePermission("clients", "update") }, async (request, reply) => {
    const input = updateClientInput.parse(request.body);
    const client = await clientsService.update(request.ctx!.companyId, request.params.id, input);
    if (!client) return reply.notFound("Cliente não encontrado.");
    return client;
  });

  server.delete<{ Params: { id: string } }>("/clients/:id", { preHandler: requirePermission("clients", "delete") }, async (request, reply) => {
    await clientsService.remove(request.ctx!.companyId, request.params.id);
    return reply.code(204).send();
  });

  server.get<{ Params: { clientId: string } }>("/clients/:clientId/equipment", { preHandler: requirePermission("clients", "read") }, (request) => equipmentRepository.list(request.ctx!.companyId, request.params.clientId));
  server.get("/clients-equipment", { preHandler: requirePermission("clients", "read") }, (request) => equipmentRepository.listAll(request.ctx!.companyId));
  server.post<{ Params: { clientId: string } }>("/clients/:clientId/equipment", { preHandler: requirePermission("clients", "create") }, async (request, reply) => reply.code(201).send(await equipmentRepository.create(request.ctx!.companyId, request.params.clientId, createEquipmentInput.parse(request.body))));
  server.patch<{ Params: { clientId: string; id: string } }>("/clients/:clientId/equipment/:id", { preHandler: requirePermission("clients", "update") }, async (request, reply) => { const equipment = await equipmentRepository.update(request.ctx!.companyId, request.params.clientId, request.params.id, updateEquipmentInput.parse(request.body)); return equipment ?? reply.notFound("Equipment not found."); });
  server.delete<{ Params: { clientId: string; id: string } }>("/clients/:clientId/equipment/:id", { preHandler: requirePermission("clients", "delete") }, async (request, reply) => { await equipmentRepository.remove(request.ctx!.companyId, request.params.clientId, request.params.id); return reply.code(204).send(); });
}
