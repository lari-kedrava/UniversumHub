import type { CreateTaskInput, UpdateTaskInput } from "@universum/shared";
import { projectsRepository } from "../projects/projects.repository.js"; import { tasksRepository } from "./tasks.repository.js";
export type TaskListFilters = {
  types?: string[];
  statuses?: string[];
  assigneeStaffIds?: string[];
  scopes?: string[];
  clientIds?: string[];
  priorities?: string[];
  start?: string;
  end?: string;
};

export const tasksService = {
  list: (companyId: string, filters?: TaskListFilters) => tasksRepository.findAll(companyId, filters), get: (companyId: string, id: string) => tasksRepository.findById(companyId, id),
  async create(companyId: string, userId: string, input: CreateTaskInput) { if (input.projectId && !(await projectsRepository.findById(companyId, input.projectId))) throw new Error("Project not found."); return tasksRepository.create(companyId, userId, input); },
  update: (companyId: string, id: string, input: UpdateTaskInput) => tasksRepository.update(companyId, id, input), remove: (companyId: string, id: string) => tasksRepository.delete(companyId, id),
  execute: (companyId: string, taskId: string, userId: string, action: "check_in" | "pause" | "resume" | "check_out", note?: string) => tasksRepository.execute(companyId, taskId, userId, action, note),
  history: (companyId: string, taskId: string) => tasksRepository.history(companyId, taskId),
};
