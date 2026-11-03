/**
 * Representa uma empresa (tenant) dentro do Universum Hub.
 *
 * Toda entidade de negócio do sistema é vinculada a uma `companyId`.
 * O isolamento entre empresas é garantido em duas camadas:
 *  1. Row Level Security no Supabase (defesa primária)
 *  2. Filtros explícitos nos Repositories (defesa em profundidade)
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
}
