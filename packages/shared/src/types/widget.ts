/**
 * Tipos de widget suportados nativamente. Novos tipos devem ser
 * adicionados aqui e ter um renderer correspondente no frontend
 * (apps/web/src/components/widgets), sem exigir mudanças no motor
 * de dashboards.
 */
export type WidgetType =
  | "table"
  | "cards"
  | "text"
  | "image"
  | "video"
  | "agenda"
  | "calendar"
  | "indicator"
  | "chart"
  | "map"
  | "list"
  | "ranking"
  | "notice"
  | "clock"
  | "html"
  | "iframe"
  | "rss";

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  dashboardId: string;
  type: WidgetType;
  title: string;
  dataSourceId?: string;
  /** Configuração específica de renderização do widget (cores, colunas, etc.) */
  settings: Record<string, unknown>;
  layout: WidgetLayout;
}

export interface Dashboard {
  id: string;
  companyId: string;
  name: string;
  ownerId: string;
  isShared: boolean;
  isPresentationMode: boolean;
  createdAt: string;
  updatedAt: string;
}
