import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!Deno.env.get("AUVO_WEBHOOK_SECRET") || request.headers.get("x-auvo-webhook-secret") !== Deno.env.get("AUVO_WEBHOOK_SECRET")) return json({ error: "unauthorized" }, 401);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null; const companyId = request.headers.get("x-company-id");
  if (!payload || !companyId) return json({ error: "invalid_payload" }, 400);
  const eventId = String(payload.eventId ?? payload.id ?? crypto.randomUUID()); const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await admin.from("auvo_webhook_events").upsert({ event_id: eventId, company_id: companyId, payload }); if (error) return json({ error: "store_failed" }, 500);
  return json({ ok: true }, 202);
});
