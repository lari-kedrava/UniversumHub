/**
 * Papéis padrão do sistema. Empresas podem estender com papéis
 * customizados através do módulo de Permissões (fora do escopo deste tipo).
 */
export type SystemRole = "owner" | "admin" | "simple" | "manager" | "member" | "viewer" | "agenda";

/**
 * Usuário autenticado, sempre vinculado a uma empresa.
 * O `authUserId` referencia o usuário no Supabase Auth (auth.users.id).
 */
export interface AppUser {
  id: string;
  authUserId: string;
  companyId: string;
  name: string;
  email: string;
  role: SystemRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}
