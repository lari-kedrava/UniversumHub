import type { CreateTaskInput, Task, TaskExecutionEvent, UpdateTaskInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";
import type { TaskListFilters } from "./tasks.service.js";

const toTask = (row: Record<string, unknown>): Task => ({
  id: row.id as string, companyId: row.company_id as string, projectId: row.project_id as string | null, clientId: row.client_id as string | null,
  title: row.title as string, taskScope: row.task_scope as Task["taskScope"], taskType: row.task_type as string, description: row.description as string | null,
  status: row.status as Task["status"], priority: row.priority as Task["priority"], assigneeId: row.assignee_id as string | null, assigneeStaffId: row.assignee_staff_id as string | null,
  assigneeIds: (row.assignee_ids as string[]) ?? [], location: row.location as string | null, createdBy: row.created_by as string,
  startsAt: row.starts_at as string | null, dueAt: row.due_at as string | null, completedAt: row.completed_at as string | null, createdAt: row.created_at as string, updatedAt: row.updated_at as string,
  executionStartedAt: row.execution_started_at as string | null, executionLastStartedAt: row.execution_last_started_at as string | null, executionPausedAt: row.execution_paused_at as string | null,
  executionCompletedAt: row.execution_completed_at as string | null, activeSeconds: Number(row.active_seconds ?? 0), pausedSeconds: Number(row.paused_seconds ?? 0),
});

const toEvent = (row: Record<string, unknown>): TaskExecutionEvent => ({ id: row.id as string, taskId: row.task_id as string, actorId: row.actor_id as string, action: row.action as TaskExecutionEvent["action"], previousStatus: row.previous_status as string | null, newStatus: row.new_status as string, occurredAt: row.occurred_at as string, activeSeconds: Number(row.active_seconds ?? 0), pausedSeconds: Number(row.paused_seconds ?? 0), note: row.note as string | null });
const db = (input: CreateTaskInput | UpdateTaskInput) => ({ project_id: input.projectId, client_id: input.clientId, title: input.title, task_scope: input.taskScope, task_type: input.taskType, description: input.description, status: input.status, priority: input.priority, assignee_id: input.assigneeId, assignee_staff_id: input.assigneeStaffId, assignee_ids: input.assigneeIds, location: input.location, starts_at: input.startsAt, due_at: input.dueAt, completed_at: "completedAt" in input ? input.completedAt : undefined });
const secondsBetween = (from: string | null | undefined, to: Date) => from ? Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 1000)) : 0;

export const tasksRepository = {
  async findAll(companyId: string, filters: TaskListFilters = {}) {
    let query = supabaseAdmin.from("tasks").select("*").eq("company_id", companyId).order("starts_at", { ascending: true, nullsFirst: false });
    if (filters.start) query = query.gte("starts_at", filters.start);
    if (filters.end) query = query.lte("starts_at", filters.end);
    if (filters.types?.length) query = query.in("task_type", filters.types);
    if (filters.statuses?.length) query = query.in("status", filters.statuses);
    if (filters.assigneeStaffIds?.length) query = query.in("assignee_staff_id", filters.assigneeStaffIds);
    if (filters.scopes?.length) query = query.in("task_scope", filters.scopes);
    if (filters.clientIds?.length) query = query.in("client_id", filters.clientIds);
    if (filters.priorities?.length) query = query.in("priority", filters.priorities);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toTask);
  },
  async findById(companyId: string, id: string) { const { data, error } = await supabaseAdmin.from("tasks").select("*").eq("company_id", companyId).eq("id", id).maybeSingle(); if (error) throw error; return data ? toTask(data) : null; },
  async create(companyId: string, createdBy: string, input: CreateTaskInput) { const { data, error } = await supabaseAdmin.from("tasks").insert({ ...db(input), company_id: companyId, created_by: createdBy, task_scope: input.taskScope ?? "internal", task_type: input.taskType ?? "general", assignee_ids: input.assigneeIds ?? [], status: input.status ?? "todo", priority: input.priority ?? "medium" }).select("*").single(); if (error) throw error; return toTask(data); },
  async update(companyId: string, id: string, input: UpdateTaskInput) { const { data, error } = await supabaseAdmin.from("tasks").update(db(input)).eq("company_id", companyId).eq("id", id).select("*").maybeSingle(); if (error) throw error; return data ? toTask(data) : null; },
  async delete(companyId: string, id: string) { const { error } = await supabaseAdmin.from("tasks").delete().eq("company_id", companyId).eq("id", id); if (error) throw error; },
  async history(companyId: string, taskId: string) { const { data, error } = await supabaseAdmin.from("task_execution_events").select("*").eq("company_id", companyId).eq("task_id", taskId).order("occurred_at", { ascending: false }); if (error) throw error; return (data ?? []).map(toEvent); },
  async execute(companyId: string, taskId: string, actorId: string, action: "check_in" | "pause" | "resume" | "check_out", note?: string) {
    const task = await this.findById(companyId, taskId); if (!task) return null;
    const now = new Date(); const at = now.toISOString(); let patch: Record<string, unknown> = {}; let nextStatus: Task["status"];
    let active = task.activeSeconds; let paused = task.pausedSeconds;
    if (action === "check_in") { if (!["backlog", "todo", "pending", "pendente"].includes(task.status)) throw new Error("A tarefa só pode receber check-in antes de iniciar."); nextStatus = "in_progress"; patch = { status: nextStatus, execution_started_at: task.executionStartedAt ?? at, execution_last_started_at: at, execution_paused_at: null }; }
    else if (action === "pause") { if (!["in_progress", "andamento"].includes(task.status)) throw new Error("A tarefa precisa estar em andamento para ser pausada."); active += secondsBetween(task.executionLastStartedAt, now); nextStatus = "paused"; patch = { status: nextStatus, active_seconds: active, execution_paused_at: at, execution_last_started_at: null }; }
    else if (action === "resume") { if (!["paused", "pausada"].includes(task.status)) throw new Error("A tarefa precisa estar pausada para ser retomada."); paused += secondsBetween(task.executionPausedAt, now); nextStatus = "in_progress"; patch = { status: nextStatus, paused_seconds: paused, execution_last_started_at: at, execution_paused_at: null }; }
    else { if (!["in_progress", "andamento", "paused", "pausada"].includes(task.status)) throw new Error("A tarefa precisa estar em execução ou pausada para finalizar."); if (["in_progress", "andamento"].includes(task.status)) active += secondsBetween(task.executionLastStartedAt, now); else paused += secondsBetween(task.executionPausedAt, now); nextStatus = "done"; patch = { status: nextStatus, active_seconds: active, paused_seconds: paused, completed_at: at, execution_completed_at: at, execution_last_started_at: null, execution_paused_at: null }; }
    const { data, error } = await supabaseAdmin.from("tasks").update(patch).eq("company_id", companyId).eq("id", taskId).select("*").single(); if (error) throw error;
    const event = await supabaseAdmin.from("task_execution_events").insert({ company_id: companyId, task_id: taskId, actor_id: actorId, action, previous_status: task.status, new_status: nextStatus, occurred_at: at, active_seconds: active, paused_seconds: paused, note: note ?? null }).select("*").single(); if (event.error) throw event.error;
    return { task: toTask(data), event: toEvent(event.data) };
  },
};
