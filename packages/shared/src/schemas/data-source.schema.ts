import { z } from "zod/v3";

export const dataSourceKindSchema = z.enum([
  "internal", "plugin", "rest_api", "sql", "csv", "excel", "webhook",
]);

export const dataSourceSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  kind: dataSourceKindSchema,
  label: z.string().min(1).max(120),
  settings: z.record(z.unknown()).default({}),
});

export const createDataSourceInput = dataSourceSchema.pick({ kind: true, label: true, settings: true });

export type CreateDataSourceInput = z.infer<typeof createDataSourceInput>;
