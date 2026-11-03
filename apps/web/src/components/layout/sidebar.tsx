import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, ListTodo, Puzzle, Settings, UserRoundCog, FileText, SlidersHorizontal, BellRing, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/tarefas", label: "Tarefas", icon: ListTodo },
  { to: "/equipe", label: "Equipe", icon: UserRoundCog },
  { to: "/integracoes", label: "Integrações", icon: Puzzle },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/funcoes-tarefas", label: "Funções das tarefas", icon: SlidersHorizontal },
  { to: "/prioridades", label: "Prioridades", icon: BellRing },
  { to: "/top-clientes", label: "Top Clientes", icon: Trophy },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const { profile } = useAuth();
  const operationalPaths = ["/agenda", "/prioridades", "/top-clientes", "/configuracoes"];
  const items = profile?.role === "agenda"
    ? NAV_ITEMS.filter((item) => item.to === "/agenda" || item.to === "/configuracoes")
    : profile?.role === "admin"
      ? NAV_ITEMS.filter((item) => operationalPaths.includes(item.to))
      : profile?.role === "simple"
        ? NAV_ITEMS.filter((item) => operationalPaths.includes(item.to) && item.to !== "/top-clientes")
      : NAV_ITEMS.filter((item) => item.to !== "/funcoes-tarefas" || profile?.role === "owner");
  return (
    <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-surface-raised md:flex md:flex-col">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold tracking-tight text-white">Universum Hub</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors",
                "hover:bg-white/5 hover:text-white",
                isActive && "bg-brand-500/15 text-brand-300"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
