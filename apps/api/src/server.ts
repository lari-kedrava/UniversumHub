import Fastify from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { env } from "./config/env.js";
import { clientsRoutes } from "./modules/clients/clients.routes.js";
import { dashboardsRoutes } from "./modules/dashboards/dashboards.routes.js";
import { widgetsRoutes } from "./modules/widgets/widgets.routes.js";
import { dataSourcesRoutes } from "./modules/data-sources/data-sources.routes.js";
import { permissionsRoutes } from "./modules/permissions/permissions.routes.js";
import { projectsRoutes } from "./modules/projects/projects.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { calendarRoutes } from "./modules/calendar/calendar.routes.js";
import { staffRoutes } from "./modules/staff/staff.routes.js";
import { customizationsRoutes } from "./modules/customizations/customizations.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { topClientsRoutes } from "./modules/top-clients/top-clients.routes.js";
import { registerPlugins } from "./plugins/index.js";

export async function buildServer() {
  const server = Fastify({
    logger: { redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"] },
    bodyLimit: 1_048_576,
    requestTimeout: 30_000,
  });

  await server.register(helmet);
  await server.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  await server.register(cors, {
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: (origin, callback) => callback(null, !origin || env.allowedOrigins.includes(origin)),
  });
  await server.register(sensible);

  server.get("/health", async () => ({ status: "ok" }));

  await server.register(clientsRoutes, { prefix: "/api" });
  await server.register(dashboardsRoutes, { prefix: "/api" });
  await server.register(widgetsRoutes, { prefix: "/api" });
  await server.register(dataSourcesRoutes, { prefix: "/api" });
  await server.register(permissionsRoutes, { prefix: "/api" });
  await server.register(projectsRoutes, { prefix: "/api" });
  await server.register(tasksRoutes, { prefix: "/api" });
  await server.register(calendarRoutes, { prefix: "/api" });
  await server.register(staffRoutes, { prefix: "/api" });
  await server.register(customizationsRoutes, { prefix: "/api" });
  await server.register(usersRoutes, { prefix: "/api" });
  await server.register(topClientsRoutes, { prefix: "/api" });

  registerPlugins();

  return server;
}

const server = await buildServer();

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await server.ready();
  server.server.emit("request", request, response);
}

export async function startServer() {
  await server.listen({ port: env.port, host: "0.0.0.0" });
}
