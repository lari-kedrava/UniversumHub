import type { FastifyInstance } from "fastify";
import { z } from "zod/v3";
import { authHook } from "../../core/http/auth-hook.js";
import { supabaseAdmin } from "../../config/supabase.js";

const createUser = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "simple"]),
});

export async function usersRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get("/master/users", async (request, reply) => {
    if (!["owner", "admin"].includes(request.ctx!.role)) return reply.forbidden("Somente administradores podem gerenciar usuários.");
    const { data, error } = await supabaseAdmin.from("app_users").select("id, name, email, role, is_active, created_at").eq("company_id", request.ctx!.companyId).order("created_at");
    if (error) throw error;
    return data;
  });

  server.post("/master/users", async (request, reply) => {
    if (!["owner", "admin"].includes(request.ctx!.role)) return reply.forbidden("Somente administradores podem criar usuários.");
    const input = createUser.parse(request.body);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: input.email.toLowerCase(), password: input.password, email_confirm: true });
    if (authError || !authData.user) return reply.badRequest(authError?.message ?? "Não foi possível criar o login.");
    const { data, error } = await supabaseAdmin.from("app_users").insert({ auth_user_id: authData.user.id, company_id: request.ctx!.companyId, name: input.name, email: input.email.toLowerCase(), role: input.role }).select("id, name, email, role, is_active, created_at").single();
    if (error) { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); throw error; }
    return reply.code(201).send(data);
  });
}
