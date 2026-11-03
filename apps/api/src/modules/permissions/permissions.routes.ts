import type { FastifyInstance } from "fastify";
import { upsertPermissionOverrideInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js";
import { requirePermission } from "../../core/http/require-permission.js";
import { defaultRolePermissions } from "../../core/permissions/permission-resolver.js";
import { permissionsRepository } from "./permissions.repository.js";

export async function permissionsRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);
  server.get("/me", async (request) => {
    const user = await permissionsRepository.findUser(request.ctx!.companyId, request.ctx!.userId);
    return { user, permissions: defaultRolePermissions[request.ctx!.role as keyof typeof defaultRolePermissions] };
  });
  server.get("/permissions/matrix", { preHandler: requirePermission("permissions", "read") }, async () => defaultRolePermissions);
  server.get("/users", { preHandler: requirePermission("users", "read") }, (request) => permissionsRepository.findAllUsers(request.ctx!.companyId));
  server.post<{ Body: { name: string; email: string; role: "admin" | "manager" | "member" | "viewer"; phone?: string; position?: string; department?: string; notes?: string } }>("/users", { preHandler: requirePermission("users", "manage") }, async (request, reply) => {
    const body = request.body;
    if (!body?.name || !body?.email || !["admin", "manager", "member", "viewer"].includes(body.role)) return reply.badRequest("Nome, e-mail e perfil são obrigatórios.");
    return reply.code(201).send(await permissionsRepository.inviteUser(request.ctx!.companyId, body));
  });
  server.get<{ Params: { userId: string } }>("/users/:userId/permission-overrides", { preHandler: requirePermission("permissions", "read") }, async (request, reply) => {
    if (!(await permissionsRepository.findUser(request.ctx!.companyId, request.params.userId))) return reply.notFound("User not found.");
    return permissionsRepository.findOverrides(request.ctx!.companyId, request.params.userId);
  });
  server.put<{ Params: { userId: string } }>("/users/:userId/permission-overrides", { preHandler: requirePermission("permissions", "manage") }, async (request, reply) => {
    if (!(await permissionsRepository.findUser(request.ctx!.companyId, request.params.userId))) return reply.notFound("User not found.");
    return permissionsRepository.upsertOverride(request.ctx!.companyId, request.params.userId, upsertPermissionOverrideInput.parse(request.body));
  });
}
