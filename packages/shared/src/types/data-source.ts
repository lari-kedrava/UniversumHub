/**
 * Contrato único que toda fonte de dados de um Widget deve implementar,
 * independentemente de vir do banco interno, de um plugin ou de um arquivo.
 *
 * Esta interface é o ponto central que permite que o motor de Widgets/
 * Dashboards seja completamente agnóstico de onde o dado vem — cumprindo
 * a regra de que integrações nunca fazem parte do núcleo do sistema.
 */
export type DataSourceKind =
  | "internal"      // tabelas nativas do Universum Hub
  | "plugin"        // dado exposto por um Plugin registrado
  | "rest_api"      // API REST externa genérica
  | "sql"           // conexão SQL externa
  | "csv"           // upload de arquivo CSV
  | "excel"         // upload de arquivo Excel
  | "webhook";       // dados recebidos via webhook

export interface DataSourceConfig {
  id: string;
  companyId: string;
  kind: DataSourceKind;
  label: string;
  /** Configuração específica do tipo (ex: URL da API, connection string, pluginId) */
  settings: Record<string, unknown>;
}

export interface DataSourceQueryParams {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface DataSourceResult<T = unknown> {
  rows: T[];
  total: number;
}

/** Todo provider de dados (interno ou de plugin) implementa isto. */
export interface DataSourceProvider {
  kind: DataSourceKind;
  fetch(config: DataSourceConfig, params: DataSourceQueryParams): Promise<DataSourceResult>;
}
