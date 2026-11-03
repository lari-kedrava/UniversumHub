import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, SlidersHorizontal, X } from "lucide-react";
import type { Client, Task } from "@universum/shared";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { getCallsSupabaseClient, getSupabaseClient, isCallsSupabaseConfigured } from "@/lib/supabase";
import { emitUrgentClientAlert, getAlertSettings, type AlertSettings } from "@/lib/urgent-alert";
import { UrgentAlertDisplay } from "@/components/urgent-alert-display";
import {
  DEFAULT_AUVO_TASK_TYPES,
  scopeForTaskType,
  type TaskScope,
} from "@/lib/auvo-task-types";
import {
  AgendaDisplay,
  type DisplayScreenConfig,
  type DisplayScreenId,
  type DisplayTask,
  type ScreenVisibilityFilter,
  type TopClientsViewMode,
} from "./components/agenda-display";
import { TvMonitorDisplay, type CallingAttendant } from "./components/tv-monitor-display";
import type { TopClientsData } from "@/pages/top-clients/top-clients-page";

type Device = "mobile" | "desktop" | "tv1" | "tv2";
type DisplayTheme = "dark" | "light";
type DisplayLayout = "carousel" | "columns" | "tv-monitor";
type CallingRecord = { id: string | number; nome_atendente: string | null; hora_ligação: string | null; statusdeligação: boolean };
type Person = { id: string; name: string };
type AgendaSource = "universum" | "auvo";
type AgendaTask = Pick<
  Task,
  | "id"
  | "title"
  | "taskType"
  | "status"
  | "startsAt"
  | "clientId"
  | "assigneeStaffId"
  | "location"
  | "taskScope"
  | "priority"
> & { clientName?: string | null; attendantName?: string | null };
type AgendaAlert = { id: string; clientName: string; priority: string | null };
type Filters = {
  taskTypes: string[];
  statuses: string[];
  attendants: string[];
  serviceTypes: string[];
  clients: string[];
  priorities: string[];
};
type Customization = {
  category: string;
  name: string;
  config?: { scope?: TaskScope } & Partial<AlertSettings>;
  is_active?: boolean;
};
const emptyFilters = (): Filters => ({
  taskTypes: [],
  statuses: [],
  attendants: [],
  serviceTypes: [],
  clients: [],
  priorities: [],
});
const emptyScreenFilter = (): ScreenVisibilityFilter => ({
  periodMode: "automatic",
  includeAttendants: [],
  hideAttendants: [],
  includeTaskTypes: [],
  hideTaskTypes: [],
  includeStatuses: [],
  hideStatuses: [],
});
const screenDateRange = (filter: ScreenVisibilityFilter, today: string) => {
  return filter.periodMode === "manual"
    ? { start: filter.startDate || today, end: filter.endDate || filter.startDate || today }
    : { start: today, end: today };
};
const defaultScreenTitles: Record<DisplayScreenId, string> = {
  external: "Externo",
  unfinished: "Interno",
  topClients: "Top Clientes",
};

const statusLabels: Record<string, string> = {
  opened: "Não iniciada",
  in_displacement: "Em deslocamento",
  checked_in: "Em execução",
  checked_out: "Finalizada",
  finished: "Finalizada",
  backlog: "Não iniciada",
  todo: "Não iniciada",
  pending: "Não iniciada",
  in_progress: "Em execução",
  paused: "Pausada",
  done: "Finalizada",
  completed: "Finalizada",
  cancelled: "Cancelada",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
  external: "Externo",
  internal: "Interno",
};
const agendaStatuses: Person[] = [
  { id: "opened", name: "Não iniciada" },
  { id: "in_displacement", name: "Em deslocamento" },
  { id: "checked_in", name: "Em execução" },
  { id: "paused", name: "Pausada" },
  { id: "checked_out", name: "Finalizada" },
  { id: "cancelled", name: "Cancelada" },
];
const label = (value?: string | null) =>
  statusLabels[(value ?? "").toLowerCase()] ??
  (value ?? "Nao informado").replaceAll("_", " ");
const matchesStatusFilter = (selected: string[], value: string) =>
  selected.includes(value) || selected.includes(label(value));
const inputDate = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

function CheckboxFilter({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: Person[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    );
  return (
    <fieldset className="rounded-xl border border-surface-border bg-surface p-4">
      <legend className="px-1 text-sm font-semibold text-white">{title}</legend>
      <div className="mt-2 flex items-center justify-between gap-2 border-b border-surface-border pb-3 text-xs">
        <span className="text-slate-400">{values.length ? `${values.length} selecionado(s)` : "Todos"}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(options.map((option) => option.id))} className="font-semibold text-brand-300 hover:text-brand-200">Selecionar todos</button>
          <button type="button" onClick={() => onChange([])} className="font-semibold text-slate-300 hover:text-white">Limpar</button>
        </div>
      </div>
      <div className="mt-2 max-h-36 space-y-2 overflow-auto pr-1">
        {options.length ? (
          options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-500"
                checked={values.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              {option.name}
            </label>
          ))
        ) : (
          <p className="text-xs text-slate-500">Sem opcoes no periodo.</p>
        )}
      </div>
    </fieldset>
  );
}

function VisibilityCheckboxFilter({
  label: title,
  options,
  includeValues,
  hideValues,
  onChange,
}: {
  label: string;
  options: string[];
  includeValues: string[];
  hideValues: string[];
  onChange: (next: { include: string[]; hide: string[] }) => void;
}) {
  const [mode, setMode] = useState<"include" | "hide">(() =>
    hideValues.length ? "hide" : "include",
  );
  useEffect(() => {
    if (hideValues.length) setMode("hide");
    else if (includeValues.length) setMode("include");
  }, [hideValues, includeValues]);
  const values = mode === "include" ? includeValues : hideValues;
  const changeMode = (next: "include" | "hide") => {
    const selected = values;
    setMode(next);
    onChange(
      next === "include"
        ? { include: selected, hide: [] }
        : { include: [], hide: selected },
    );
  };
  const toggle = (option: string) => {
    const selected = values.includes(option)
      ? values.filter((value) => value !== option)
      : [...values, option];
    onChange(
      mode === "include"
        ? { include: selected, hide: [] }
        : { include: [], hide: selected },
    );
  };
  const selectAll = () =>
    onChange(mode === "include" ? { include: options, hide: [] } : { include: [], hide: options });
  const clear = () => onChange({ include: [], hide: [] });
  return (
    <fieldset className="rounded-xl border border-surface-border bg-surface-raised p-3">
      <legend className="px-1 text-xs font-semibold uppercase text-slate-300">
        {title}
      </legend>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border border-surface-border p-0.5 text-xs font-semibold">
          <button type="button" onClick={() => changeMode("include")} className={`rounded-md px-2.5 py-1.5 ${mode === "include" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>Mostrar</button>
          <button type="button" onClick={() => changeMode("hide")} className={`rounded-md px-2.5 py-1.5 ${mode === "hide" ? "bg-slate-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>Ocultar</button>
        </div>
        <div className="flex gap-3 text-xs font-semibold">
          <button type="button" onClick={selectAll} className="text-brand-300 hover:text-brand-200">Todos</button>
          <button type="button" onClick={clear} className="text-slate-300 hover:text-white">Limpar</button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{values.length ? `${values.length} selecionado(s)` : mode === "include" ? "Todos visíveis" : "Nenhum oculto"}</p>
      <div className="mt-2 max-h-36 space-y-1 overflow-auto [scrollbar-width:thin]">
        {options.length ? (
          options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-slate-200 hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={values.includes(option)}
                onChange={() => toggle(option)}
              />
              <span>{option}</span>
            </label>
          ))
        ) : (
          <p className="px-1 py-2 text-xs text-slate-500">
            Sem opções no período.
          </p>
        )}
      </div>
    </fieldset>
  );
}

export function AgendaPage() {
  const { session, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const displayRef = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("dark");
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>("carousel");
  const [source, setSource] = useState<AgendaSource>("auvo");
  const [automaticDate, setAutomaticDate] = useState(() => inputDate(new Date()));
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [refresh, setRefresh] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [topClientsMode, setTopClientsMode] = useState<TopClientsViewMode>("both");
  const [loadedPreferencesKey, setLoadedPreferencesKey] = useState("");
  const [priorityAlert, setPriorityAlert] = useState("");
  const [agendaAlertSettings, setAgendaAlertSettings] = useState(getAlertSettings);
  const [alertSyncing, setAlertSyncing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterFeedback, setFilterFeedback] = useState("");
  const activeAlertIntervals = useRef<Map<string, number>>(new Map());
  const alertEmissionCounts = useRef<Map<string, number>>(new Map());
  const activeAlertChecks = useRef<Set<string>>(new Set());
  const alertDismissTimers = useRef<number[]>([]);
  const [screens, setScreens] = useState<DisplayScreenConfig[]>([
    { id: "external", enabled: true, duration: 15 },
    { id: "unfinished", enabled: true, duration: 15 },
    { id: "topClients", enabled: true, duration: 15 },
  ]);
  const [screenFilters, setScreenFilters] = useState<
    Record<DisplayScreenId, ScreenVisibilityFilter>
  >({
    external: emptyScreenFilter(),
    unfinished: emptyScreenFilter(),
    topClients: emptyScreenFilter(),
  });
  const [draftScreenFilters, setDraftScreenFilters] = useState<
    Record<DisplayScreenId, ScreenVisibilityFilter>
  >({
    external: emptyScreenFilter(),
    unfinished: emptyScreenFilter(),
    topClients: emptyScreenFilter(),
  });
  const preferencesKey = session?.user.id
    ? `universum-agenda-preferences:${session.user.id}`
    : "";

  useEffect(() => {
    if (authLoading || !preferencesKey) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(preferencesKey) ??
          localStorage.getItem("universum-agenda-preferences") ??
          "{}",
      ) as Partial<{
        source: AgendaSource;
        device: Device;
        displayTheme: DisplayTheme;
        displayLayout: DisplayLayout;
        refresh: number;
        autoRefresh: boolean;
        autoScroll: boolean;
        screens: DisplayScreenConfig[];
        screenFilters: Record<DisplayScreenId, ScreenVisibilityFilter>;
        filters: Filters;
      }>;
      if (saved.source) setSource(saved.source);
      if (saved.device) setDevice(saved.device === ("tv" as Device) ? "tv1" : saved.device);
      if (saved.displayTheme) setDisplayTheme(saved.displayTheme);
      if (saved.displayLayout) setDisplayLayout(saved.displayLayout);
      if (saved.refresh) setRefresh(saved.refresh);
      if (typeof saved.autoRefresh === "boolean")
        setAutoRefresh(saved.autoRefresh);
      if (typeof saved.autoScroll === "boolean")
        setAutoScroll(saved.autoScroll);
      if (saved.screens?.length) setScreens(saved.screens);
      if (saved.screenFilters) {
        setScreenFilters(saved.screenFilters);
        setDraftScreenFilters(saved.screenFilters);
      }
      if (saved.filters) {
        const filtersWithoutClients = { ...saved.filters, clients: [] };
        setDraftFilters(filtersWithoutClients);
        setAppliedFilters(filtersWithoutClients);
      }
    } catch {
      /* preferencias invalidas sao ignoradas */
    } finally {
      setLoadedPreferencesKey(preferencesKey);
    }
  }, [authLoading, preferencesKey]);
  useEffect(() => {
    if (!preferencesKey || loadedPreferencesKey !== preferencesKey) return;
    localStorage.setItem(
      preferencesKey,
      JSON.stringify({
        source,
        device,
        displayTheme,
        displayLayout,
        refresh,
        autoRefresh,
        autoScroll,
        screens,
        screenFilters,
        filters: appliedFilters,
      }),
    );
  }, [
    loadedPreferencesKey,
    source,
    device,
    displayTheme,
    displayLayout,
    refresh,
    autoRefresh,
    autoScroll,
    screens,
    screenFilters,
    appliedFilters,
    preferencesKey,
  ]);
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      if (event.key !== preferencesKey || !event.newValue)
        return;
      try {
        const saved = JSON.parse(event.newValue) as {
          screens?: DisplayScreenConfig[];
          screenFilters?: Record<DisplayScreenId, ScreenVisibilityFilter>;
          refresh?: number;
          autoRefresh?: boolean;
          autoScroll?: boolean;
          filters?: Filters;
          displayTheme?: DisplayTheme;
          displayLayout?: DisplayLayout;
        };
        if (saved.screens) setScreens(saved.screens);
        if (saved.displayTheme) setDisplayTheme(saved.displayTheme);
        if (saved.displayLayout) setDisplayLayout(saved.displayLayout);
        if (saved.screenFilters) {
          setScreenFilters(saved.screenFilters);
          setDraftScreenFilters(saved.screenFilters);
        }
        if (saved.refresh) setRefresh(saved.refresh);
        if (typeof saved.autoRefresh === "boolean")
          setAutoRefresh(saved.autoRefresh);
        if (typeof saved.autoScroll === "boolean")
          setAutoScroll(saved.autoScroll);
        if (saved.filters) {
          const filtersWithoutClients = { ...saved.filters, clients: [] };
          setDraftFilters(filtersWithoutClients);
          setAppliedFilters(filtersWithoutClients);
        }
      } catch {
        /* mensagem inválida */
      }
    };
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, [preferencesKey]);
  useEffect(() => {
    const updateAutomaticDate = () => setAutomaticDate(inputDate(new Date()));
    const timer = window.setInterval(updateAutomaticDate, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const handler = () =>
      setFullscreen(document.fullscreenElement === displayRef.current);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);
  useEffect(() => {
    if (!autoRefresh || source !== "auvo") return;
    let active = true;
    const ranges = (["external", "unfinished"] as DisplayScreenId[]).map((id) => screenDateRange(screenFilters[id], automaticDate));
    const syncStart = ranges.map(({ start }) => start).sort()[0];
    const syncEnd = ranges.map(({ end }) => end).sort().at(-1)!;
    const synchronize = async () => {
      const { error } = await getSupabaseClient().functions.invoke(
        "auvo-sync-request",
        { body: { start: syncStart, end: syncEnd, full: false } },
      );
      if (error)
        console.warn("Sincronização automática da Auvo não concluída.");
      else if (active)
        await queryClient.invalidateQueries({ queryKey: ["agenda-tasks"] });
    };
    void synchronize();
    const timer = window.setInterval(
      () => void synchronize(),
      Math.max(60, refresh) * 1000,
    );
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [autoRefresh, source, refresh, queryClient, screenFilters, automaticDate]);
  const query = useMemo(() => {
    const ranges = (["external", "unfinished"] as DisplayScreenId[]).map((id) => screenDateRange(screenFilters[id], automaticDate));
    const queryStart = ranges.map(({ start }) => start).sort()[0];
    const queryEnd = ranges.map(({ end }) => end).sort().at(-1)!;
    const params = new URLSearchParams({
      start: `${queryStart}T00:00:00`,
      end: `${queryEnd}T23:59:59.999`,
    });
    return params.toString();
  }, [screenFilters, automaticDate]);
  const tasksQuery = useQuery({
    queryKey: ["agenda-tasks", source, query],
    queryFn: async (): Promise<AgendaTask[]> => {
      if (source === "universum") return api.get<Task[]>(`/api/tasks?${query}`);
      const params = new URLSearchParams(query);
      const { data, error } = await getSupabaseClient().functions.invoke(
        "auvo-agenda",
        { body: { start: params.get("start"), end: params.get("end") } },
      );
      if (error) throw error;
      return (data.data ?? [])
        .map((task: Record<string, unknown>) => ({
        id: String(task.auvo_task_id),
        title: String(task.title ?? "Tarefa Auvo"),
        taskType: String(task.task_type ?? "Nao informado"),
        status: String(task.status ?? "opened"),
        priority: task.priority as Task["priority"] | undefined,
        startsAt: task.scheduled_start_at as string | null,
        clientId: null,
        assigneeStaffId: task.attendant_name as string | null,
        location: null,
        taskScope: task.service_type === "internal" ? "internal" : "external",
        clientName: task.customer_name as string | null,
        attendantName: task.attendant_name as string | null,
        }));
    },
    refetchInterval: autoRefresh ? refresh * 1_000 : false,
  });
  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get<AgendaAlert[]>("/api/alerts"),
    staleTime: 0,
    refetchInterval: agendaAlertSettings.enabled ? 10_000 : false,
  });
  const operationalClientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/api/clients"),
    staleTime: 5 * 60_000,
  });
  const topClientsQuery = useQuery({
    queryKey: ["top-clients"],
    queryFn: () => api.get<TopClientsData>("/api/top-clients"),
    staleTime: 30_000,
    refetchInterval: autoRefresh ? refresh * 1_000 : false,
  });
  const callingQuery = useQuery({
    queryKey: ["registro-ligacoes"],
    queryFn: async (): Promise<CallingRecord[]> => {
      const { data, error } = await getCallsSupabaseClient()
        .from("registro_ligacoes")
        .select("id,nome_atendente,hora_ligação,statusdeligação")
        .order("hora_ligação", { ascending: false });
      if (error) throw error;
      // A coluna possui acento no banco; o parser de tipos do Supabase não a reconhece.
      return (data ?? []) as unknown as CallingRecord[];
    },
    enabled: isCallsSupabaseConfigured,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
  useEffect(() => {
    if (!isCallsSupabaseConfigured) return;
    const callsClient = getCallsSupabaseClient();
    const channel = callsClient
      .channel("registro-ligacoes-tv")
      .on("postgres_changes", { event: "*", schema: "public", table: "registro_ligacoes" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["registro-ligacoes"] });
      })
      .subscribe();
    return () => { void callsClient.removeChannel(channel); };
  }, [queryClient]);
  const staffQuery = useQuery({
    queryKey: ["staff", false],
    queryFn: () => api.get<Person[]>("/api/staff?archived=false"),
    staleTime: 5 * 60_000,
  });
  const customizationsQuery = useQuery({
    queryKey: ["customizations"],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("system_customizations")
        .select("category,name,config,is_active")
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Customization[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const tasks: AgendaTask[] = tasksQuery.data ?? [];
  useEffect(() => {
    const saved = customizationsQuery.data?.find((item) => item.category === "alert_settings" && item.name === "global")?.config;
    if (!saved) return;
    const next = { ...getAlertSettings(), ...saved } as AlertSettings;
    setAgendaAlertSettings(next);
    localStorage.setItem("hub.alertSettings", JSON.stringify(next));
  }, [customizationsQuery.data]);
  useEffect(() => () => {
    activeAlertIntervals.current.forEach(window.clearInterval);
    alertDismissTimers.current.forEach(window.clearTimeout);
  }, []);
  useEffect(() => {
    const activeAlerts = agendaAlertSettings.enabled ? (alertsQuery.data ?? []) : [];
    const activeIds = new Set(activeAlerts.map((alert) => alert.id));
    activeAlertIntervals.current.forEach((timer, id) => {
      if (!activeIds.has(id)) {
        window.clearInterval(timer);
        activeAlertIntervals.current.delete(id);
        alertEmissionCounts.current.delete(id);
      }
    });
    activeAlerts.forEach((alert) => {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
      const historyKey = `${today}:${alert.id}:${alert.clientName}`;
      if (!alertEmissionCounts.current.has(alert.id)) {
        try {
          const history = JSON.parse(localStorage.getItem("hub.alertEmissionHistory") ?? "{}") as Record<string, number>;
          alertEmissionCounts.current.set(alert.id, history[historyKey] ?? 0);
        } catch {
          alertEmissionCounts.current.set(alert.id, 0);
        }
      }
      if ((alertEmissionCounts.current.get(alert.id) ?? 0) >= agendaAlertSettings.repeatCount) return;
      if (activeAlertIntervals.current.has(alert.id)) return;
      const emit = async () => {
        if (activeAlertChecks.current.has(alert.id)) return;
        activeAlertChecks.current.add(alert.id);
        const emitted = alertEmissionCounts.current.get(alert.id) ?? 0;
        if (emitted >= agendaAlertSettings.repeatCount) {
          const timer = activeAlertIntervals.current.get(alert.id);
          if (timer) window.clearInterval(timer);
          activeAlertChecks.current.delete(alert.id);
          return;
        }
        if (emitted > 0) {
          try {
            const { error } = await getSupabaseClient().functions.invoke("auvo-sync-request", { body: { start: today, end: today, full: false } });
            if (error) return;
            const refreshed = await alertsQuery.refetch();
            if (!(refreshed.data ?? []).some((item) => item.id === alert.id)) {
              const timer = activeAlertIntervals.current.get(alert.id);
              if (timer) window.clearInterval(timer);
              activeAlertIntervals.current.delete(alert.id);
              return;
            }
          } finally {
            activeAlertChecks.current.delete(alert.id);
          }
        }
        void emitUrgentClientAlert({ name: alert.clientName, priorityLevel: "urgent" }, setPriorityAlert);
        alertEmissionCounts.current.set(alert.id, emitted + 1);
        try {
          const history = JSON.parse(localStorage.getItem("hub.alertEmissionHistory") ?? "{}") as Record<string, number>;
          const currentDayHistory = Object.fromEntries(Object.entries(history).filter(([key]) => key.startsWith(`${today}:`)));
          localStorage.setItem("hub.alertEmissionHistory", JSON.stringify({ ...currentDayHistory, [historyKey]: emitted + 1 }));
        } catch {
          localStorage.setItem("hub.alertEmissionHistory", JSON.stringify({ [historyKey]: emitted + 1 }));
        }
        alertDismissTimers.current.push(window.setTimeout(() => setPriorityAlert(""), agendaAlertSettings.duration * 1000));
        activeAlertChecks.current.delete(alert.id);
      };
      void emit();
      activeAlertIntervals.current.set(alert.id, window.setInterval(() => void emit(), Math.max(1, agendaAlertSettings.repeatIntervalMinutes) * 60_000));
    });
  }, [alertsQuery.data, agendaAlertSettings]);
  const clients =
    source === "auvo"
      ? Array.from(
          new Map(
            tasks
              .filter((task) => task.clientName)
              .map((task) => [
                task.clientName!,
                { id: task.clientName!, name: task.clientName! },
              ]),
          ).values(),
        )
      : (operationalClientsQuery.data ?? []);
  const staff =
    source === "auvo"
      ? Array.from(
          new Map(
            tasks
              .filter((task) => task.attendantName)
              .map((task) => [
                task.attendantName!,
                { id: task.attendantName!, name: task.attendantName! },
              ]),
          ).values(),
        )
      : (staffQuery.data ?? []);
  const configuredTypes = useMemo(() => {
    const saved = (customizationsQuery.data ?? [])
      .filter(
        (item) =>
          item.category === "auvo_task_type" &&
          item.is_active !== false &&
          item.config?.scope,
      )
      .map((item) => ({ name: item.name, scope: item.config!.scope! }));
    return DEFAULT_AUVO_TASK_TYPES.map(
      (item) => saved.find((row) => row.name === item.name) ?? item,
    );
  }, [customizationsQuery.data]);
  const displayTasks: DisplayTask[] = tasks
    .map((task) => ({
      id: task.id,
      startsAt: task.startsAt ?? null,
      clientName:
        task.clientName ??
        clients.find((item) => item.id === task.clientId)?.name ??
        "Cliente não informado",
      taskType: task.taskType || "Tipo não informado",
      attendantName:
        task.attendantName ??
        staff.find((item) => item.id === task.assigneeStaffId)?.name ??
        "Sem atendente",
      attendantId: task.assigneeStaffId ?? task.attendantName ?? null,
      location: task.location ?? task.title ?? "Local não informado",
      status: task.status,
      priority: task.priority,
      scope: scopeForTaskType(task.taskType, configuredTypes),
    }))
    .filter(
      (task) =>
        (!appliedFilters.taskTypes.length ||
          appliedFilters.taskTypes.includes(task.taskType)) &&
        (!appliedFilters.statuses.length ||
          matchesStatusFilter(appliedFilters.statuses, task.status)) &&
        (!appliedFilters.attendants.length ||
          appliedFilters.attendants.includes(task.attendantId ?? task.attendantName)) &&
        (!appliedFilters.serviceTypes.length ||
          appliedFilters.serviceTypes.includes(task.scope)) &&
        (!appliedFilters.priorities.length ||
          appliedFilters.priorities.includes(task.priority ?? "")),
    );
  const types = Array.from(new Set(tasks.map((task) => task.taskType)))
    .sort()
    .map((id) => ({ id, name: label(id) }));
  const statuses = Array.from(
    new Map(
      [...agendaStatuses, ...tasks.map((task) => ({ id: task.status, name: label(task.status) }))]
        .map((status) => {
          const normalized = label(status.id);
          return [normalized, { id: normalized, name: normalized }];
        }),
    ).values(),
  );
  const shell = fullscreen
    ? "max-w-none"
    : device === "tv1" || device === "tv2"
      ? "max-w-none text-lg"
      : device === "mobile"
        ? "max-w-sm"
        : "max-w-[1500px]";
  const updateDraft = (key: keyof Filters) => (next: string[]) =>
    setDraftFilters((current) => ({ ...current, [key]: next }));
  const updateScreen = (
    id: DisplayScreenConfig["id"],
    patch: Partial<DisplayScreenConfig>,
  ) =>
    setScreens((current) =>
      current.map((screen) =>
        screen.id === id ? { ...screen, ...patch } : screen,
      ),
    );
  const updateScreenFilter = (
    id: DisplayScreenId,
    patch: Partial<ScreenVisibilityFilter>,
  ) =>
    setDraftScreenFilters((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  const showFilterFeedback = (message: string) => {
    setFilterFeedback(message);
    window.setTimeout(() => setFilterFeedback(""), 3000);
  };
  const applyScreenFilter = (id: DisplayScreenId) => {
    setScreenFilters((current) => ({
      ...current,
      [id]: { ...draftScreenFilters[id] },
    }));
    showFilterFeedback(`Filtros da ${id === "external" ? "Tela 1" : "Tela 2"} aplicados com sucesso.`);
  };
  const clearScreenFilter = (id: DisplayScreenId) => {
    const clean = emptyScreenFilter();
    setDraftScreenFilters((current) => ({ ...current, [id]: clean }));
    setScreenFilters((current) => ({ ...current, [id]: clean }));
    showFilterFeedback(`Filtros da ${id === "external" ? "Tela 1" : "Tela 2"} removidos com sucesso.`);
  };
  const appliedCount = Object.values(appliedFilters).flat().length;

  return (
    <div
      ref={displayRef}
      className={fullscreen ? "h-screen w-screen overflow-hidden bg-[#080b12] p-0" : `min-h-screen w-full space-y-5 bg-surface p-4 ${shell}`}
    >
      {!fullscreen && (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-white">Agenda de exibição</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200">
                <SlidersHorizontal className="h-4 w-4" /> Filtros {appliedCount ? `(${appliedCount})` : ""}
              </button>
              <button type="button" disabled={alertSyncing} onClick={async () => {
                setAlertSyncing(true);
                try {
                  await alertsQuery.refetch();
                } finally {
                  setAlertSyncing(false);
                }
              }} className="rounded-lg border border-cyan-500/60 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-50">{alertSyncing ? "Sincronizando..." : "Sincronizar alertas"}</button>
              <button
              type="button"
              onClick={() =>
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : displayRef.current?.requestFullscreen()
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Abrir modo TV
              </button>
            </div>
          </header>
          <details open className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <summary className="cursor-pointer font-semibold text-white">
              Configurações gerais
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Fonte
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as AgendaSource)}
                className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="universum">Universum</option>
                <option value="auvo">Auvo (Supabase)</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase text-slate-400">
              Dispositivo
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value as Device)}
                className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="tv1">Televisão 1</option>
                <option value="tv2">Televisão 2</option>
                <option value="desktop">Computador</option>
                <option value="mobile">Celular</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase text-slate-400">
              Tema da exibição
              <select
                value={displayTheme}
                onChange={(e) => setDisplayTheme(e.target.value as DisplayTheme)}
                className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase text-slate-400">
              Layout das telas
              <select
                value={displayLayout}
                onChange={(e) => setDisplayLayout(e.target.value as DisplayLayout)}
                className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="carousel">Layout 1 — Agenda original</option>
                <option value="tv-monitor">Layout 2 — Painel de monitoramento</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase text-slate-400">
              Atualização
              <select
                value={refresh}
                onChange={(e) =>
                  setRefresh(Math.max(60, Number(e.target.value)))
                }
                className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
              >
                <option value="60">1 minuto</option>
                <option value="120">2 minutos</option>
                <option value="300">5 minutos</option>
              </select>
            </label>
            </div>
          </details>
          <details open className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <summary className="cursor-pointer font-semibold text-white">
              Telas do modo de exibição
            </summary>
            <div className="mb-4 mt-3 flex flex-wrap items-center justify-end gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.target.checked)}
                />{" "}
                Rolagem automática contínua
              </label>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {screens.map((screen) => {
                const filter = draftScreenFilters[screen.id];
                return (
                  <article
                    key={screen.id}
                    className="rounded-xl border border-surface-border bg-surface p-4"
                  >
                    <label className="flex items-start gap-3 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={screen.enabled}
                        onChange={(event) =>
                          updateScreen(screen.id, {
                            enabled: event.target.checked,
                          })
                        }
                      />
                      <span>
                        {screen.id === "external"
                          ? "1. Externo"
                          : screen.id === "unfinished"
                            ? "2. Interno"
                            : "3. Top Clientes"}
                      </span>
                    </label>
                    <label className="mt-4 block text-xs uppercase text-slate-400">
                      Título da tela
                      <input
                        type="text"
                        value={screen.title ?? ""}
                        onChange={(event) =>
                          updateScreen(screen.id, { title: event.target.value })
                        }
                        placeholder={defaultScreenTitles[screen.id]}
                        className="mt-2 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm normal-case text-white placeholder:text-slate-500"
                      />
                    </label>
                    <label className="mt-4 block text-xs uppercase text-slate-400">
                      Tempo na tela
                      <select
                        value={screen.duration}
                        onChange={(event) =>
                          updateScreen(screen.id, {
                            duration: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-white"
                      >
                        <option value={10}>10 segundos</option>
                        <option value={15}>15 segundos</option>
                        <option value={30}>30 segundos</option>
                        <option value={60}>1 minuto</option>
                        <option value={120}>2 minutos</option>
                        <option value={180}>3 minutos</option>
                      </select>
                    </label>
                    {screen.id === "topClients" && <label className="mt-4 block text-xs uppercase text-slate-400">
                      Visualização dos Top Clientes
                      <select value={topClientsMode} onChange={(event) => setTopClientsMode(event.target.value as TopClientsViewMode)} className="mt-2 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm normal-case text-white">
                        <option value="both">Mostrar as duas colunas juntas</option>
                        <option value="priorities">Somente Top Prioridades</option>
                        <option value="recurring">Somente Top 10 Recorrentes</option>
                      </select>
                    </label>}
                    {screen.id !== "topClients" && <details className="hidden mt-4">
                      <summary className="cursor-pointer text-xs font-semibold text-brand-300">
                        Filtros desta tela
                      </summary>
                      <div className="mt-3 grid gap-3">
                        <VisibilityCheckboxFilter
                          label="Atendentes"
                          options={staff.map((item) => item.name)}
                          includeValues={filter.includeAttendants}
                          hideValues={filter.hideAttendants}
                          onChange={({ include, hide }) =>
                            updateScreenFilter(screen.id, {
                              includeAttendants: include,
                              hideAttendants: hide,
                            })
                          }
                        />
                        <VisibilityCheckboxFilter
                          label="Tipos de tarefa"
                          options={types.map((item) => item.name)}
                          includeValues={filter.includeTaskTypes}
                          hideValues={filter.hideTaskTypes}
                          onChange={({ include, hide }) =>
                            updateScreenFilter(screen.id, {
                              includeTaskTypes: include,
                              hideTaskTypes: hide,
                            })
                          }
                        />
                        <VisibilityCheckboxFilter
                          label="Status"
                          options={Array.from(
                            new Set(statuses.map((item) => item.name)),
                          )}
                          includeValues={filter.includeStatuses ?? []}
                          hideValues={filter.hideStatuses ?? []}
                          onChange={({ include, hide }) =>
                            updateScreenFilter(screen.id, {
                              includeStatuses: include,
                              hideStatuses: hide,
                            })
                          }
                        />
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => applyScreenFilter(screen.id)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Aplicar filtros
                          </button>
                          <button
                            type="button"
                            onClick={() => clearScreenFilter(screen.id)}
                            className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-slate-200"
                          >
                            Remover filtros
                          </button>
                        </div>
                      </div>
                    </details>}
                    {screen.id !== "topClients" && <button type="button" onClick={() => setFiltersOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-brand-300"><SlidersHorizontal className="h-3.5 w-3.5" /> Configurar filtros</button>}
                  </article>
                );
              })}
            </div>
          </details>
          <details className="hidden rounded-2xl border border-surface-border bg-surface-raised p-4">
            <summary className="cursor-pointer font-semibold text-white">
              Filtros{" "}
              {appliedCount ? `(${appliedCount} aplicado(s))` : ""}
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <CheckboxFilter
                title="Tipos de tarefa"
                options={types}
                values={draftFilters.taskTypes}
                onChange={updateDraft("taskTypes")}
              />
              <CheckboxFilter
                title="Status"
                options={statuses}
                values={draftFilters.statuses}
                onChange={updateDraft("statuses")}
              />
              <CheckboxFilter
                title="Atendentes"
                options={staff}
                values={draftFilters.attendants}
                onChange={updateDraft("attendants")}
              />
              <CheckboxFilter
                title="Tipo de atendimento"
                options={[
                  { id: "external", name: "Externo" },
                  { id: "internal", name: "Interno" },
                ]}
                values={draftFilters.serviceTypes}
                onChange={updateDraft("serviceTypes")}
              />
              <CheckboxFilter
                title="Prioridade"
                options={[
                  { id: "urgent", name: "Urgente" },
                  { id: "high", name: "Alta" },
                  { id: "medium", name: "Media" },
                  { id: "low", name: "Baixa" },
                ]}
                values={draftFilters.priorities}
                onChange={updateDraft("priorities")}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setAppliedFilters(draftFilters)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  const clean = emptyFilters();
                  setDraftFilters(clean);
                  setAppliedFilters(clean);
                }}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-200"
              >
                Remover filtros
              </button>
              <label className="ml-auto flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />{" "}
                Atualizar automaticamente
              </label>
            </div>
          </details>
          {filtersOpen && <div className="fixed inset-0 z-50 bg-black/60" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setFiltersOpen(false)}>
            <aside role="dialog" aria-modal="true" aria-label="Filtros da agenda" className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-surface-border bg-surface-raised shadow-2xl">
              <header className="flex items-center justify-between border-b border-surface-border px-5 py-4">
                <div><h2 className="flex items-center gap-2 text-lg font-semibold text-white"><SlidersHorizontal className="h-5 w-5 text-blue-300" /> Filtros da agenda</h2><p className="mt-1 text-xs text-slate-400">Organize os filtros gerais e os períodos de cada tela.</p></div>
                <button type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
              </header>
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {(["external", "unfinished"] as DisplayScreenId[]).map((id) => {
                  const current = draftScreenFilters[id];
                  const title = id === "external" ? "Tela 1 · Externo" : "Tela 2 · Interno";
                  return <section key={id} className="rounded-xl border border-surface-border bg-surface p-4">
                    <div className="mb-4"><h3 className="font-semibold text-white">{title}</h3><p className="text-xs text-slate-400">Período e filtros exclusivos desta tela.</p></div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Período
                      <select value={current.periodMode ?? "automatic"} onChange={(event) => updateScreenFilter(id, { periodMode: event.target.value as "automatic" | "manual" })} className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm normal-case text-white">
                        <option value="automatic">Diário</option>
                        <option value="manual">Personalizado</option>
                      </select>
                    </label>
                    {(current.periodMode ?? "automatic") === "manual" && <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold uppercase text-slate-400">Data inicial<input type="date" value={current.startDate ?? ""} max={current.endDate} onChange={(event) => updateScreenFilter(id, { startDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm normal-case text-white" /></label>
                      <label className="text-xs font-semibold uppercase text-slate-400">Data final<input type="date" value={current.endDate ?? ""} min={current.startDate} onChange={(event) => updateScreenFilter(id, { endDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm normal-case text-white" /></label>
                    </div>}
                    <div className="mt-4 grid gap-3">
                      <VisibilityCheckboxFilter label="Atendentes" options={staff.map((item) => item.name)} includeValues={current.includeAttendants} hideValues={current.hideAttendants} onChange={({ include, hide }) => updateScreenFilter(id, { includeAttendants: include, hideAttendants: hide })} />
                      <VisibilityCheckboxFilter label="Tipos de tarefa" options={types.map((item) => item.name)} includeValues={current.includeTaskTypes} hideValues={current.hideTaskTypes} onChange={({ include, hide }) => updateScreenFilter(id, { includeTaskTypes: include, hideTaskTypes: hide })} />
                      <VisibilityCheckboxFilter label="Status" options={Array.from(new Set(statuses.map((item) => item.name)))} includeValues={current.includeStatuses ?? []} hideValues={current.hideStatuses ?? []} onChange={({ include, hide }) => updateScreenFilter(id, { includeStatuses: include, hideStatuses: hide })} />
                    </div>
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => applyScreenFilter(id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Salvar e aplicar</button><button type="button" onClick={() => clearScreenFilter(id)} className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-slate-200">Remover filtros</button></div>
                  </section>;
                })}
                <section className="rounded-xl border border-surface-border bg-surface p-4">
                  <h3 className="font-semibold text-white">Filtros gerais</h3><p className="mb-4 text-xs text-slate-400">Aplicados à consulta completa da agenda.</p>
                  <div className="grid gap-3 sm:grid-cols-2"><CheckboxFilter title="Tipos de tarefa" options={types} values={draftFilters.taskTypes} onChange={updateDraft("taskTypes")} /><CheckboxFilter title="Status" options={statuses} values={draftFilters.statuses} onChange={updateDraft("statuses")} /><CheckboxFilter title="Atendentes" options={staff} values={draftFilters.attendants} onChange={updateDraft("attendants")} /><CheckboxFilter title="Tipo de atendimento" options={[{ id: "external", name: "Externo" }, { id: "internal", name: "Interno" }]} values={draftFilters.serviceTypes} onChange={updateDraft("serviceTypes")} /><CheckboxFilter title="Prioridade" options={[{ id: "urgent", name: "Urgente" }, { id: "high", name: "Alta" }, { id: "medium", name: "Média" }, { id: "low", name: "Baixa" }]} values={draftFilters.priorities} onChange={updateDraft("priorities")} /></div>
                  <div className="mt-4 flex gap-2"><button type="button" onClick={() => { setAppliedFilters({ ...draftFilters }); showFilterFeedback("Filtros gerais aplicados com sucesso."); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Salvar e aplicar</button><button type="button" onClick={() => { const clean = emptyFilters(); setDraftFilters(clean); setAppliedFilters(clean); showFilterFeedback("Filtros gerais removidos com sucesso."); }} className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-200">Remover filtros</button></div>
                </section>
              </div>
              <footer className="flex items-center justify-between gap-3 border-t border-surface-border px-5 py-4"><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} /> Atualizar automaticamente</label><button type="button" onClick={() => { setDraftFilters(appliedFilters); setDraftScreenFilters(screenFilters); setFiltersOpen(false); showFilterFeedback("Alterações canceladas."); }} className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-200">Cancelar e fechar</button></footer>
            </aside>
          </div>}
        </>
      )}
      {filterFeedback && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{filterFeedback}</div>}
      {tasksQuery.isError && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          Nao foi possivel carregar a agenda. Verifique sua sessao e a conexao
          com o backend.
        </p>
      )}
      <UrgentAlertDisplay message={priorityAlert} settings={agendaAlertSettings} onDismiss={() => setPriorityAlert("")} />
      {displayLayout === "tv-monitor" ? (
        <TvMonitorDisplay
          tasks={displayTasks}
          topClients={topClientsQuery.data ?? { priorities: [], recurring: [] }}
          callingAttendants={(callingQuery.data ?? []).map((record): CallingAttendant => ({
            id: record.id,
            name: record.nome_atendente?.trim() || "Atendente não informado",
            time: record.hora_ligação,
            isActive: record.statusdeligação,
          }))}
          filters={{
            external: screenFilters.external,
            unfinished: screenFilters.unfinished,
          }}
          autoScroll
          fullscreen={fullscreen}
        />
      ) : (
        <AgendaDisplay
          tasks={displayTasks}
          screens={screens}
          filters={screenFilters}
          autoScroll={autoScroll}
          theme={displayTheme}
          scrollSpeed={0.6}
          layout={displayLayout}
          device={device}
          topClients={topClientsQuery.data ?? { priorities: [], recurring: [] }}
          topClientsMode={topClientsMode}
        />
      )}
    </div>
  );
}
