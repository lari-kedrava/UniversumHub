import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CalendarDays, ClipboardList, MonitorSmartphone, PhoneCall, Presentation, UserRound, UsersRound, Wrench } from "lucide-react";
import type { DisplayTask } from "./agenda-display";
import type { ScreenVisibilityFilter } from "./agenda-display";
import type { TopClientsData } from "@/pages/top-clients/top-clients-page";

export type CallingAttendant = {
  id: string | number;
  name: string;
  time: string | null;
  isActive: boolean;
};

const status = {
  checked_in: { label: "EM EXECUÇÃO", style: "from-emerald-700 to-emerald-800 text-emerald-50" },
  in_displacement: { label: "EM DESLOCAMENTO", style: "from-orange-500 to-orange-700 text-orange-50" },
  checked_out: { label: "FINALIZADA", style: "from-slate-500 to-slate-700 text-slate-50" },
  finished: { label: "FINALIZADA", style: "from-slate-500 to-slate-700 text-slate-50" },
  opened: { label: "NÃO INICIADA", style: "from-red-600 to-red-800 text-red-50" },
  paused: { label: "PAUSADA", style: "from-violet-600 to-violet-800 text-violet-50" },
} as const;

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

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

function MarqueeText({ children }: { children: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);
  useEffect(() => {
    const update = () => {
      setDistance(Math.max(0, (textRef.current?.scrollWidth ?? 0) - (viewportRef.current?.clientWidth ?? 0)));
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    if (viewportRef.current) observer?.observe(viewportRef.current);
    return () => observer?.disconnect();
  }, [children]);
  const duration = Math.max(14, distance / 18 + 6);
  return <div ref={viewportRef} className="min-w-0 overflow-hidden"><span ref={textRef} style={{ "--tv-marquee-distance": `-${distance}px`, "--tv-marquee-duration": `${duration}s` } as CSSProperties} className={distance ? "tv-client-marquee inline-block whitespace-nowrap" : "block truncate"}>{children}</span></div>;
}

function AutoScrollDay({ enabled, resetKey, children }: { enabled: boolean; resetKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTop = 0;
    if (!enabled) return;

    let pauseUntil = Date.now() + 3_000;
    let resetOnResume = false;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const limit = element.scrollHeight - element.clientHeight;
      if (limit > 0) {
        if (now < pauseUntil) {
          return;
        }
        if (resetOnResume) {
          element.scrollTop = 0;
          resetOnResume = false;
          pauseUntil = now + 3_000;
          return;
        }
        const next = element.scrollTop + 1;
        if (next >= limit) {
          element.scrollTop = limit;
          pauseUntil = now + 3_000;
          resetOnResume = true;
        } else element.scrollTop = next;
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [enabled, resetKey]);

  return <div ref={ref} className="min-h-0 flex-1 space-y-2 overflow-hidden p-2">{children}</div>;
}

function ServiceType({ name }: { name: string }) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const config = normalized.includes("instala")
    ? { Icon: Wrench, color: "text-emerald-100" }
    : normalized.includes("trein")
      ? { Icon: Presentation, color: "text-orange-100" }
      : normalized.includes("remot")
        ? { Icon: MonitorSmartphone, color: "text-sky-100" }
        : { Icon: ClipboardList, color: "text-white/90" };
  return <span className={`flex min-w-0 items-center gap-1.5 ${config.color}`}><config.Icon className="h-4 w-4 shrink-0" /><span className="truncate">{name}</span></span>;
}

function matchesScreenFilter(task: DisplayTask, filter: ScreenVisibilityFilter) {
  const taskDate = task.startsAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(task.startsAt))
    : "";
  const status = statusLabel[task.status] ?? task.status;
  const isManualPeriod = filter.periodMode === "manual";

  return (
    (!filter.includeAttendants.length || filter.includeAttendants.includes(task.attendantName)) &&
    !filter.hideAttendants.includes(task.attendantName) &&
    (!filter.includeTaskTypes.length || filter.includeTaskTypes.includes(task.taskType)) &&
    !filter.hideTaskTypes.includes(task.taskType) &&
    (!(filter.includeStatuses ?? []).length || filter.includeStatuses.includes(status)) &&
    !(filter.hideStatuses ?? []).includes(status) &&
    (!isManualPeriod || !filter.startDate || taskDate >= filter.startDate) &&
    (!isManualPeriod || !filter.endDate || taskDate <= filter.endDate)
  );
}

export function TvMonitorDisplay({
  tasks,
  topClients,
  callingAttendants,
  filters,
  autoScroll,
  fullscreen = false,
}: {
  tasks: DisplayTask[];
  topClients: TopClientsData;
  callingAttendants: CallingAttendant[];
  filters: Record<"external" | "unfinished", ScreenVisibilityFilter>;
  autoScroll: boolean;
  fullscreen?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const days = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      return {
        date,
        tasks: tasks
          .filter((task) => matchesScreenFilter(task, task.scope === "internal" ? filters.unfinished : filters.external))
          .filter((task) => task.startsAt && new Date(task.startsAt).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) === key)
          .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime()),
      };
    });
  }, [filters, now, tasks]);
  const activeCalls = callingAttendants.filter((attendant) => attendant.isActive);
  const completedCalls = callingAttendants.filter((attendant) => !attendant.isActive).slice(0, 4);

  return (
    <section className={`flex min-h-[640px] flex-col overflow-hidden bg-[#080b12] p-[clamp(12px,1.2vw,18px)] text-white tv-monitor-panel ${fullscreen ? "h-[100dvh]" : "h-[calc(100dvh-2rem)] rounded-2xl border border-slate-700 shadow-2xl"}`}>
      <header className="grid shrink-0 grid-cols-1 gap-3 lg:grid-cols-2">
        <section aria-label="Top prioridades" className="min-w-0 rounded-xl border border-amber-300/55 bg-gradient-to-b from-amber-300/10 to-[#111622] px-[18px] py-3 shadow-lg">
          <h2 className="mb-2 flex items-center gap-2.5 text-[clamp(24px,2vw,36px)] font-black tracking-[0.06em] text-amber-300"><UsersRound className="h-7 w-7" /> TOP PRIORIDADES</h2>
          {topClients.priorities.length ? (
            <ol className="flex flex-col gap-1.5">
              {topClients.priorities.slice(0, 3).map((client, index) => (
                <li key={`${client.name}-${index}`} className={`flex min-w-0 items-center gap-4 rounded-[10px] border bg-[#0d111b] px-3.5 py-1 ${index === 0 ? "border-amber-300/70" : "border-slate-700"}`}>
                  <span className="min-w-[2.1em] shrink-0 rounded-lg bg-amber-300 px-2 text-center text-[clamp(26px,2.2vw,40px)] font-black leading-[1.25] text-[#1a1300]">{index + 1}º</span>
                  <strong title={client.name} className="min-w-0 truncate text-[clamp(28px,2.8vw,50px)] font-black leading-[1.1]">{client.name}</strong>
                </li>
              ))}
            </ol>
          ) : <p className="py-4 text-center text-[clamp(18px,1.4vw,24px)] text-slate-400">Nenhuma prioridade cadastrada.</p>}
        </section>

        <section aria-live="polite" className={`flex min-w-0 flex-col justify-center gap-2.5 rounded-xl border px-5 py-3 shadow-lg ${activeCalls.length ? "tv-call-glow border-emerald-400/90 bg-gradient-to-b from-emerald-900/60 to-[#111622]" : "border-cyan-500/50 bg-gradient-to-b from-cyan-950/55 to-[#111622]"}`}>
          <div className="flex items-center gap-3 text-[clamp(24px,2.1vw,38px)] font-black tracking-[0.1em] text-cyan-200">
            <PhoneCall className="h-10 w-10" /> EM LIGAÇÃO
            <span className={`min-w-[1.7em] rounded-full px-3 text-center text-[clamp(24px,2.1vw,38px)] leading-[1.3] text-slate-950 ${activeCalls.length ? "bg-emerald-400" : "bg-cyan-300"}`}>{activeCalls.length}</span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {activeCalls.length ? activeCalls.map((attendant) => (
              <div key={attendant.id} className="flex items-center gap-3 text-[clamp(32px,3.4vw,60px)] font-black leading-[1.05] text-white">
                <span className="relative grid h-[clamp(30px,2.8vw,50px)] w-[clamp(30px,2.8vw,50px)] shrink-0 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <PhoneCall className="relative h-[70%] w-[70%] text-emerald-300" />
                </span>
                {attendant.name}
                {attendant.time && <span className="text-[clamp(16px,1.3vw,24px)] font-semibold text-cyan-100/80">desde {attendant.time.slice(0, 5)}</span>}
              </div>
            )) : <span className="text-[clamp(24px,2.2vw,40px)] font-bold text-slate-400">Nenhum atendente em ligação</span>}
          </div>
          {completedCalls.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-cyan-200/20 pt-2">
              <h4 className="text-[clamp(14px,1.1vw,19px)] font-black tracking-[0.12em] text-slate-400">ÚLTIMOS ATENDIMENTOS</h4>
              {completedCalls.map((attendant) => (
                <span key={attendant.id} className="text-[clamp(20px,1.7vw,30px)] font-bold text-slate-200"><span className="text-emerald-300">✓</span> {attendant.name}{attendant.time && <span className="ml-1.5 font-semibold text-slate-400">às {attendant.time.slice(0, 5)}</span>}</span>
              ))}
            </div>
          )}
        </section>
      </header>

      <div className="mb-2 mt-3 shrink-0 flex items-center gap-3 text-[clamp(22px,1.9vw,32px)] font-black text-cyan-300"><CalendarDays className="h-7 w-7" /> AGENDA SEMANAL</div>
      <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
        {days.map(({ date, tasks: dayTasks }) => <article key={date.toISOString()} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#111622]"><header className="shrink-0 border-b border-slate-700 bg-[#0d111b] px-3 py-3 text-center"><h3 className="text-[clamp(18px,1.4vw,24px)] font-black uppercase">{weekday.format(date)}</h3><p className="text-[clamp(14px,1vw,18px)] text-slate-400">{dateFormatter.format(date)}</p></header><AutoScrollDay enabled={autoScroll} resetKey={dayTasks.map((task) => task.id).join("|")}>{dayTasks.map((task) => { const visual = status[task.status as keyof typeof status] ?? status.opened; return <div data-tv-task key={task.id} className={`rounded-xl bg-gradient-to-b ${visual.style} p-4 shadow-lg`}><div className="flex items-center justify-between gap-1 text-[clamp(13px,0.95vw,17px)] font-black"><span className="rounded-full bg-black/20 px-3 py-1">{task.scope === "internal" ? "INTERNO" : "EXTERNO"}</span></div><div className="mt-2 text-[clamp(17px,1.25vw,22px)] font-bold"><ServiceType name={task.taskType} /></div><div className="mt-3 flex items-start gap-3"><strong className="text-[clamp(30px,2.7vw,42px)] leading-none">{task.startsAt ? timeFormatter.format(new Date(task.startsAt)) : "--:--"}</strong><div className="min-w-0 flex-1 border-l border-white/30 pl-3 text-[clamp(24px,2vw,34px)] font-black leading-tight"><MarqueeText>{task.clientName}</MarqueeText></div></div><div className="mt-3 flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-[clamp(19px,1.45vw,24px)] font-semibold"><UserRound className="h-5 w-5 shrink-0" /> <span className="truncate">{task.attendantName}</span></span><span className="shrink-0 rounded-full bg-black/20 px-3 py-1 text-[clamp(13px,0.95vw,17px)] font-black">{visual.label}</span></div></div>; })}{!dayTasks.length && <p className="pt-8 text-center text-[clamp(15px,1vw,18px)] text-slate-500">Sem atendimentos</p>}</AutoScrollDay></article>)}
      </div>
      <footer className="mt-3 flex shrink-0 items-center justify-between border-t border-slate-700 pt-3 text-xs font-semibold text-slate-400"><span>Atualização automática ativa · Rolagem {autoScroll ? "ativa" : "pausada"}</span><span>{activeCalls.length ? "Ligações atualizadas em tempo real" : "Aguardando ligações"}</span></footer>
    </section>
  );
}
