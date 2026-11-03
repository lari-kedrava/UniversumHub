/**
 * Ponto único de renderização de widgets. Recebe um `Widget` (metadados
 * + settings) e decide qual componente visual usar, buscando os dados
 * via `useWidgetData` quando o widget depende de uma fonte de dados.
 *
 * Adicionar um novo tipo de widget = adicionar um `case` aqui e o
 * componente correspondente nesta mesma pasta — nenhuma outra parte
 * do sistema precisa mudar.
 */
import type { Widget } from "@universum/shared";
import { useWidgetData } from "@/hooks/use-dashboards";
import { WidgetFrame } from "./widget-frame";
import { TableWidget } from "./table-widget";
import { IndicatorWidget } from "./indicator-widget";
import { CardsWidget } from "./cards-widget";
import { TextWidget } from "./text-widget";
import { ClockWidget } from "./clock-widget";
import { IframeWidget } from "./iframe-widget";
import { ChartWidget } from "./chart-widget";

interface WidgetRendererProps {
  widget: Widget;
  onRemove?: () => void;
}

const DATA_DRIVEN_TYPES = new Set(["table", "cards", "indicator", "ranking", "list"]);

export function WidgetRenderer({ widget, onRemove }: WidgetRendererProps) {
  const needsData = DATA_DRIVEN_TYPES.has(widget.type);
  const { data } = useWidgetData(needsData ? widget.id : "");
  const rows = (data?.rows as Record<string, unknown>[]) ?? [];

  return (
    <WidgetFrame title={widget.title} onRemove={onRemove}>
      {renderBody(widget, rows)}
    </WidgetFrame>
  );
}

function renderBody(widget: Widget, rows: Record<string, unknown>[]) {
  switch (widget.type) {
    case "table":
      return <TableWidget rows={rows} />;
    case "cards":
      return <CardsWidget rows={rows} />;
    case "chart":
      return <ChartWidget variant={(widget.settings.variant as string) ?? "bar"} />;
    case "indicator":
      return <IndicatorWidget rows={rows} label={widget.settings.label as string | undefined} />;
    case "text":
      return <TextWidget content={(widget.settings.content as string) ?? ""} />;
    case "clock":
      return <ClockWidget />;
    case "iframe":
    case "html":
      return <IframeWidget url={widget.settings.url as string | undefined} />;
    default:
      return (
        <p className="text-xs text-slate-500">
          Renderer para o tipo "{widget.type}" ainda não implementado.
        </p>
      );
  }
}
