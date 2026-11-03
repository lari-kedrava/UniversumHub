import { z } from "zod/v3";

/**
 * Schema do módulo "Clientes" — usado como módulo de referência para
 * os demais módulos de negócio seguirem o mesmo padrão
 * (validação -> service -> repository).
 */
export const clientSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2).max(160),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
  legalName: z.string().max(200).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  addressLine: z.string().max(240).optional(),
  addressNumber: z.string().max(30).optional(),
  addressComplement: z.string().max(120).optional(),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
  postalCode: z.string().max(20).optional(),
  contactName: z.string().max(160).optional(),
  whatsapp: z.string().max(40).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  priorityLevel: z.enum(["normal", "high", "urgent"]).default("normal"),
  priorityNotes: z.string().max(1000).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createClientInput = clientSchema.pick({
  name: true,
  email: true,
  phone: true,
  document: true,
  legalName: true,
  status: true,
  addressLine: true,
  addressNumber: true,
  addressComplement: true,
  neighborhood: true,
  city: true,
  state: true,
  postalCode: true,
  contactName: true,
  whatsapp: true,
  notes: true,
  priorityLevel: true,
  priorityNotes: true,
}).partial({ priorityLevel: true });

export const updateClientInput = createClientInput.partial();

export type Client = z.infer<typeof clientSchema>;
export type CreateClientInput = z.infer<typeof createClientInput>;
export type UpdateClientInput = z.infer<typeof updateClientInput>;
