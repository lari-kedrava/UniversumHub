export function TableWidget({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <EmptyState />;
  const columns = Object.keys(rows[0]!).filter((key) => !key.startsWith("_"));

  return (
    <table className="w-full text-left text-xs">
      <thead className="text-slate-500">
        <tr>
          {columns.map((col) => (
            <th key={col} className="px-2 py-1 font-medium">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-surface-border text-slate-300">
            {columns.map((col) => (
              <td key={col} className="px-2 py-1">{String(row[col] ?? "")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState() {
  return <p className="text-xs text-slate-500">Sem dados para exibir.</p>;
}
