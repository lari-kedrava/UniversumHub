/**
 * Repository do módulo Clientes.
 *
 * Responsabilidade única: falar com a persistência (Supabase/Postgres)
 * e nada mais. Nenhuma regra de negócio deve existir aqui — apenas
 * tradução entre linhas do banco e o tipo `Client`.
 *
 * Toda query filtra explicitamente por `companyId`: mesmo que o RLS
 * falhe por algum motivo, este filtro é a segunda barreira de
 * isolamento multiempresa.
 */
import type { Client, CreateClientInput, UpdateClientInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

function toClient(row: Record<string, unknown>): Client {
  const companyName = (row.legal_name ?? row.company_name ?? row.nome_empresa) as string | undefined;
  const displayName = (row.name ?? row.nome ?? companyName) as string;
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: displayName,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    document: (row.document as string) ?? undefined,
    legalName: companyName,
    status: (row.status as "active" | "inactive") ?? (row.is_active ? "active" : "inactive"),
    addressLine: (row.address_line as string) ?? undefined,
    addressNumber: (row.address_number as string) ?? undefined,
    addressComplement: (row.address_complement as string) ?? undefined,
    neighborhood: (row.neighborhood as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    postalCode: (row.postal_code as string) ?? undefined,
    contactName: (row.contact_name as string) ?? undefined,
    whatsapp: (row.whatsapp as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    isActive: row.is_active as boolean,
    priorityLevel: (row.priority_level as Client["priorityLevel"]) ?? "normal",
    priorityNotes: (row.priority_notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function createClientsRepository(table: "clients" | "clientes") {
  return {
  async findAll(companyId: string): Promise<Client[]> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toClient);
  },

  async findById(companyId: string, id: string): Promise<Client | null> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toClient(data) : null;
  },

  async create(companyId: string, input: CreateClientInput): Promise<Client> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        document: input.document,
        notes: input.notes,
        legal_name: input.legalName,
        status: input.status ?? "active",
        is_active: input.status !== "inactive",
        address_line: input.addressLine,
        address_number: input.addressNumber,
        address_complement: input.addressComplement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        contact_name: input.contactName,
        whatsapp: input.whatsapp,
        priority_level: input.priorityLevel ?? "normal",
        priority_notes: input.priorityNotes,
        company_id: companyId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toClient(data);
  },

  async update(companyId: string, id: string, input: UpdateClientInput): Promise<Client | null> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        name: input.name,
        email: input.email,
        phone: input.phone,
        document: input.document,
        notes: input.notes,
        legal_name: input.legalName,
        status: input.status,
        ...(input.status ? { is_active: input.status !== "inactive" } : {}),
        address_line: input.addressLine,
        address_number: input.addressNumber,
        address_complement: input.addressComplement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        contact_name: input.contactName,
        whatsapp: input.whatsapp,
        priority_level: input.priorityLevel,
        priority_notes: input.priorityNotes,
      })
      .eq("company_id", companyId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toClient(data) : null;
  },

  async delete(companyId: string, id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("company_id", companyId)
      .eq("id", id);

    if (error) throw error;
  },

  async clearPriorities(companyId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ priority_level: "normal", priority_notes: null })
      .eq("company_id", companyId)
      .neq("priority_level", "normal")
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  },
  };
}

export const clientsRepository = createClientsRepository("clients");
export const alertClientsRepository = createClientsRepository("clientes");
