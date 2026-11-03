import type { FastifyInstance } from "fastify";
import { createCalendarEventInput, updateCalendarEventInput } from "@universum/shared";
import { authHook } from "../../core/http/auth-hook.js"; import { requirePermission } from "../../core/http/require-permission.js"; import { calendarService } from "./calendar.service.js";
export async function calendarRoutes(server: FastifyInstance) { server.addHook("onRequest", authHook);
  server.get<{ Querystring: { from?: string; to?: string } }>("/calendar-events", { preHandler: requirePermission("calendar", "read") }, (request) => calendarService.list(request.ctx!.companyId, request.query.from, request.query.to));
  server.get<{ Params: { id: string } }>("/calendar-events/:id", { preHandler: requirePermission("calendar", "read") }, async (request, reply) => (await calendarService.get(request.ctx!.companyId, request.params.id)) ?? reply.notFound("Event not found."));
  server.post("/calendar-events", { preHandler: requirePermission("calendar", "create") }, async (request, reply) => reply.code(201).send(await calendarService.create(request.ctx!.companyId, request.ctx!.userId, createCalendarEventInput.parse(request.body))));
  server.patch<{ Params: { id: string } }>("/calendar-events/:id", { preHandler: requirePermission("calendar", "update") }, async (request, reply) => (await calendarService.update(request.ctx!.companyId, request.params.id, updateCalendarEventInput.parse(request.body))) ?? reply.notFound("Event not found."));
  server.delete<{ Params: { id: string } }>("/calendar-events/:id", { preHandler: requirePermission("calendar", "delete") }, async (request, reply) => { await calendarService.remove(request.ctx!.companyId, request.params.id); return reply.code(204).send(); }); }
