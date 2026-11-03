import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors } });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: auth, error: authError } = await admin.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);

  const { data: appUser } = await admin.from("app_users").select("company_id,role,is_active").eq("auth_user_id", auth.user.id).maybeSingle();
  if (!appUser?.is_active) return json({ error: "forbidden" }, 403);
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (typeof input.start !== "string" || typeof input.end !== "string") return json({ error: "start_and_end_are_required" }, 400);
  const syncSecret = Deno.env.get("AUVO_SYNC_SECRET");
  if (!syncSecret) return json({ error: "sync_not_configured" }, 500);

  try {
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/auvo-sync`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-auvo-sync-secret": syncSecret },
      body: JSON.stringify({ companyId: appUser.company_id, start: input.start, end: input.end, full: input.full === true }),
    });
    const body = await response.text();
    return new Response(body || JSON.stringify({ error: "empty_sync_response" }), { status: response.status, headers: { "content-type": "application/json", ...cors } });
  } catch (error) {
    return json({ error: "sync_service_unavailable", message: error instanceof Error ? error.message : "Falha ao acessar o serviço de sincronização." }, 502);
  }
});
