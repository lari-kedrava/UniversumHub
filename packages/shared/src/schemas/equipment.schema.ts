import { z } from "zod/v3";

export const equipmentSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  clientId: z.string().uuid(),
  equipmentType: z.string().min(2).max(120),
  systemType: z.string().max(120).optional(),
  name: z.string().max(160).optional(),
  serialNumber: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  notes: z.string().max(4000).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createEquipmentInput = equipmentSchema.pick({ equipmentType: true, systemType: true, name: true, serialNumber: true, description: true, notes: true });
export const updateEquipmentInput = createEquipmentInput.extend({ isActive: z.boolean().optional() }).partial();
export type Equipment = z.infer<typeof equipmentSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentInput>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentInput>;
