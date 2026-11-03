import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Trophy, X } from "lucide-react";
import { api } from "@/lib/api";

export type TopClientItem = { id?: string | number; name: string; attendanceCount: number; position?: number };
export type TopClientsData = { priorities: TopClientItem[]; recurring: TopClientItem[] };

const copy = (data?: TopClientsData): TopClientsData => ({
  priorities: (data?.priorities ?? []).map((item) => ({ ...item })),
  recurring: (data?.recurring ?? []).map((item) => ({ ...item })),
});

function Editor({ title, items, recurring, onChange }: { title: string; items: TopClientItem[]; recurring?: boolean; onChange: (items: TopClientItem[]) => void }) {
  const update = (index: number, patch: Partial<TopClientItem>) => onChange?.(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const currentItem = next[index]!;
    next[index] = next[target]!;
    next[target] = currentItem;
    onChange?.(next);
  };
  return <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold text-white">{title}</h2><p className="text-xs text-slate-400">{recurring ? "Sincronizado com top10_clientes" : "Sincronizado com top_prioridades"}</p></div>
      <button type="button" disabled={recurring && items.length >= 10} onClick={() => onChange([...items, { name: "", attendanceCount: 0 }])} className="flex items-center gap-2 rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-300 disabled:opacity-40"><Plus className="h-4 w-4" />Incluir</button>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => <div key={`${item.id ?? "new"}-${index}`} className="grid grid-cols-[42px_1fr_auto] items-center gap-2 rounded-xl border border-surface-border bg-surface p-3">
        <strong className={`${index < 3 && recurring ? "text-amber-300" : "text-sky-300"}`}>{index + 1}º</strong>
        <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
          <input aria-label={`Nome do cliente ${index + 1}`} value={item.name} onChange={(event) => update(index, { name: event.target.value })} placeholder="Nome do cliente" className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-white" />
          {recurring && <input aria-label="Quantidade de atendimentos" type="number" min={0} value={item.attendanceCount} onChange={(event) => update(index, { attendanceCount: Math.max(0, Number(event.target.value)) })} className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-white" />}
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="Mover para cima" onClick={() => move(index, -1)} disabled={!index} className="rounded p-1.5 text-slate-300 disabled:opacity-20"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" aria-label="Mover para baixo" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded p-1.5 text-slate-300 disabled:opacity-20"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" aria-label="Excluir cliente" onClick={() => onChange?.(items.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-1.5 text-red-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>)}
      {!items.length && <p className="rounded-xl border border-dashed border-surface-border p-6 text-center text-sm text-slate-400">Nenhum cliente incluído.</p>}
    </div>
  </section>;
}

export function TopClientsPage() {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["top-clients"], queryFn: () => api.get<TopClientsData>("/api/top-clients"), refetchInterval: 5_000 });
  const [draft, setDraft] = useState<TopClientsData>(copy());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (query.data && !dirty) setDraft(copy(query.data)); }, [query.data, dirty]);
  const save = useMutation({
    mutationFn: (data: TopClientsData) => api.put("/api/top-clients", {
      priorities: data.priorities.filter((item) => item.name.trim()).map(({ name, attendanceCount }) => ({ name, attendanceCount })),
      recurring: data.recurring.filter((item) => item.name.trim()).slice(0, 10).map(({ name, attendanceCount }) => ({ name, attendanceCount })),
    }),
    onSuccess: async () => { setDirty(false); setMessageType("success"); setMessage("Alterações salvas e sincronizadas com todos os usuários."); await cache.invalidateQueries({ queryKey: ["top-clients"] }); },
    onError: (error) => { setMessageType("error"); setMessage(error instanceof Error ? `Erro ao salvar: ${error.message}` : "Erro ao salvar as alterações."); },
  });
  const change = (patch: Partial<TopClientsData>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setMessage("");
  };
  const saveChanges = () => {
    if ([...draft.priorities, ...draft.recurring].some((item) => !item.name.trim())) {
      setMessageType("error");
      setMessage("Preencha o nome de todos os clientes antes de salvar.");
      return;
    }
    setMessageType("info");
    setMessage("Salvando alterações...");
    save.mutate(copy(draft));
  };
  const cancelChanges = () => {
    setDraft(copy(query.data));
    setDirty(false);
    setMessageType("success");
    setMessage("Alterações canceladas. Os dados salvos foram restaurados.");
  };
  const messageColor = messageType === "success" ? "text-emerald-300" : messageType === "error" ? "text-red-300" : "text-slate-300";
  return <div className="space-y-6 pt-20">
    <div className="fixed inset-x-0 top-16 z-40 flex min-h-16 flex-wrap items-center justify-end gap-3 border-b border-surface-border bg-surface-raised/95 p-4 shadow-lg backdrop-blur md:left-60">
      {message && <span role={messageType === "error" ? "alert" : "status"} className={`mr-auto text-sm font-medium ${messageColor}`}>{message}</span>}
      <button type="button" disabled={!dirty || save.isPending} onClick={cancelChanges} className="flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-40"><X className="h-4 w-4" />Cancelar</button>
      <button type="button" disabled={!dirty || save.isPending} onClick={saveChanges} className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{save.isPending ? "Salvando..." : "Salvar alterações"}</button>
    </div>
    <header className="flex items-center gap-3"><Trophy className="h-6 w-6 text-amber-300" /><div><h1 className="text-2xl font-semibold text-white">Top Clientes</h1><p className="text-sm text-slate-400">Gerencie as listas exibidas na Tela 3 da Agenda.</p></div></header>
    {query.isLoading ? <p className="text-slate-400">Carregando clientes...</p> : <div className="grid gap-5 xl:grid-cols-2"><Editor title="Top Prioridades" items={draft.priorities} onChange={(priorities) => change({ priorities })} /><Editor title="Top 10 Recorrentes" recurring items={draft.recurring} onChange={(recurring) => change({ recurring })} /></div>}
  </div>;
}
