import type { FastifyReply, FastifyRequest } from "fastify";
import { supabaseAdmin } from "../../config/supabase.js";

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.unauthorized("Token ausente.");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return reply.unauthorized("Token inválido.");
  }

  const { data: appUser, error: userError } = await supabaseAdmin
    .from("app_users")
    .select("id, company_id, role, is_active")
    .eq("auth_user_id", data.user.id)
    .single();

  if (userError || !appUser) {
    return reply.unauthorized("Usuário não vinculado a nenhuma empresa.");
  }

  if (!appUser.is_active) {
    return reply.forbidden("User is disabled.");
  }

  request.ctx = {
    userId: appUser.id,
    companyId: appUser.company_id,
    role: appUser.role,
  };
}
