import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TaskScope } from "@/lib/auvo-task-types";
import type { TopClientsData, TopClientItem } from "@/pages/top-clients/top-clients-page";

export type DisplayScreenId = "external" | "unfinished" | "topClients";
export type DisplayScreenConfig = {
  id: DisplayScreenId;
  enabled: boolean;
  duration: number;
  title?: string;
};
export type TopClientsViewMode = "both" | "priorities" | "recurring";
export type ScreenVisibilityFilter = {
  periodMode?: "automatic" | "manual";
  includeAttendants: string[];
  hideAttendants: string[];
  includeTaskTypes: string[];
  hideTaskTypes: string[];
  includeStatuses: string[];
  hideStatuses: string[];
  startDate?: string;
  endDate?: string;
};
export type DisplayTask = {
  id: string;
  startsAt: string | null;
  clientName: string;
  taskType: string;
  attendantName: string;
  attendantId?: string | null;
  location: string;
  status: string;
  priority?: string | null;
  scope: TaskScope;
};

const statusLabel: Record<string, string> = {
  opened: "Não iniciada",
  in_displacement: "Em deslocamento",
  checked_in: "Em execução",
  paused: "Pausada",
  checked_out: "Finalizada",
  finished: "Finalizada",
  done: "Finalizada",
  completed: "Finalizada",
  cancelled: "Cancelada",
};
const statusColor: Record<string, string> = {
  opened: "border-red-800 bg-red-600 !text-white shadow-sm shadow-red-500/30",
  in_displacement: "border-orange-800 bg-orange-500 !text-slate-950 shadow-sm shadow-orange-500/30",
  checked_in: "border-emerald-800 bg-emerald-600 !text-white shadow-sm shadow-emerald-500/30",
  paused: "border-purple-800 bg-purple-600 !text-white shadow-sm shadow-purple-500/30",
  checked_out: "border-slate-700 bg-slate-600 !text-white",
  finished: "border-slate-700 bg-slate-600 !text-white",
  done: "border-slate-700 bg-slate-600 !text-white",
  completed: "border-slate-700 bg-slate-600 !text-white",
  cancelled: "border-zinc-800 bg-zinc-700 !text-white",
};

function TaskDateTime({ startsAt, large = false }: { startsAt: string | null; large?: boolean }) {
  if (!startsAt) return <strong className="text-sky-300">--/--<span className="block">--:--</span></strong>;
  const date = new Date(startsAt);
  return (
    <strong className={`${large ? "text-[clamp(30px,2.15vw,42px)]" : "text-[clamp(15px,1.3vw,20px)]"} leading-tight text-sky-300`}>
      <span className={`${large ? "text-[0.65em]" : "text-[0.7em]"} block text-slate-300`}>
        {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)}
      </span>
      {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(date)}
    </strong>
  );
}

function TaskList({ tasks, large }: { tasks: DisplayTask[]; large: boolean }) {
  if (!large) return (
    <div className="min-w-[820px] xl:min-w-[940px]">
      <div className="grid grid-cols-[80px_1.4fr_1fr_1fr_1.4fr_140px] gap-3 border-b border-white/15 px-4 py-3 text-[clamp(10px,0.8vw,12px)] font-bold uppercase text-slate-300">
        <span>Data / horário</span><span>Cliente</span><span>Tipo</span><span>Atendente</span><span>Local</span><span>Status</span>
      </div>
      {tasks.map((task) => <div key={task.id} className="grid grid-cols-[80px_1.4fr_1fr_1fr_1.4fr_140px] items-center gap-3 border-b border-white/10 px-4 py-4 text-[clamp(12px,1vw,16px)]">
        <TaskDateTime startsAt={task.startsAt} />
        <strong className="text-white">{task.clientName}</strong><span className="text-slate-200">{task.taskType}</span><span className="text-slate-200">{task.attendantName}</span><span className="text-slate-300">{task.location}</span>
        <span className={`rounded-md border px-2 py-1 text-center text-xs font-bold uppercase ${statusColor[task.status] ?? statusColor.opened}`}>{statusLabel[task.status] ?? task.status}</span>
      </div>)}
    </div>
  );
  return (
    <div className="min-w-[980px]">
      <div className="grid grid-cols-[135px_1.45fr_1fr_210px] gap-6 border-b border-white/15 px-7 py-4 text-[clamp(18px,1.3vw,24px)] font-bold uppercase text-slate-300">
        <span>Data / horário</span>
        <span>Cliente / local</span>
        <span>Serviço / atendente</span>
        <span>Status</span>
      </div>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="grid grid-cols-[135px_1.45fr_1fr_210px] items-center gap-6 border-b border-white/10 px-7 py-6 text-[clamp(24px,1.75vw,34px)] leading-tight"
        >
          <TaskDateTime startsAt={task.startsAt} large />
          <div className="min-w-0">
            <strong className="block text-white">{task.clientName}</strong>
            <span className="mt-1.5 block text-[clamp(18px,1.3vw,25px)] leading-snug text-slate-300">{task.location}</span>
          </div>
          <div className="min-w-0">
            <strong className="block text-slate-100">{task.taskType}</strong>
            <span className="mt-1.5 block text-[clamp(19px,1.4vw,27px)] text-slate-300">{task.attendantName}</span>
          </div>
          <span
            className={`rounded-lg border px-3 py-3 text-center text-[clamp(18px,1.3vw,25px)] font-bold uppercase leading-tight ${statusColor[task.status] ?? statusColor.opened}`}
          >
            {statusLabel[task.status] ?? task.status}
          </span>
        </div>
      ))}
    </div>
  );
}

const medal = (index: number) => index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`;
function AutoScrollArea({ enabled, speed, resetKey, children }: { enabled: boolean; speed: number; resetKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTop = 0;
    if (!enabled) return;
    let frame = 0;
    let previous = 0;
    let pauseUntil = 0;
    const move = (now: number) => {
      if (!previous) previous = now;
      const delta = Math.min(40, now - previous);
      previous = now;
      const lastPosition = element.scrollHeight - element.clientHeight;
      if (lastPosition > 0) {
        if (pauseUntil && now >= pauseUntil) {
          element.scrollTop = 0;
          pauseUntil = 0;
        } else if (!pauseUntil) {
          const nextPosition = element.scrollTop + (speed * delta) / 16;
          if (nextPosition >= lastPosition) {
            element.scrollTop = lastPosition;
            pauseUntil = now + 1000;
          } else element.scrollTop = nextPosition;
        }
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [enabled, speed, resetKey]);
  return <div ref={ref} className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>;
}
function ClientColumn({ title, items, priority, large, autoScroll, scrollSpeed }: { title: string; items: TopClientItem[]; priority?: boolean; large: boolean; autoScroll: boolean; scrollSpeed: number }) {
  const resetKey = items.map((item) => `${item.id ?? item.name}:${item.position ?? ""}`).join("|");
  return <section className="flex min-h-0 min-w-0 flex-1 flex-col border-white/15 lg:border-r lg:last:border-r-0"><h3 className={`${large ? "text-[clamp(26px,2vw,38px)]" : "text-lg"} shrink-0 border-b border-white/15 px-5 py-4 font-black uppercase text-white`}>{title}</h3><AutoScrollArea enabled={autoScroll} speed={scrollSpeed} resetKey={resetKey}><div className={priority || !items.length ? "" : "grid min-h-full auto-rows-[minmax(56px,1fr)]"}>{items.map((item, index) => <div key={`${item.name}-${index}`} className={`flex items-center border-b border-white/10 px-5 ${priority ? "gap-4 py-4" : "gap-3 py-2"}`}><strong className={`${large ? (priority ? "text-4xl" : "text-3xl") : "text-2xl"} w-16 shrink-0 text-center text-sky-300`}>{priority ? `${index + 1}º` : medal(index)}</strong><strong className={`${priority ? (large ? "text-[clamp(34px,2.5vw,48px)]" : "text-2xl") : (large ? "text-[clamp(21px,1.65vw,30px)]" : "text-base")} min-w-0 flex-1 leading-tight text-white`}>{item.name}</strong>{!priority && <span className={`${large ? "text-2xl" : "text-lg"} shrink-0 font-bold text-white`}>{item.attendanceCount}</span>}</div>)}</div>{!items.length && <p className="p-6 text-sm text-slate-400">Nenhum cliente cadastrado.</p>}</AutoScrollArea></section>;
}
function TopClients({ data, mode, large, autoScroll, scrollSpeed }: { data: TopClientsData; mode: TopClientsViewMode; large: boolean; autoScroll: boolean; scrollSpeed: number }) {
  return <div className={`${mode === "both" ? "grid lg:grid-cols-2" : "flex"} h-full min-h-0`}>{(mode === "both" || mode === "priorities") && <ClientColumn title="Top Prioridades" items={data.priorities} priority large={large} autoScroll={autoScroll} scrollSpeed={scrollSpeed} />}{(mode === "both" || mode === "recurring") && <ClientColumn title="Top 10 Recorrentes" items={data.recurring} large={large} autoScroll={autoScroll} scrollSpeed={scrollSpeed} />}</div>;
}

function applyScreenFilter(tasks: DisplayTask[], visibility: ScreenVisibilityFilter) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const startDate = visibility.periodMode === "manual" ? visibility.startDate : today;
  const endDate = visibility.periodMode === "manual" ? visibility.endDate : today;
  return tasks.filter((task) => {
    const translatedStatus = statusLabel[task.status] ?? task.status;
    const taskDate = task.startsAt
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(task.startsAt))
      : "";
    return (
      (!visibility.includeAttendants.length || visibility.includeAttendants.includes(task.attendantName)) &&
      !visibility.hideAttendants.includes(task.attendantName) &&
      (!visibility.includeTaskTypes.length || visibility.includeTaskTypes.includes(task.taskType)) &&
      !visibility.hideTaskTypes.includes(task.taskType) &&
      (!(visibility.includeStatuses ?? []).length || visibility.includeStatuses.includes(translatedStatus)) &&
      !(visibility.hideStatuses ?? []).includes(translatedStatus) &&
      (!startDate || taskDate >= startDate) &&
      (!endDate || taskDate <= endDate)
    );
  });
}

function ColumnScreen({ screen, tasks, filter, topClients, topClientsMode, autoScroll, scrollSpeed }: { screen: DisplayScreenConfig; tasks: DisplayTask[]; filter: ScreenVisibilityFilter; topClients: TopClientsData; topClientsMode: TopClientsViewMode; autoScroll: boolean; scrollSpeed: number }) {
  const titles: Record<DisplayScreenId, string> = { external: "Externo", unfinished: "Interno", topClients: "Top Clientes" };
  const visible = applyScreenFilter(tasks, filter);
  const ordered = visible.filter((task) => screen.id === "external"
    ? task.scope === "external"
    : task.scope === "internal").sort((a, b) => (a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER) - (b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER));
  const ranking = Array.from(visible.reduce((map, task) => map.set(task.clientName, (map.get(task.clientName) ?? 0) + 1), new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 10);
  return <article className="flex min-h-0 flex-col overflow-hidden border-b border-white/15 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
    <header className="border-b border-white/15 px-4 py-4"><h3 className="text-lg font-bold uppercase text-white">{screen.title?.trim() || titles[screen.id]}</h3><p className="text-xs text-slate-300">Filtros exclusivos desta tela</p></header>
    <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {screen.id === "topClients" && <TopClients data={topClients} mode={topClientsMode} large={false} autoScroll={autoScroll} scrollSpeed={scrollSpeed} />}
      <div className={screen.id === "topClients" ? "hidden" : "block"}>
      {screen.id === "topClients" ? ranking.map(([client, total], index) => <div key={client} className="flex items-center gap-3 border-b border-white/10 px-4 py-3"><strong className="text-sky-300">#{index + 1}</strong><span className="min-w-0 flex-1 truncate font-semibold text-white">{client}</span><strong className="text-white">{total}</strong></div>) : ordered.map((task) => <div key={task.id} className="border-b border-white/10 px-4 py-3 text-sm"><div className="flex items-start justify-between gap-2"><strong className="min-w-0 truncate text-white">{task.clientName}</strong><span className="shrink-0 text-right"><TaskDateTime startsAt={task.startsAt} /></span></div><p className="mt-1 truncate text-slate-300">{task.taskType} · {task.attendantName}</p><span className={`mt-2 inline-block rounded border px-2 py-1 text-[10px] font-bold uppercase ${statusColor[task.status] ?? statusColor.opened}`}>{statusLabel[task.status] ?? task.status}</span></div>)}
      {(screen.id === "topClients" ? ranking.length : ordered.length) === 0 && <p className="p-4 text-sm text-slate-400">Nenhum item para os filtros selecionados.</p>}
      </div>
    </div>
  </article>;
}

export function AgendaDisplay({
  tasks,
  screens,
  filters,
  autoScroll,
  scrollSpeed = 1.25,
  theme = "dark",
  layout = "carousel",
  device = "desktop",
  topClients,
  topClientsMode = "both",
}: {
  tasks: DisplayTask[];
  screens: DisplayScreenConfig[];
  filters: Record<DisplayScreenId, ScreenVisibilityFilter>;
  autoScroll: boolean;
  scrollSpeed?: number;
  theme?: "dark" | "light";
  layout?: "carousel" | "columns";
  device?: "mobile" | "desktop" | "tv1" | "tv2";
  topClients: TopClientsData;
  topClientsMode?: TopClientsViewMode;
}) {
  const largeDisplay = device === "tv2";
  const enabled = screens.filter((screen) => screen.enabled);
  const [index, setIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const current = enabled[index % Math.max(enabled.length, 1)] ?? {
    id: "external" as const,
    duration: 15,
    enabled: true,
  };
  useEffect(() => {
    setIndex(0);
  }, [
    screens
      .map((screen) => `${screen.id}:${screen.enabled}:${screen.duration}`)
      .join("|"),
  ]);
  useEffect(() => {
    const duration = Math.max(5, current.duration);
    const deadline = Date.now() + duration * 1000;
    const updateCountdown = () =>
      setSecondsRemaining(
        Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
    updateCountdown();
    const countdown = window.setInterval(updateCountdown, 250);
    const transition =
      enabled.length > 1
        ? window.setTimeout(
            () => setIndex((value) => (value + 1) % enabled.length),
            duration * 1000,
          )
        : undefined;
    return () => {
      window.clearInterval(countdown);
      if (transition) window.clearTimeout(transition);
    };
  }, [index, enabled.length, current.duration]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = 0;
    if (!autoScroll) return;
    let frame = 0;
    let previous = 0;
    let pauseUntil = 0;
    const move = (now: number) => {
      if (!previous) previous = now;
      const delta = Math.min(40, now - previous);
      previous = now;
      const lastPosition = element.scrollHeight - element.clientHeight;
      if (lastPosition > 0) {
        if (pauseUntil && now >= pauseUntil) {
          element.scrollTop = 0;
          pauseUntil = 0;
          previous = now;
        } else if (!pauseUntil) {
          const nextPosition = element.scrollTop + (scrollSpeed * delta) / 16;
          if (nextPosition >= lastPosition) {
            element.scrollTop = lastPosition;
            pauseUntil = now + 1000;
          } else element.scrollTop = nextPosition;
        }
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [current.id, tasks, autoScroll, scrollSpeed]);
  const visibility = filters[current.id];
  const visibleTasks = tasks.filter((task) => {
    const translatedStatus = statusLabel[task.status] ?? task.status;
    const includeStatuses = visibility.includeStatuses ?? [];
    const hideStatuses = visibility.hideStatuses ?? [];
    const taskDate = task.startsAt
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(task.startsAt))
      : "";
    return (
      (!visibility.includeAttendants.length ||
        visibility.includeAttendants.includes(task.attendantName)) &&
      !visibility.hideAttendants.includes(task.attendantName) &&
      (!visibility.includeTaskTypes.length ||
        visibility.includeTaskTypes.includes(task.taskType)) &&
      !visibility.hideTaskTypes.includes(task.taskType) &&
      (!includeStatuses.length || includeStatuses.includes(translatedStatus)) &&
      !hideStatuses.includes(translatedStatus) &&
      (!visibility.startDate || taskDate >= visibility.startDate) &&
      (!visibility.endDate || taskDate <= visibility.endDate)
    );
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const byStartTime = (a: DisplayTask, b: DisplayTask) =>
    (a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER) -
    (b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER);
  const external = visibleTasks
    .filter((task) => task.scope === "external" && task.startsAt && (visibility.startDate || visibility.endDate
      ? true
      : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(task.startsAt)) === today))
    .sort(byStartTime);
  const internal = visibleTasks
    .filter((task) => task.scope === "internal")
    .sort(byStartTime);
  const titles: Record<DisplayScreenId, string> = {
    external: "Externo",
    unfinished: "Interno",
    topClients: "Top Clientes",
  };
  const screenTitle = current.title?.trim() || titles[current.id];
  if (layout === "columns") return (
    <section data-display-theme={theme} data-display-size={device} className={`agenda-display-${theme} flex h-[calc(100vh-32px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border ${theme === "light" ? "border-sky-300 bg-gradient-to-br from-sky-50 to-slate-100" : "border-sky-500/30 bg-gradient-to-br from-[#071b3c] to-[#09142c]"}`}>
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4"><div><h2 className="text-xl font-bold uppercase text-white">Visão simultânea</h2><p className="text-xs text-slate-300">{enabled.length} tela(s) exibida(s) ao mesmo tempo</p></div><strong className="text-slate-200">{new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date())}</strong></header>
      <div className={`grid min-h-0 flex-1 ${enabled.length <= 1 ? "grid-cols-1 grid-rows-1" : enabled.length === 2 ? "grid-rows-2 lg:grid-cols-2 lg:grid-rows-1" : "grid-rows-3 lg:grid-cols-3 lg:grid-rows-1"}`}>{enabled.map((screen) => <ColumnScreen key={screen.id} screen={screen} tasks={tasks} filter={filters[screen.id]} topClients={topClients} topClientsMode={topClientsMode} autoScroll={autoScroll} scrollSpeed={scrollSpeed} />)}</div>
      <footer className="border-t border-white/10 px-6 py-3 text-xs text-slate-300">Cada coluna mantém seus próprios filtros</footer>
    </section>
  );
  return (
    <section
      data-display-theme={theme}
      data-display-size={device}
      className={`agenda-display-${theme} flex h-[calc(100vh-32px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border ${theme === "light" ? "border-sky-300 bg-gradient-to-br from-sky-50 to-slate-100" : "border-sky-500/30 bg-gradient-to-br from-[#071b3c] to-[#09142c]"}`}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className={`${largeDisplay ? "text-[clamp(34px,2.6vw,50px)]" : "text-2xl"} font-bold uppercase tracking-wide text-white`}>
            {screenTitle}
          </h2>
          <p className={`${largeDisplay ? "mt-1.5 text-[clamp(20px,1.45vw,28px)]" : "mt-1 text-sm"} text-slate-300`}>
            Tela {index + 1} de {enabled.length || 1} ·{" "}
            {enabled.length > 1
              ? `próxima tela em ${secondsRemaining}s`
              : "tela única ativa"}
          </p>
        </div>
        <div className={`${largeDisplay ? "text-[clamp(24px,1.7vw,32px)]" : "text-base"} text-right text-slate-200`}>
          <strong>
            {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(
              new Date(),
            )}
          </strong>
          <p className="text-xs">Atualização automática ativa</p>
        </div>
      </header>
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {current.id === "topClients" ? (
          <TopClients data={topClients} mode={topClientsMode} large={largeDisplay} autoScroll={autoScroll} scrollSpeed={scrollSpeed} />
        ) : (
          <TaskList tasks={current.id === "external" ? external : internal} large={largeDisplay} />
        )}
      </div>
      <footer className={`flex items-center justify-between border-t border-white/10 px-6 py-3 ${largeDisplay ? "text-[clamp(18px,1.3vw,25px)]" : "text-xs"} text-slate-300`}>
        <span>Rolagem automática {autoScroll ? "ativa" : "pausada"}</span>
        <span>
          {current.id === "external"
            ? external.length
            : current.id === "unfinished"
              ? internal.length
              : Math.min(
                  10,
                  new Set(visibleTasks.map((task) => task.clientName)).size,
                )}{" "}
          item(ns)
        </span>
      </footer>
    </section>
  );
}
