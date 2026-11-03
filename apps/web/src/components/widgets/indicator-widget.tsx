export function IndicatorWidget({ rows, label }: { rows: Record<string, unknown>[]; label?: string }) {
  const value = rows.length;
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <span className="text-3xl font-semibold text-white">{value}</span>
      <span className="mt-1 text-xs text-slate-500">{label ?? "registros"}</span>
    </div>
  );
}
