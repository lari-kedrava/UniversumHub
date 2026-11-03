import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import {
  DEFAULT_AUVO_TASK_TYPES,
  normalizeTaskType,
  type TaskScope,
} from "@/lib/auvo-task-types";
import { getSupabaseClient } from "@/lib/supabase";

type Customization = {
  id: string;
  category: string;
  name: string;
  config: { scope?: TaskScope };
  is_active: boolean;
};

const category = "auvo_task_type";

export function TaskTypesPage() {
  const cache = useQueryClient();
  const [draft, setDraft] = useState<Record<string, TaskScope>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScope, setNewScope] = useState<TaskScope>("internal");

  const query = useQuery({
    queryKey: ["customizations", category],
    queryFn: () => api.get<Customization[]>("/api/customizations"),
  });
  const auvoTypes = useQuery({
    queryKey: ["auvo-task-types"],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("auvo_task_types")
        .select("name")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((item) => item.name).filter(Boolean) as string[];
    },
  });

  const saved = useMemo(
    () => (query.data ?? []).filter((item) => item.category === category),
    [query.data],
  );
  const rows = useMemo(() => {
    const available = new Map(
      DEFAULT_AUVO_TASK_TYPES.map((item) => [normalizeTaskType(item.name), item]),
    );
    for (const name of auvoTypes.data ?? []) {
      const key = normalizeTaskType(name);
      if (!available.has(key)) available.set(key, { name, scope: "external" });
    }
    for (const item of saved) {
      const key = normalizeTaskType(item.name);
      if (!item.is_active) available.delete(key);
      else available.set(key, {
        name: item.name,
        scope: item.config.scope ?? available.get(key)?.scope ?? "internal",
      });
    }
    return Array.from(available.values()).map((item) => ({
      ...item,
      scope: draft[item.name] ?? item.scope,
    }));
  }, [auvoTypes.data, draft, saved]);

  async function refresh() {
    await cache.invalidateQueries({ queryKey: ["customizations"] });
  }

  const save = useMutation({
    mutationFn: async () => Promise.all(Object.entries(draft).map(([name, scope]) => {
      const existing = saved.find((item) => normalizeTaskType(item.name) === normalizeTaskType(name));
      return existing
        ? api.patch(`/api/customizations/${existing.id}`, { config: { scope }, isActive: true })
        : api.post("/api/customizations", { category, name, config: { scope }, isActive: true });
    })),
    onSuccess: async () => {
      setDraft({});
      await refresh();
    },
  });
  const create = useMutation({
    mutationFn: () => api.post("/api/customizations", {
      category,
      name: newName.trim(),
      config: { scope: newScope },
      isActive: true,
    }),
    onSuccess: async () => {
      setNewName("");
      setNewScope("internal");
      setShowCreate(false);
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: async (name: string) => {
      const existing = saved.find((item) => normalizeTaskType(item.name) === normalizeTaskType(name));
      return existing
        ? api.patch(`/api/customizations/${existing.id}`, { isActive: false })
        : api.post("/api/customizations", { category, name, config: {}, isActive: false });
    },
    onSuccess: refresh,
  });

  function removeType(name: string) {
    if (window.confirm(`Excluir o tipo de tarefa “${name}”?`)) remove.mutate(name);
  }

  const hasChanges = Object.keys(draft).length > 0;
  const error = save.error ?? create.error ?? remove.error;

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Funções das Tarefas</h1>
          <p className="text-sm text-slate-400">
            Gerenciamento exclusivo para usuários Master e Administrador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Novo tipo de tarefa
        </button>
      </header>

      {showCreate && (
        <section className="rounded-xl border border-brand-500/40 bg-surface-raised p-5">
          <h2 className="font-semibold text-white">Criar tipo de tarefa</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <input
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nome do tipo de tarefa"
              className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            />
            <select
              value={newScope}
              onChange={(event) => setNewScope(event.target.value as TaskScope)}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              <option value="internal">Interno</option>
              <option value="external">Externo</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={create.isPending || !newName.trim()}
                onClick={() => create.mutate()}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Salvar
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewName(""); }}
                className="flex items-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
        <div className="grid grid-cols-[1fr_140px_140px_100px] gap-4 border-b border-surface-border px-5 py-3 text-xs font-semibold uppercase text-slate-400">
          <span>Tipo de tarefa</span><span>Interno</span><span>Externo</span><span>Ações</span>
        </div>
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[1fr_140px_140px_100px] items-center gap-4 border-b border-surface-border px-5 py-4 last:border-0">
            <strong className="text-sm text-white">{row.name}</strong>
            {(["internal", "external"] as TaskScope[]).map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name={row.name}
                  checked={row.scope === scope}
                  onChange={() => setDraft((current) => ({ ...current, [row.name]: scope }))}
                />
                {scope === "internal" ? "Interno" : "Externo"}
              </label>
            ))}
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => removeType(row.name)}
              className="flex items-center gap-1 text-sm text-red-400 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={save.isPending || !hasChanges}
          onClick={() => save.mutate()}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {save.isPending ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          disabled={!hasChanges || save.isPending}
          onClick={() => setDraft({})}
          className="flex items-center gap-2 rounded-lg border border-surface-border px-5 py-2 text-sm text-slate-300 disabled:opacity-50"
        >
          <X className="h-4 w-4" /> Cancelar alterações
        </button>
      </div>
      {save.isSuccess && !hasChanges && <p className="text-sm text-emerald-300">Alterações salvas no Supabase.</p>}
      {error && <p className="text-sm text-red-300">{(error as Error).message}</p>}
    </div>
  );
}
