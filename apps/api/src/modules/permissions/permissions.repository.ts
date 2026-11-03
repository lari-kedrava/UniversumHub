import type { UpsertPermissionOverrideInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

export const permissionsRepository = {
  async findAllUsers(companyId: string) {
    const { data, error } = await supabaseAdmin.from("app_users").select("id, name, email, role, is_active").eq("company_id", companyId).eq("is_active", true).order("name");
    if (error) throw error;
    return data ?? [];
  },
  async inviteUser(companyId: string, input: { name: string; email: string; role: "admin" | "manager" | "member" | "viewer"; phone?: string; position?: string; department?: string; notes?: string }) {
    const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email);
    if (invited.error || !invited.data.user) throw invited.error ?? new Error("Não foi possível convidar o usuário.");
    const { data, error } = await supabaseAdmin.from("app_users").insert({ auth_user_id: invited.data.user.id, company_id: companyId, name: input.name, email: input.email, role: input.role, phone: input.phone, position: input.position, department: input.department, notes: input.notes, is_active: true }).select("id, name, email, role, phone, position, department, notes, is_active").single();
    if (error) throw error;
    return data;
  },
  async findUser(companyId: string, userId: string) {
    const { data, error } = await supabaseAdmin.from("app_users").select("id, auth_user_id, company_id, name, email, role, avatar_url, is_active, created_at").eq("company_id", companyId).eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async findOverrides(companyId: string, userId: string) {
    const { data, error } = await supabaseAdmin.from("user_permission_overrides").select("id, user_id, resource, action, granted, created_at, updated_at").eq("company_id", companyId).eq("user_id", userId).order("resource");
    if (error) throw error;
    return data;
  },
  async upsertOverride(companyId: string, userId: string, input: UpsertPermissionOverrideInput) {
    const { data, error } = await supabaseAdmin.from("user_permission_overrides").upsert({ company_id: companyId, user_id: userId, ...input }, { onConflict: "user_id,resource,action" }).select("id, user_id, resource, action, granted, created_at, updated_at").single();
    if (error) throw error;
    return data;
  },
};
