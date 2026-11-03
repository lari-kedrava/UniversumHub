import type { CreateEquipmentInput, Equipment, UpdateEquipmentInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const toEquipment = (row: Record<string, unknown>): Equipment => ({
  id: row.id as string, companyId: row.company_id as string, clientId: row.client_id as string,
  equipmentType: row.equipment_type as string, systemType: (row.system_type as string) ?? undefined,
  name: (row.name as string) ?? undefined, serialNumber: (row.serial_number as string) ?? undefined,
  description: (row.description as string) ?? undefined, notes: (row.notes as string) ?? undefined,
  isActive: row.is_active as boolean, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
});
const toDb = (input: CreateEquipmentInput | UpdateEquipmentInput) => ({ equipment_type: input.equipmentType, system_type: input.systemType, name: input.name, serial_number: input.serialNumber, description: input.description, notes: input.notes, ...(("isActive" in input && input.isActive !== undefined) ? { is_active: input.isActive } : {}) });

export const equipmentRepository = {
  async listAll(companyId: string) { const { data, error } = await supabaseAdmin.from("client_equipments").select("*").eq("company_id", companyId).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []).map(toEquipment); },
  async list(companyId: string, clientId: string) { const { data, error } = await supabaseAdmin.from("client_equipments").select("*").eq("company_id", companyId).eq("client_id", clientId).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []).map(toEquipment); },
  async create(companyId: string, clientId: string, input: CreateEquipmentInput) { const { data, error } = await supabaseAdmin.from("client_equipments").insert({ ...toDb(input), company_id: companyId, client_id: clientId }).select("*").single(); if (error) throw error; return toEquipment(data); },
  async update(companyId: string, clientId: string, id: string, input: UpdateEquipmentInput) { const { data, error } = await supabaseAdmin.from("client_equipments").update(toDb(input)).eq("company_id", companyId).eq("client_id", clientId).eq("id", id).select("*").maybeSingle(); if (error) throw error; return data ? toEquipment(data) : null; },
  async remove(companyId: string, clientId: string, id: string) { const { error } = await supabaseAdmin.from("client_equipments").delete().eq("company_id", companyId).eq("client_id", clientId).eq("id", id); if (error) throw error; },
};
