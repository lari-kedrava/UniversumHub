import type { PermissionAction, PermissionResource, SystemRole } from "@universum/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { canAccess } from "../permissions/permission-resolver.js";

export function requirePermission(resource: PermissionResource, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.ctx;
    if (!ctx) return reply.unauthorized();
    if (!(await canAccess(ctx.userId, ctx.role as SystemRole, resource, action))) return reply.forbidden("Permission denied.");
  };
}
