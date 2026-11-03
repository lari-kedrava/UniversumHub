export function ChartWidget({ variant }: { variant: string }) {
  const values = [42, 68, 51, 82, 60, 74];
  if (variant === "pie") return <div className="mx-auto h-32 w-32 rounded-full" style={{ background: "conic-gradient(#3b82f6 0 35%, #8b5cf6 35% 65%, #10b981 65% 85%, #f59e0b 85% 100%)" }} />;
  if (variant === "cards") return <div className="grid grid-cols-3 gap-2">{values.slice(0, 6).map((value, index) => <div key={index} className="rounded-lg bg-brand-500/15 p-3 text-center text-lg font-semibold text-white">{value}</div>)}</div>;
  return <div className={`flex h-32 items-end gap-2 ${variant === "line" ? "border-b border-l border-surface-border px-2" : ""}`}>{values.map((value, index) => <div key={index} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${value}%` }} title={`${value}`} />)}</div>;
}
