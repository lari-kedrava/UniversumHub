import type { FastifyInstance } from "fastify";
import { createTaskInput, updateTaskInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js"; import { requirePermission } from "../../core/http/require-permission.js"; import { tasksService } from "./tasks.service.js";
type TasksQuery = {
  type?: string;
  start?: string;
  end?: string;
  types?: string;
  statuses?: string;
  assigneeStaffIds?: string;
  scopes?: string;
  clientIds?: string;
  priorities?: string;
};

const list = (value?: string) => value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

export async function tasksRoutes(server: FastifyInstance) { server.addHook("onRequest", authHook);
  server.get<{ Querystring: TasksQuery }>("/tasks", { preHandler: requirePermission("tasks", "read") }, (request, reply) => {
    const { start, end } = request.query;
    if ((start && Number.isNaN(Date.parse(start))) || (end && Number.isNaN(Date.parse(end)))) {
      return reply.badRequest("Os filtros de data são inválidos.");
    }
    return tasksService.list(request.ctx!.companyId, {
      types: list(request.query.types ?? request.query.type),
      statuses: list(request.query.statuses),
      assigneeStaffIds: list(request.query.assigneeStaffIds),
      scopes: list(request.query.scopes),
      clientIds: list(request.query.clientIds),
      priorities: list(request.query.priorities),
      start,
      end,
    });
  });
  server.get<{ Params: { id: string } }>("/tasks/:id", { preHandler: requirePermission("tasks", "read") }, async (request, reply) => (await tasksService.get(request.ctx!.companyId, request.params.id)) ?? reply.notFound("Task not found."));
  server.get<{ Params: { id: string } }>("/tasks/:id/execution-history", { preHandler: requirePermission("tasks", "read") }, (request) => tasksService.history(request.ctx!.companyId, request.params.id));
  server.post("/tasks", { preHandler: requirePermission("tasks", "create") }, async (request, reply) => { try { return reply.code(201).send(await tasksService.create(request.ctx!.companyId, request.ctx!.userId, createTaskInput.parse(request.body))); } catch (error) { return reply.badRequest((error as Error).message); } });
  server.patch<{ Params: { id: string } }>("/tasks/:id", { preHandler: requirePermission("tasks", "update") }, async (request, reply) => (await tasksService.update(request.ctx!.companyId, request.params.id, updateTaskInput.parse(request.body))) ?? reply.notFound("Task not found."));
  for (const action of ["check-in", "pause", "resume", "check-out"] as const) server.post<{ Params: { id: string }; Body: { note?: string } }>(`/tasks/:id/${action}`, { preHandler: requirePermission("tasks", "update") }, async (request, reply) => { try { const result = await tasksService.execute(request.ctx!.companyId, request.params.id, request.ctx!.userId, action === "check-in" ? "check_in" : action === "check-out" ? "check_out" : action, request.body?.note); return result ?? reply.notFound("Task not found."); } catch (error) { return reply.badRequest((error as Error).message); } });
  server.delete<{ Params: { id: string } }>("/tasks/:id", { preHandler: requirePermission("tasks", "delete") }, async (request, reply) => { await tasksService.remove(request.ctx!.companyId, request.params.id); return reply.code(204).send(); }); }
