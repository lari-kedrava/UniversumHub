/**
 * Repository do módulo Fontes de Dados. Persiste as configurações que
 * os widgets referenciam (`data_source_id`) para saber de onde buscar
 * seus dados.
 */
import type { CreateDataSourceInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const TABLE = "data_sources";

export const dataSourcesRepository = {
  async findAll(companyId: string) {
    const { data, error } = await supabaseAdmin.from(TABLE).select("*").eq("company_id", companyId);
    if (error) throw error;
    return data ?? [];
  },

  async findById(companyId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(companyId: string, input: CreateDataSourceInput) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({ ...input, company_id: companyId })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async delete(companyId: string, id: string) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("company_id", companyId).eq("id", id);
    if (error) throw error;
  },
  async update(companyId: string, id: string, input: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin.from(TABLE).update({ ...input, updated_at: new Date().toISOString() }).eq("company_id", companyId).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return data;
  },
};
