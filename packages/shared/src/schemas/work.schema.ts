import { z } from "zod/v3";

const optionalUuid = z.string().uuid().nullable().optional();

export const projectSchema = z.object({
  id: z.string().uuid(), companyId: z.string().uuid(), name: z.string().min(2).max(160),
  description: z.string().max(4000).nullable().optional(), status: z.enum(["planned", "active", "on_hold", "completed", "archived"]),
  color: z.string().max(20), ownerId: optionalUuid, startsAt: z.string().datetime().nullable().optional(), dueAt: z.string().datetime().nullable().optional(),
  createdAt: z.string(), updatedAt: z.string(),
});
export const createProjectInput = projectSchema.pick({ name: true, description: true, status: true, color: true, ownerId: true, startsAt: true, dueAt: true }).partial({ status: true, color: true, ownerId: true, startsAt: true, dueAt: true });
export const updateProjectInput = createProjectInput.partial();

export const taskSchema = z.object({
  id: z.string().uuid(), companyId: z.string().uuid(), projectId: optionalUuid, clientId: optionalUuid,
  title: z.string().min(2).max(240), taskScope: z.enum(["internal", "external"]), taskType: z.string().min(2).max(120),
  description: z.string().max(8000).nullable().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "paused", "done", "cancelled"]), priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeId: optionalUuid, assigneeStaffId: optionalUuid, assigneeIds: z.array(z.string().uuid()).default([]), location: z.string().max(300).nullable().optional(), createdBy: z.string().uuid(), startsAt: z.string().datetime().nullable().optional(), dueAt: z.string().datetime().nullable().optional(), completedAt: z.string().datetime().nullable().optional(), executionStartedAt: z.string().datetime().nullable().optional(), executionLastStartedAt: z.string().datetime().nullable().optional(), executionPausedAt: z.string().datetime().nullable().optional(), executionCompletedAt: z.string().datetime().nullable().optional(), activeSeconds: z.number().int().nonnegative().default(0), pausedSeconds: z.number().int().nonnegative().default(0),
  createdAt: z.string(), updatedAt: z.string(),
});
export const createTaskInput = taskSchema.pick({ projectId: true, clientId: true, title: true, taskScope: true, taskType: true, description: true, status: true, priority: true, assigneeId: true, assigneeStaffId: true, assigneeIds: true, location: true, startsAt: true, dueAt: true }).partial({ projectId: true, clientId: true, taskScope: true, taskType: true, description: true, status: true, priority: true, assigneeId: true, assigneeStaffId: true, assigneeIds: true, location: true, startsAt: true, dueAt: true });
export const updateTaskInput = createTaskInput.extend({ completedAt: z.string().datetime().nullable().optional() }).partial();

export const calendarEventSchema = z.object({
  id: z.string().uuid(), companyId: z.string().uuid(), title: z.string().min(2).max(240), description: z.string().max(8000).nullable().optional(),
  startsAt: z.string().datetime(), endsAt: z.string().datetime(), allDay: z.boolean(), color: z.string().max(20), ownerId: z.string().uuid(), createdAt: z.string(), updatedAt: z.string(),
});
export const createCalendarEventInput = calendarEventSchema.pick({ title: true, description: true, startsAt: true, endsAt: true, allDay: true, color: true }).partial({ description: true, allDay: true, color: true });
export const updateCalendarEventInput = createCalendarEventInput.partial();

export type Project = z.infer<typeof projectSchema>; export type CreateProjectInput = z.infer<typeof createProjectInput>; export type UpdateProjectInput = z.infer<typeof updateProjectInput>;
export type Task = z.infer<typeof taskSchema>; export type CreateTaskInput = z.infer<typeof createTaskInput>; export type UpdateTaskInput = z.infer<typeof updateTaskInput>;
export const taskExecutionEventSchema = z.object({ id: z.string().uuid(), taskId: z.string().uuid(), actorId: z.string().uuid(), action: z.enum(["check_in", "pause", "resume", "check_out", "reopen"]), previousStatus: z.string().nullable(), newStatus: z.string(), occurredAt: z.string(), activeSeconds: z.number().int().nonnegative(), pausedSeconds: z.number().int().nonnegative(), note: z.string().nullable().optional() });
export type TaskExecutionEvent = z.infer<typeof taskExecutionEventSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>; export type CreateCalendarEventInput = z.infer<typeof createCalendarEventInput>; export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventInput>;
