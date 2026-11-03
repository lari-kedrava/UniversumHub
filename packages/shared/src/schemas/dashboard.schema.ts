import { z } from "zod/v3";

export const dashboardSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1).max(120),
  ownerId: z.string().uuid(),
  isShared: z.boolean().default(false),
  isPresentationMode: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createDashboardInput = dashboardSchema.pick({ name: true, isShared: true });
export const updateDashboardInput = createDashboardInput.partial();

export type CreateDashboardInput = z.infer<typeof createDashboardInput>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardInput>;
