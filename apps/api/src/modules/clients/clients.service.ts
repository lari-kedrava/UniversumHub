/**
 * Service Layer do módulo Clientes.
 *
 * Aqui vivem as regras de negócio (ex: validações que dependem de
 * estado, orquestração entre repositories, disparo de eventos).
 * As rotas (`clients.routes.ts`) nunca falam diretamente com o
 * Repository — sempre passam pelo Service.
 */
import type { CreateClientInput, UpdateClientInput } from "@universum/shared";
import { alertClientsRepository, clientsRepository } from "./clients.repository.js";

function createClientsService(repository: typeof clientsRepository) {
  return {
  list(companyId: string) {
    return repository.findAll(companyId);
  },

  get(companyId: string, id: string) {
    return repository.findById(companyId, id);
  },

  create(companyId: string, input: CreateClientInput) {
    // Exemplo de regra de negócio: normalizar e-mail antes de persistir.
    const normalized = { ...input, email: input.email?.toLowerCase().trim() };
    return repository.create(companyId, normalized);
  },

  update(companyId: string, id: string, input: UpdateClientInput) {
    return repository.update(companyId, id, input);
  },

  remove(companyId: string, id: string) {
    return repository.delete(companyId, id);
  },

  clearPriorities(companyId: string) {
    return repository.clearPriorities(companyId);
  },
  };
}

export const clientsService = createClientsService(clientsRepository);
export const alertClientsService = createClientsService(alertClientsRepository);
