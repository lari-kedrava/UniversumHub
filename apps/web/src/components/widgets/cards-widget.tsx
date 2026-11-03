export function CardsWidget({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-xs text-slate-500">Sem dados para exibir.</p>;

  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.slice(0, 6).map((row, i) => {
        const entries = Object.entries(row).filter(([key]) => !key.startsWith("_"));
        const [primaryKey, primaryValue] = entries[0] ?? ["", ""];
        return (
          <div key={i} className="rounded-lg border border-surface-border p-2">
            <p className="truncate text-sm font-medium text-white">{String(primaryValue)}</p>
            <p className="truncate text-xs text-slate-500">{String(primaryKey)}</p>
          </div>
        );
      })}
    </div>
  );
}
