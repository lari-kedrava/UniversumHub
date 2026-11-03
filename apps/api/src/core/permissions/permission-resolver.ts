import type { Permission, PermissionAction, PermissionResource, SystemRole } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const allResources: PermissionResource[] = ["clients", "dashboards", "widgets", "data_sources", "users", "permissions", "plugins", "projects", "tasks", "calendar"];
const allActions: PermissionAction[] = ["create", "read", "update", "delete", "manage"];

function permissionsFor(resources: PermissionResource[], actions: PermissionAction[]): Permission[] {
  return resources.flatMap((resource) => actions.map((action) => ({ resource, action })));
}

export const defaultRolePermissions: Record<SystemRole, Permission[]> = {
  owner: permissionsFor(allResources, allActions),
  admin: permissionsFor(allResources, allActions),
  simple: permissionsFor(["clients", "calendar", "tasks"], ["create", "read", "update", "delete"]),
  manager: [...permissionsFor(["clients", "dashboards", "widgets", "projects", "tasks", "calendar"], ["create", "read", "update", "delete"]), ...permissionsFor(["data_sources", "plugins", "users"], ["read"])],
  member: [...permissionsFor(["clients", "dashboards", "widgets", "projects", "tasks", "calendar"], ["create", "read", "update"]), ...permissionsFor(["data_sources", "users"], ["read"])],
  viewer: [...permissionsFor(["clients", "dashboards", "widgets", "projects", "tasks", "calendar"], ["read"]), ...permissionsFor(["users"], ["read"])],
  agenda: permissionsFor(["calendar", "tasks"], ["read"]),
};

export async function canAccess(userId: string, role: SystemRole, resource: PermissionResource, action: PermissionAction): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("user_permission_overrides").select("granted").eq("user_id", userId).eq("resource", resource).eq("action", action).maybeSingle();
  if (error) throw error;
  if (data) return data.granted;
  return defaultRolePermissions[role].some((permission) => permission.resource === resource && (permission.action === action || permission.action === "manage"));
}
