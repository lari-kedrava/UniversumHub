/**
 * Moldura visual comum a todo widget (título + ações). O conteúdo real
 * é decidido pelo `WidgetRenderer`, que escolhe o componente certo
 * conforme `widget.type`.
 */
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface WidgetFrameProps {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}

export function WidgetFrame({ title, onRemove, children }: WidgetFrameProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
      <div className="drag-handle flex cursor-move items-center justify-between border-b border-surface-border px-3 py-2">
        <span className="truncate text-sm font-medium text-slate-200">{title}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"
            aria-label="Remover widget"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}
