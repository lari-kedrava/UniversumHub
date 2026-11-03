import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("APP_ORIGIN") ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const cors = (request: Request) => {
  const origin = request.headers.get("origin");
  return {
    "access-control-allow-origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
};
const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(request) } });
const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);
  const authorization = request.headers.get("authorization");
  if (!authorization) return json(request, { error: "unauthorized" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: auth, error: authError } = await admin.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
  if (authError || !auth.user) return json(request, { error: "unauthorized" }, 401);
  const { data: appUser } = await admin.from("app_users").select("company_id,is_active").eq("auth_user_id", auth.user.id).maybeSingle();
  if (!appUser?.is_active) return json(request, { error: "forbidden" }, 403);
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (typeof input.start !== "string" || typeof input.end !== "string") return json(request, { error: "start and end are required" }, 400);
  let query = admin.from("auvo_tasks").select("auvo_task_id,status,task_type,service_type,scheduled_start_at,scheduled_end_at,attendant_id,attendant_name,customer_id,customer_name,title:customer_address").eq("company_id", appUser.company_id).gte("scheduled_start_at", input.start).lte("scheduled_start_at", input.end).order("scheduled_start_at");
  const types = list(input.taskTypes); const statuses = list(input.statuses); const attendants = list(input.attendantIds); const services = list(input.serviceTypes);
  if (types.length) query = query.in("task_type", types);
  if (statuses.length) query = query.in("status", statuses);
  if (attendants.length) query = query.in("attendant_id", attendants);
  if (services.length) query = query.in("service_type", services);
  const { data, error } = await query;
  if (error) return json(request, { error: "agenda_query_failed" }, 500);
  return json(request, { data: data ?? [] });
});
