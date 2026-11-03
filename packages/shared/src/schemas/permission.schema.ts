import { z } from "zod";

export const permissionResources = ["clients", "dashboards", "widgets", "data_sources", "users", "permissions", "plugins", "projects", "tasks", "calendar"] as const;
export const permissionActions = ["create", "read", "update", "delete", "manage"] as const;

export const upsertPermissionOverrideInput = z.object({
  resource: z.enum(permissionResources),
  action: z.enum(permissionActions),
  granted: z.boolean(),
});

export type UpsertPermissionOverrideInput = z.infer<typeof upsertPermissionOverrideInput>;
