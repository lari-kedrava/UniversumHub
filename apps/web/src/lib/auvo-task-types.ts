export type TaskScope = "internal" | "external";

export const DEFAULT_AUVO_TASK_TYPES: Array<{ name: string; scope: TaskScope }> = [
  { name: "ATENDIMENTO REMOTO", scope: "internal" },
  { name: "TREINAMENTO REMOTO", scope: "internal" },
  { name: "COLETA DE EQUIPAMENTOS", scope: "external" },
  { name: "ENTREGA DE EQUIPAMENTOS", scope: "external" },
  { name: "ENTREGA DE INSUMOS", scope: "external" },
  { name: "INSTALAÇÃO", scope: "external" },
  { name: "MANUTENÇÃO", scope: "external" },
  { name: "TREINAMENTO PRESENCIAL", scope: "external" },
  { name: "VISITA TÉCNICA", scope: "external" },
];

export function normalizeTaskType(value?: string | null) {
  return (value ?? "").trim().toLocaleUpperCase("pt-BR");
}

export function scopeForTaskType(value: string | null | undefined, configured: Array<{ name: string; scope: TaskScope }>) {
  const normalized = normalizeTaskType(value);
  return configured.find((item) => normalizeTaskType(item.name) === normalized)?.scope ?? "external";
}
