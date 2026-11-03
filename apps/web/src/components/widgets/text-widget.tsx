export function TextWidget({ content }: { content: string }) {
  return <p className="whitespace-pre-wrap text-sm text-slate-300">{content}</p>;
}
