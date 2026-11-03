import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCallsSupabaseClient, isCallsSupabaseConfigured } from "@/lib/supabase";
import { AgendaDisplay, type DisplayScreenId, type ScreenVisibilityFilter } from "./components/agenda-display";
import { TvMonitorDisplay, type CallingAttendant } from "./components/tv-monitor-display";

const tasks = [
  { id: "demo-1", startsAt: new Date().toISOString(), clientName: "Clínica Sorriso", taskType: "Manutenção preventiva", attendantName: "Ana Paula", location: "Belo Horizonte", status: "checked_in", scope: "internal" as const },
  { id: "demo-2", startsAt: new Date(Date.now() + 3_600_000).toISOString(), clientName: "Grupo Almeida", taskType: "Visita técnica", attendantName: "Roberto Silva", location: "Contagem", status: "in_displacement", scope: "external" as const },
  { id: "demo-3", startsAt: new Date(Date.now() + 7_200_000).toISOString(), clientName: "Hotel Central", taskType: "Atendimento", attendantName: "Fernanda Melo", location: "Nova Lima", status: "opened", scope: "external" as const },
];

const demoCallingAttendants: CallingAttendant[] = [
  { id: "demo-call-1", name: "Diogo", time: "09:56:29", isActive: true },
  { id: "demo-call-2", name: "Ana Paula", time: "10:02:14", isActive: false },
];

export function TvDemoPage() {
  const [layout, setLayout] = useState<"layout1" | "layout2">("layout2");
  const callingQuery = useQuery({
    queryKey: ["registro-ligacoes-demo"],
    enabled: isCallsSupabaseConfigured,
    queryFn: async (): Promise<CallingAttendant[]> => {
      const { data, error } = await getCallsSupabaseClient()
        .from("registro_ligacoes")
        .select("id,nome_atendente,hora_ligação,statusdeligação")
        .order("hora_ligação", { ascending: false });
      if (error) throw error;
      const records = (data ?? []) as unknown as Array<{ id: string | number; nome_atendente: string | null; hora_ligação: string | null; statusdeligação: boolean }>;
      return records.map((call) => {
        return { id: call.id, name: call.nome_atendente?.trim() || "Atendente não informado", time: call.hora_ligação, isActive: call.statusdeligação };
      });
    },
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  const callingAttendants = isCallsSupabaseConfigured ? (callingQuery.data ?? []) : demoCallingAttendants;
  const filters: Record<DisplayScreenId, ScreenVisibilityFilter> = {
    external: { includeAttendants: [], hideAttendants: [], includeTaskTypes: [], hideTaskTypes: [], includeStatuses: [], hideStatuses: [] },
    unfinished: { includeAttendants: [], hideAttendants: [], includeTaskTypes: [], hideTaskTypes: [], includeStatuses: [], hideStatuses: [] },
    topClients: { includeAttendants: [], hideAttendants: [], includeTaskTypes: [], hideTaskTypes: [], includeStatuses: [], hideStatuses: [] },
  };
  return (
    <main className="min-h-screen bg-[#080b12] p-4">
      <div className="mx-auto mb-3 flex max-w-[1800px] flex-wrap items-center justify-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-center text-sm font-semibold text-amber-100">
        <span>{isCallsSupabaseConfigured ? "Prévia local: agenda fictícia e ligações reais." : "Prévia local: os dados abaixo são fictícios."}</span>
        <div className="flex overflow-hidden rounded-md border border-amber-200/30 text-xs"><button type="button" onClick={() => setLayout("layout1")} className={`px-3 py-1.5 font-bold ${layout === "layout1" ? "bg-amber-300 text-slate-950" : "text-amber-100"}`}>Layout 1</button><button type="button" onClick={() => setLayout("layout2")} className={`px-3 py-1.5 font-bold ${layout === "layout2" ? "bg-amber-300 text-slate-950" : "text-amber-100"}`}>Layout 2</button></div>
      </div>
      <div className="mx-auto max-w-[1800px]">
        {layout === "layout2" ? <TvMonitorDisplay
          tasks={tasks}
          topClients={{ priorities: [{ name: "Grupo Almeida", attendanceCount: 0 }, { name: "Clínica Sorriso", attendanceCount: 0 }, { name: "Hotel Central", attendanceCount: 0 }], recurring: [] }}
          callingAttendants={callingAttendants}
          filters={{ external: filters.external, unfinished: filters.unfinished }}
          autoScroll
        /> : <AgendaDisplay tasks={tasks} screens={[{ id: "external", enabled: true, duration: 15 }]} filters={filters} autoScroll={false} topClients={{ priorities: [], recurring: [] }} />}
      </div>
    </main>
  );
}
