/**
 * Provider de dados "internal" — expõe tabelas nativas do Universum Hub
 * (ex: clients) como fonte de dados para widgets, sem precisar de
 * nenhuma integração externa.
 *
 * O nome da tabela interna fica em `settings.table` (allowlist abaixo,
 * por segurança — nunca aceitar nome de tabela arbitrário do cliente).
 */
import type { DataSourceConfig, DataSourceProvider, DataSourceQueryParams, DataSourceResult } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const ALLOWED_TABLES = new Set(["clients"]);

export const internalProvider: DataSourceProvider = {
  kind: "internal",

  async fetch(config: DataSourceConfig, params: DataSourceQueryParams): Promise<DataSourceResult> {
    const table = config.settings.table as string | undefined;
    if (!table || !ALLOWED_TABLES.has(table)) {
      throw new Error(`Tabela interna não permitida como fonte de dados: ${table}`);
    }

    const query = supabaseAdmin
      .from(table)
      .select("*", { count: "exact" })
      .eq("company_id", config.companyId)
      .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { rows: data ?? [], total: count ?? 0 };
  },
};
