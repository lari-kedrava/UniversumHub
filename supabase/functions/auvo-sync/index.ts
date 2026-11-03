import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RecordValue = Record<string, unknown>;
type SyncInput = { companyId?: string; start?: string; end?: string; full?: boolean };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const value = (row: RecordValue, ...keys: string[]) => keys.map((key) => row[key]).find((item) => item !== undefined && item !== null);
const text = (input: unknown) => input === undefined || input === null ? null : String(input);
const date = (input: unknown) => {
  if (!input) return null;
  const raw = String(input).trim();
  // A Auvo envia taskDate sem fuso; ele representa o horario local de Brasilia.
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}-03:00`;
  const parsed = new Date(zoned);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};
const nestedText = (row: RecordValue, ...keys: string[]) => {
  const direct = value(row, ...keys); if (direct !== undefined) return text(direct);
  for (const nested of [row.customer, row.client, row.userTo, row.responsible]) if (nested && typeof nested === "object") { const found = value(nested as RecordValue, ...keys); if (found !== undefined) return text(found); }
  return null;
};
const unwrap = (input: unknown): RecordValue => {
  if (!input || typeof input !== "object") return {};
  const row = input as RecordValue;
  const result = value(row, "result", "data", "entity");
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const resultRow = result as RecordValue;
    const entityList = value(resultRow, "entityList", "items");
    if (Array.isArray(entityList) && entityList[0] && typeof entityList[0] === "object") return entityList[0] as RecordValue;
    const entity = value(resultRow, "entity");
    if (entity && typeof entity === "object") return entity as RecordValue;
    return resultRow;
  }
  return row;
};
const tokenFrom = (input: unknown): string | null => {
  if (!input || typeof input !== "object") return null;
  const row = input as RecordValue;
  const direct = text(value(row, "token", "accessToken", "access_token", "jwt"));
  if (direct) return direct;
  for (const nested of Object.values(row)) {
    const found = tokenFrom(nested);
    if (found) return found;
  }
  return null;
};
const taskStatus = (input: unknown) => ({ 1: "opened", 2: "in_displacement", 3: "checked_in", 4: "checked_out", 5: "finished", 6: "paused" }[Number(input)] ?? text(input));

async function auvoToken(baseUrl: string) {
  // A documentação atual aceita um bearer token; mantém o login legado como alternativa.
  const direct = Deno.env.get("AUVO_BEARER_TOKEN") ?? Deno.env.get("AUVO_TOKEN");
  if (direct) return direct;
  const apiKey = Deno.env.get("AUVO_API_KEY"); const apiToken = Deno.env.get("AUVO_API_TOKEN");
  if (!apiKey && apiToken) return apiToken;
  if (!apiKey || !apiToken) throw new Error("Configure AUVO_BEARER_TOKEN ou AUVO_API_KEY/AUVO_API_TOKEN nos Secrets.");
  const response = await fetch(`${baseUrl}/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ apiKey, apiToken }) });
  if (!response.ok) throw new Error("Falha ao autenticar na Auvo.");
  const body = await response.json() as RecordValue;
  const token = tokenFrom(body);
  if (!token) return apiToken;
  if (!token) throw new Error("A Auvo não retornou um token de acesso.");
  return token;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!Deno.env.get("AUVO_SYNC_SECRET") || request.headers.get("x-auvo-sync-secret") !== Deno.env.get("AUVO_SYNC_SECRET")) return json({ error: "unauthorized" }, 401);
  const input = await request.json().catch(() => ({})) as SyncInput;
  if (!input.companyId || !input.start || !input.end) return json({ error: "companyId, start and end are required" }, 400);

  try {
    const baseUrl = Deno.env.get("AUVO_API_URL") ?? "https://api.auvo.com.br/v2";
    const token = await auvoToken(baseUrl);
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const customerNames = new Map<string, string>(); let page = 1; let written = 0; let detailed = 0; let removed = 0;
    const remoteTaskIds = new Set<string>();
    const paramFilter = encodeURIComponent(JSON.stringify({ startDate: input.start, endDate: input.end }));

    for (;;) {
      const response = await fetch(`${baseUrl}/tasks?paramFilter=${paramFilter}&page=${page}&pageSize=100&order=asc`, { headers });
      if (!response.ok) return json({ error: "auvo_tasks_query_failed", page }, 502);
      const body = await response.json() as RecordValue;
      const rows = (body.result as RecordValue | undefined)?.entityList;
      if (!Array.isArray(rows) || !rows.length) break;
      const taskIds = rows.map((row) => text(value(row as RecordValue, "taskID"))).filter((id): id is string => Boolean(id));
      taskIds.forEach((id) => remoteTaskIds.add(id));
      const { data: existing, error: existingError } = await admin.from("auvo_tasks").select("auvo_task_id,status,raw_payload,task_type,customer_address").eq("company_id", input.companyId).in("auvo_task_id", taskIds);
      if (existingError) return json({ error: "supabase_read_failed" }, 500);
      const existingById = new Map((existing ?? []).map((row) => [row.auvo_task_id as string, row.raw_payload as RecordValue]));
      const payload: RecordValue[] = [];

      for (const listed of rows as RecordValue[]) {
        const taskId = text(value(listed, "taskID")); if (!taskId) continue;
        let full = listed;
        const existingTask = (existing ?? []).find((item) => item.auvo_task_id === taskId) as RecordValue | undefined;
        const complete = existingById.get(taskId)?._universumComplete === true && Boolean(existingTask?.task_type) && Boolean(existingTask?.customer_address);
        const terminal = ["checked_out", "finished"].includes(String(existingTask?.status ?? "").toLowerCase());
        // A listagem da Auvo pode manter o status anterior. Enquanto a tarefa
        // estiver aberta, consulte o detalhe novamente para detectar a finalizacao.
        if (input.full || !complete || !terminal) {
          const detailResponse = await fetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, { headers });
          if (detailResponse.ok) { full = unwrap(await detailResponse.json()); detailed += 1; }
        }
        const customerId = text(value(full, "customerId") ?? value(listed, "customerId"));
        let customerName = nestedText(full, "customerName", "name", "description") ?? nestedText(listed, "customerName");
        if (!customerName && customerId) {
          customerName = customerNames.get(customerId) ?? null;
          if (!customerName) {
            const customerResponse = await fetch(`${baseUrl}/customers/${encodeURIComponent(customerId)}`, { headers });
            if (customerResponse.ok) { const customer = unwrap(await customerResponse.json()); customerName = nestedText(customer, "name", "description", "customerName"); if (customerName) customerNames.set(customerId, customerName); }
          }
        }
        payload.push({
          company_id: input.companyId, auvo_task_id: taskId,
          title: text(value(full, "orientation", "description", "taskDescription") ?? value(listed, "orientation")),
          status: taskStatus(value(full, "taskStatus") ?? value(listed, "taskStatus")),
          task_type: text(value(full, "taskTypeDescription") ?? value(listed, "taskTypeDescription") ?? value(full, "taskType")),
          service_type: text(value(full, "serviceType", "type") ?? value(listed, "serviceType")),
          scheduled_start_at: date(value(full, "taskDate") ?? value(listed, "taskDate")),
          scheduled_end_at: date(value(full, "endDate", "taskEndDate")),
          attendant_id: text(value(full, "idUserTo") ?? value(listed, "idUserTo")),
          attendant_name: text(value(full, "userToName") ?? value(listed, "userToName")),
          customer_id: customerId, customer_name: customerName,
          customer_address: nestedText(full, "address", "addressFormatted", "formattedAddress") ?? nestedText(listed, "address", "addressFormatted", "formattedAddress"),
          source_updated_at: date(value(full, "lastUpdate", "dateLastUpdate", "updatedAt")),
          raw_payload: { ...full, _universumComplete: true }, synced_at: new Date().toISOString(),
        });
      }
      if (payload.length) { const { error } = await admin.from("auvo_tasks").upsert(payload, { onConflict: "company_id,auvo_task_id" }); if (error) return json({ error: "supabase_write_failed" }, 500); written += payload.length; }
      if (rows.length < 100) break; page += 1;
    }

    // Reconciliar o intervalo evita manter tarefas que foram excluidas na Auvo,
    // mesmo quando o endpoint GetDeletedTasks nao devolve o registro removido.
    const rangeStart = date(`${input.start}T00:00:00`);
    const rangeEnd = date(`${input.end}T23:59:59.999`);
    if (rangeStart && rangeEnd) {
      const { data: localRows, error: localError } = await admin
        .from("auvo_tasks")
        .select("auvo_task_id")
        .eq("company_id", input.companyId)
        .gte("scheduled_start_at", rangeStart)
        .lte("scheduled_start_at", rangeEnd);
      if (localError) return json({ error: "supabase_reconcile_read_failed" }, 500);
      const staleIds = (localRows ?? [])
        .map((row) => String(row.auvo_task_id))
        .filter((id) => !remoteTaskIds.has(id));
      for (let index = 0; index < staleIds.length; index += 100) {
        const batch = staleIds.slice(index, index + 100);
        const { data: deleted, error } = await admin
          .from("auvo_tasks")
          .delete()
          .eq("company_id", input.companyId)
          .in("auvo_task_id", batch)
          .select("auvo_task_id");
        if (error) return json({ error: "supabase_reconcile_delete_failed" }, 500);
        removed += deleted?.length ?? 0;
      }
    }

    page = 1;
    for (;;) {
      const response = await fetch(`${baseUrl}/tasks/GetDeletedTasks?paramFilter=${paramFilter}&page=${page}&pageSize=100&order=asc`, { headers });
      if (!response.ok) return json({ error: "auvo_deleted_tasks_query_failed", page }, 502);
      const body = await response.json() as RecordValue;
      const rows = (body.result as RecordValue | undefined)?.entityList;
      if (!Array.isArray(rows) || !rows.length) break;
      const deletedIds = rows.map((row) => text(value(row as RecordValue, "taskID", "taskId", "id"))).filter((id): id is string => Boolean(id));
      if (deletedIds.length) {
        const { data: deleted, error } = await admin.from("auvo_tasks").delete().eq("company_id", input.companyId).in("auvo_task_id", deletedIds).select("auvo_task_id");
        if (error) return json({ error: "supabase_delete_failed" }, 500);
        removed += deleted?.length ?? 0;
      }
      if (rows.length < 100) break; page += 1;
    }
    return json({ ok: true, written, detailed, removed, start: input.start, end: input.end });
  } catch (error) { return json({ error: (error as Error).message }, 500); }
});
