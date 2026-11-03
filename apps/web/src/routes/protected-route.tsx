import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { session, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  const operationalPaths = ["/agenda", "/prioridades", "/top-clientes", "/configuracoes"];
  if (location.pathname === "/top-clientes" && !["owner", "admin"].includes(profile?.role ?? "")) return <Navigate to="/agenda" replace />;
  if (location.pathname === "/funcoes-tarefas" && profile?.role !== "owner") return <Navigate to="/agenda" replace />;
  if (["admin", "simple"].includes(profile?.role ?? "") && !operationalPaths.includes(location.pathname)) return <Navigate to="/agenda" replace />;
  if (profile?.role === "agenda" && !["/agenda", "/configuracoes"].includes(location.pathname)) return <Navigate to="/agenda" replace />;

  return <Outlet />;
}
