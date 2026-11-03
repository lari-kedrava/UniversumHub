import { supabaseAdmin } from "../../config/supabase.js";

export type AgendaAlert = {
  id: string;
  clientName: string;
  priority: string | null;
};

export const alertsRepository = {
  async findAll(companyId: string): Promise<AgendaAlert[]> {
    const { data, error } = await supabaseAdmin
      .from("alertas")
      .select("id,cliente,prioridade")
      .order("id", { ascending: false });

    if (error) throw error;
    const alerts = (data ?? [])
      .map((row) => ({
        id: String(row.id),
        clientName: String(row.cliente ?? "").trim(),
        priority: row.prioridade ? String(row.prioridade) : null,
      }))
      .filter((alert) => alert.clientName.length > 0);

    if (!alerts.length) return [];
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const dayStart = new Date(`${today}T00:00:00-03:00`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("auvo_tasks")
      .select("customer_name,status,attendant_id,attendant_name,scheduled_start_at")
      .eq("company_id", companyId)
      .in("customer_name", [...new Set(alerts.map((alert) => alert.clientName))])
      .gte("scheduled_start_at", dayStart.toISOString())
      .lt("scheduled_start_at", dayEnd.toISOString())
      .order("scheduled_start_at", { ascending: false });
    if (tasksError) throw tasksError;

    const normalize = (name: string) => name.trim().toLocaleLowerCase("pt-BR");
    const tasksByClient = new Map<string, (typeof tasks)>();
    for (const task of tasks ?? []) {
      const name = String(task.customer_name ?? "").trim();
      if (!name) continue;
      const key = normalize(name);
      tasksByClient.set(key, [...(tasksByClient.get(key) ?? []), task]);
    }
    const staleIds = alerts.filter((alert) => {
      const clientTasks = tasksByClient.get(normalize(alert.clientName)) ?? [];
      return clientTasks.some((task) => {
        const assigned = Boolean(String(task.attendant_id ?? "").trim() || String(task.attendant_name ?? "").trim());
        return assigned || task.status !== "opened";
      });
    }).map((alert) => alert.id);

    if (staleIds.length) {
      const { error: deleteError } = await supabaseAdmin.from("alertas").delete().in("id", staleIds);
      if (deleteError) throw deleteError;
    }
    const stale = new Set(staleIds);
    return alerts.filter((alert) => !stale.has(alert.id));
  },
};
