import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/routes/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/auth/login-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { ClientsPage } from "@/pages/clients/clients-page";
import { TasksPage } from "@/pages/tasks/tasks-page";
import { AgendaPage } from "@/pages/agenda/agenda-page";
import { isSupabaseConfigured } from "@/lib/supabase";
import { IntegrationsPage } from "@/pages/integrations/integrations-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { TeamPage } from "@/pages/team/team-page";
import { ReportsPage } from "@/pages/reports/reports-page";
import { TaskTypesPage } from "@/pages/task-types/task-types-page";
import { PrioritiesPage } from "@/pages/priorities/priorities-page";
import { TopClientsPage } from "@/pages/top-clients/top-clients-page";
import { TvDemoPage } from "@/pages/agenda/tv-demo-page";

export function App() {
  if (!isSupabaseConfigured) return <TvDemoPage />;

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/integracoes" element={<IntegrationsPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/equipe" element={<TeamPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/funcoes-tarefas" element={<TaskTypesPage />} />
            <Route path="/prioridades" element={<PrioritiesPage />} />
            <Route path="/top-clientes" element={<TopClientsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
