/**
 * Repository do módulo Dashboards. Segue o mesmo padrão do módulo
 * Clientes: sem regra de negócio, apenas tradução de/para o banco.
 */
import type { CreateDashboardInput, UpdateDashboardInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const TABLE = "dashboards";

function toDashboard(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    isShared: row.is_shared as boolean,
    isPresentationMode: row.is_presentation_mode as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const dashboardsRepository = {
  async findAll(companyId: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toDashboard);
  },

  async findById(companyId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDashboard(data) : null;
  },

  async create(companyId: string, ownerId: string, input: CreateDashboardInput) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({ ...input, company_id: companyId, owner_id: ownerId })
      .select("*")
      .single();
    if (error) throw error;
    return toDashboard(data);
  },

  async update(companyId: string, id: string, input: UpdateDashboardInput) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(input)
      .eq("company_id", companyId)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toDashboard(data) : null;
  },

  async delete(companyId: string, id: string) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("company_id", companyId).eq("id", id);
    if (error) throw error;
  },
};
