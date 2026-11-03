import { z } from "zod/v3";

export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  planId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createCompanyInput = companySchema.pick({ name: true, slug: true, planId: true });

export type CreateCompanyInput = z.infer<typeof createCompanyInput>;
