/**
 * Hooks de dados do módulo Dashboards/Widgets, via React Query.
 * Centraliza as query keys e mutations para que os componentes de UI
 * fiquem livres de lógica de fetch/cache.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dashboard, Widget } from "@universum/shared";
import { api } from "@/lib/api";

export function useDashboards() {
  return useQuery({
    queryKey: ["dashboards"],
    queryFn: () => api.get<Dashboard[]>("/api/dashboards"),
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Dashboard>("/api/dashboards", { name, isShared: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboards"] }),
  });
}

export function useWidgets(dashboardId: string | undefined) {
  return useQuery({
    queryKey: ["widgets", dashboardId],
    queryFn: () => api.get<Widget[]>(`/api/dashboards/${dashboardId}/widgets`),
    enabled: Boolean(dashboardId),
  });
}

export function useCreateWidget(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widget: Omit<Widget, "id" | "dashboardId">) =>
      api.post<Widget>(`/api/dashboards/${dashboardId}/widgets`, widget),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["widgets", dashboardId] }),
  });
}

export function useUpdateWidgetLayout(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, layout }: { id: string; layout: Widget["layout"] }) =>
      api.patch<Widget>(`/api/widgets/${id}`, { layout }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["widgets", dashboardId] }),
  });
}

export function useDeleteWidget(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/widgets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["widgets", dashboardId] }),
  });
}

export function useWidgetData(widgetId: string) {
  return useQuery({
    queryKey: ["widget-data", widgetId],
    queryFn: () => api.get<{ rows: unknown[]; total: number }>(`/api/widgets/${widgetId}/data`),
    refetchInterval: 30_000,
  });
}
