import type { CreateDashboardInput, UpdateDashboardInput } from "@universum/shared";
import { dashboardsRepository } from "./dashboards.repository.js";

export const dashboardsService = {
  list: (companyId: string) => dashboardsRepository.findAll(companyId),
  get: (companyId: string, id: string) => dashboardsRepository.findById(companyId, id),
  create: (companyId: string, ownerId: string, input: CreateDashboardInput) =>
    dashboardsRepository.create(companyId, ownerId, input),
  update: (companyId: string, id: string, input: UpdateDashboardInput) =>
    dashboardsRepository.update(companyId, id, input),
  remove: (companyId: string, id: string) => dashboardsRepository.delete(companyId, id),
};
