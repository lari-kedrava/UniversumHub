import type { FastifyInstance } from "fastify";
import { createProjectInput, updateProjectInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js"; import { requirePermission } from "../../core/http/require-permission.js"; import { projectsService } from "./projects.service.js";
export async function projectsRoutes(server: FastifyInstance) { server.addHook("onRequest", authHook);
  server.get("/projects", { preHandler: requirePermission("projects", "read") }, (request) => projectsService.list(request.ctx!.companyId));
  server.get<{ Params: { id: string } }>("/projects/:id", { preHandler: requirePermission("projects", "read") }, async (request, reply) => { const item = await projectsService.get(request.ctx!.companyId, request.params.id); return item ?? reply.notFound("Project not found."); });
  server.post("/projects", { preHandler: requirePermission("projects", "create") }, async (request, reply) => reply.code(201).send(await projectsService.create(request.ctx!.companyId, createProjectInput.parse(request.body))));
  server.patch<{ Params: { id: string } }>("/projects/:id", { preHandler: requirePermission("projects", "update") }, async (request, reply) => { const item = await projectsService.update(request.ctx!.companyId, request.params.id, updateProjectInput.parse(request.body)); return item ?? reply.notFound("Project not found."); });
  server.delete<{ Params: { id: string } }>("/projects/:id", { preHandler: requirePermission("projects", "delete") }, async (request, reply) => { await projectsService.remove(request.ctx!.companyId, request.params.id); return reply.code(204).send(); }); }
