import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Row = Record<string, unknown>;
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const asText = (value: unknown) => value === undefined || value === null ? null : String(value);
const get = (row: Row, ...keys: string[]) => keys.map((key) => row[key]).find((value) => value !== undefined && value !== null);
const list = (body: Row) => ((body.result as Row | undefined)?.entityList ?? body.result ?? body.data ?? []) as Row[];

async function token(baseUrl: string) {
  const direct = Deno.env.get("AUVO_BEARER_TOKEN") ?? Deno.env.get("AUVO_TOKEN"); if (direct) return direct;
  const apiKey = Deno.env.get("AUVO_API_KEY"); const apiToken = Deno.env.get("AUVO_API_TOKEN");
  if (!apiKey || !apiToken) throw new Error("Auvo Secrets ausentes.");
  const login = await fetch(`${baseUrl}/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ apiKey, apiToken }) });
  const body = await login.json() as Row; const value = asText(get(body, "token", "accessToken", "access_token")); if (!login.ok || !value) throw new Error("Autenticação Auvo falhou."); return value;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!Deno.env.get("AUVO_SYNC_SECRET") || request.headers.get("x-auvo-sync-secret") !== Deno.env.get("AUVO_SYNC_SECRET")) return response({ error: "unauthorized" }, 401);
  const input = await request.json().catch(() => ({})) as { companyId?: string; resources?: string[] };
  if (!input.companyId) return response({ error: "companyId is required" }, 400);
  const requested = input.resources?.length ? input.resources : ["users", "customers", "tasktypes", "teams", "products", "services", "equipments", "tickets", "questionnaires"];
  const tableByResource: Record<string, string> = { users: "auvo_users", customers: "auvo_customers", tasktypes: "auvo_task_types", teams: "auvo_teams" };
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const run = await admin.from("auvo_sync_runs").insert({ company_id: input.companyId, resource: requested.join(","), status: "running" }).select("id").single();
  try {
    const baseUrl = Deno.env.get("AUVO_API_URL") ?? "https://api.auvo.com.br/v2"; const bearer = await token(baseUrl); const headers = { authorization: `Bearer ${bearer}` }; let processed = 0;
    for (const resource of requested) {
      const records: Row[] = []; for (let page = 1; ; page += 1) { const api = await fetch(`${baseUrl}/${resource}?page=${page}&pageSize=100&order=asc`, { headers }); if (!api.ok) throw new Error(`Falha ao consultar ${resource}.`); const items = list(await api.json() as Row); records.push(...items); if (items.length < 100) break; }
      if (resource === "users") await admin.from(tableByResource[resource]).upsert(records.map((row) => ({ company_id: input.companyId, auvo_user_id: asText(get(row, "idUser", "userId", "id")), name: asText(get(row, "name", "userName")), email: asText(get(row, "email")), is_active: get(row, "active", "isActive") as boolean | null, raw_payload: row, synced_at: new Date().toISOString() })).filter((row) => row.auvo_user_id), { onConflict: "company_id,auvo_user_id" });
      else if (resource === "customers") await admin.from(tableByResource[resource]).upsert(records.map((row) => ({ company_id: input.companyId, auvo_customer_id: asText(get(row, "idCustomer", "customerId", "id")), name: asText(get(row, "name", "description")), document: asText(get(row, "document", "cpfCnpj")), email: asText(get(row, "email")), phone: asText(get(row, "phone", "cellPhone")), address: asText(get(row, "address")), raw_payload: row, synced_at: new Date().toISOString() })).filter((row) => row.auvo_customer_id), { onConflict: "company_id,auvo_customer_id" });
      else if (resource === "tasktypes") await admin.from(tableByResource[resource]).upsert(records.map((row) => ({ company_id: input.companyId, auvo_task_type_id: asText(get(row, "id", "taskTypeId", "idTaskType")), description: asText(get(row, "description", "name")), raw_payload: row, synced_at: new Date().toISOString() })).filter((row) => row.auvo_task_type_id), { onConflict: "company_id,auvo_task_type_id" });
      else if (resource === "teams") await admin.from(tableByResource[resource]).upsert(records.map((row) => ({ company_id: input.companyId, auvo_team_id: asText(get(row, "id", "teamId", "idTeam")), name: asText(get(row, "name", "description")), raw_payload: row, synced_at: new Date().toISOString() })).filter((row) => row.auvo_team_id), { onConflict: "company_id,auvo_team_id" });
      else await admin.from("auvo_catalog_items").upsert(records.map((row) => ({ company_id: input.companyId, resource_type: resource, auvo_item_id: asText(get(row, "id", "code", "idProduct", "idService", "idEquipment", "ticketId")), name: asText(get(row, "name", "description", "title")), raw_payload: row, synced_at: new Date().toISOString() })).filter((row) => row.auvo_item_id), { onConflict: "company_id,resource_type,auvo_item_id" });
      processed += records.length;
    }
    await admin.from("auvo_sync_runs").update({ status: "success", records_processed: processed, finished_at: new Date().toISOString() }).eq("id", run.data?.id); return response({ ok: true, processed, resources: requested });
  } catch (error) { await admin.from("auvo_sync_runs").update({ status: "failed", error: (error as Error).message, finished_at: new Date().toISOString() }).eq("id", run.data?.id); return response({ error: (error as Error).message }, 500); }
});
