export function IframeWidget({ url }: { url?: string }) {
  if (!url) return <p className="text-xs text-slate-500">Configure a URL do iframe.</p>;
  return <iframe src={url} className="h-full w-full rounded-lg border-0" title="widget-iframe" />;
}
