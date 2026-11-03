/**
 * Modal simples de criação de widget. Nesta etapa cobre os tipos que
 * já possuem renderer implementado; ao adicionar um novo tipo em
 * `WidgetRenderer`, basta incluí-lo em `WIDGET_TYPES` abaixo.
 */
import { useState } from "react";
import type { WidgetType } from "@universum/shared";

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "indicator", label: "Indicador" },
  { value: "table", label: "Tabela" },
  { value: "cards", label: "Cards" },
  { value: "chart", label: "Gráfico" },
  { value: "text", label: "Texto" },
  { value: "clock", label: "Relógio" },
  { value: "iframe", label: "Iframe" },
];

interface AddWidgetDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { type: WidgetType; title: string; settings?: Record<string, unknown> }) => void;
}

export function AddWidgetDialog({ open, onClose, onCreate }: AddWidgetDialogProps) {
  const [type, setType] = useState<WidgetType>("indicator");
  const [title, setTitle] = useState("");
  const [variant, setVariant] = useState("bar");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-raised p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Adicionar widget</h2>

        <label className="mb-1 block text-sm text-slate-300">Título</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          placeholder="Ex: Total de clientes"
        />

        <label className="mb-1 block text-sm text-slate-300">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as WidgetType)}
          className="mb-6 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        >
          {WIDGET_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {type === "chart" && <><label className="mb-1 block text-sm text-slate-300">Visualização</label><select value={variant} onChange={(e) => setVariant(e.target.value)} className="mb-6 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"><option value="bar">Barras</option><option value="line">Linhas</option><option value="pie">Pizza</option><option value="cards">Quadrados</option></select></>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onCreate({ type, title: title.trim(), settings: type === "chart" ? { variant } : undefined });
              setTitle("");
              onClose();
            }}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
