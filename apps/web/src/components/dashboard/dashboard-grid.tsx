/**
 * Grid arrastável/redimensionável dos widgets de um dashboard.
 * Usa react-grid-layout apenas como motor de posicionamento — todo o
 * conteúdo visual de cada célula é delegado ao `WidgetRenderer`.
 */
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import type { Widget } from "@universum/shared";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  widgets: Widget[];
  onLayoutChange: (widgetId: string, layout: Widget["layout"]) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function DashboardGrid({ widgets, onLayoutChange, onRemoveWidget }: DashboardGridProps) {
  const layout: Layout[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    minW: 2,
    minH: 2,
  }));

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1024, md: 768, sm: 480 }}
      cols={{ lg: 12, md: 8, sm: 4 }}
      rowHeight={64}
      draggableHandle=".drag-handle"
      onDragStop={(_layout, _old, item) => emitChange(item)}
      onResizeStop={(_layout, _old, item) => emitChange(item)}
    >
      {widgets.map((widget) => (
        <div key={widget.id}>
          <WidgetRenderer widget={widget} onRemove={() => onRemoveWidget(widget.id)} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );

  function emitChange(item: Layout) {
    onLayoutChange(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
  }
}
