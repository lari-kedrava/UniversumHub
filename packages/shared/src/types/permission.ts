/**
 * Modelo de permissões granulares (RBAC simples + overrides pontuais).
 * `resource` identifica o módulo (ex: "clients", "dashboards", "plugins")
 * e `action` a operação permitida sobre ele.
 */
export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";
export type PermissionResource = "clients" | "dashboards" | "widgets" | "data_sources" | "users" | "permissions" | "plugins" | "projects" | "tasks" | "calendar";

export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

export interface RolePermissions {
  role: "owner" | "admin" | "simple" | "manager" | "member" | "viewer" | "agenda";
  permissions: Permission[];
}

export interface UserPermissionOverride extends Permission {
  id: string;
  userId: string;
  granted: boolean;
  createdAt: string;
  updatedAt: string;
}
