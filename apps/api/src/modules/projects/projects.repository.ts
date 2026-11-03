import type { CreateProjectInput, Project, UpdateProjectInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";
const toProject = (row: Record<string, unknown>): Project => ({ id: row.id as string, companyId: row.company_id as string, name: row.name as string, description: row.description as string | null, status: row.status as Project["status"], color: row.color as string, ownerId: row.owner_id as string | null, startsAt: row.starts_at as string | null, dueAt: row.due_at as string | null, createdAt: row.created_at as string, updatedAt: row.updated_at as string });
const db = (input: CreateProjectInput | UpdateProjectInput) => ({ name: input.name, description: input.description, status: input.status, color: input.color, owner_id: input.ownerId, starts_at: input.startsAt, due_at: input.dueAt });
export const projectsRepository = {
  async findAll(companyId: string) { const { data, error } = await supabaseAdmin.from("projects").select("*").eq("company_id", companyId).order("created_at", { ascending: false }); if (error) throw error; return (data ?? []).map(toProject); },
  async findById(companyId: string, id: string) { const { data, error } = await supabaseAdmin.from("projects").select("*").eq("company_id", companyId).eq("id", id).maybeSingle(); if (error) throw error; return data ? toProject(data) : null; },
  async create(companyId: string, input: CreateProjectInput) { const { data, error } = await supabaseAdmin.from("projects").insert({ ...db(input), company_id: companyId, status: input.status ?? "planned", color: input.color ?? "#6366f1" }).select("*").single(); if (error) throw error; return toProject(data); },
  async update(companyId: string, id: string, input: UpdateProjectInput) { const { data, error } = await supabaseAdmin.from("projects").update(db(input)).eq("company_id", companyId).eq("id", id).select("*").maybeSingle(); if (error) throw error; return data ? toProject(data) : null; },
  async delete(companyId: string, id: string) { const { error } = await supabaseAdmin.from("projects").delete().eq("company_id", companyId).eq("id", id); if (error) throw error; },
};
