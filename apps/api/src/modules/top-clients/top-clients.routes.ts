import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../../config/supabase.js";
import { authHook } from "../../core/http/auth-hook.js";

const itemSchema = z.object({
  id: z.union([z.string(), z.number().int()]).optional(),
  name: z.string().trim().min(1).max(200),
  attendanceCount: z.number().int().min(0).default(0),
});

const saveSchema = z.object({
  priorities: z.array(itemSchema).max(50),
  recurring: z.array(itemSchema).max(10),
});

type RankingRow = {
  id: string | number;
  periodo_inicio: string;
  periodo_fim: string;
  posicao: number;
  cliente_nome: string;
  quantidade_atendimentos: number;
  calculado_em: string;
};

const toItem = (row: RankingRow) => ({
  id: row.id,
  name: row.cliente_nome,
  attendanceCount: row.quantidade_atendimentos,
  position: row.posicao,
});

async function latestRanking(table: "top10_clientes" | "top_prioridades", companyId: string) {
  const { data: latest, error: latestError } = await supabaseAdmin
    .from(table)
    .select("periodo_inicio,periodo_fim,calculado_em")
    .eq("company_id", companyId)
    .order("calculado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (!latest) return { rows: [] as RankingRow[], batch: null };

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id,periodo_inicio,periodo_fim,posicao,cliente_nome,quantidade_atendimentos,calculado_em")
    .eq("company_id", companyId)
    .eq("periodo_inicio", latest.periodo_inicio)
    .eq("periodo_fim", latest.periodo_fim)
    .eq("calculado_em", latest.calculado_em)
    .order("posicao", { ascending: true });
  if (error) throw error;
  return { rows: (data ?? []) as RankingRow[], batch: latest };
}

function unique(items: z.infer<typeof itemSchema>[]) {
  return [...new Map(items.map((item) => [item.name.toLocaleLowerCase("pt-BR"), item])).values()];
}

async function replaceLatestRanking(
  table: "top10_clientes" | "top_prioridades",
  companyId: string,
  items: z.infer<typeof itemSchema>[],
) {
  const current = await latestRanking(table, companyId);
  const now = new Date().toISOString();
  const batch = current.batch ?? { periodo_inicio: now, periodo_fim: now, calculado_em: now };

  // A lista e substituida como um lote: remocoes, inclusoes e a nova ordem
  // ficam exatamente iguais ao que todos os usuarios veem na interface.
  if (current.rows.length) {
    const { error } = await supabaseAdmin.from(table).delete().in("id", current.rows.map((row) => row.id));
    if (error) throw error;
  }
  if (!items.length) return;

  const { error } = await supabaseAdmin.from(table).insert(items.map((item, index) => ({
    company_id: companyId,
    periodo_inicio: batch.periodo_inicio,
    periodo_fim: batch.periodo_fim,
    posicao: index + 1,
    cliente_nome: item.name,
    quantidade_atendimentos: item.attendanceCount,
    calculado_em: batch.calculado_em,
  })));
  if (error) throw error;
}

export async function topClientsRoutes(server: FastifyInstance) {
  server.addHook("onRequest", authHook);

  server.get("/top-clients", async (request) => {
    const companyId = request.ctx!.companyId;
    const [priorities, recurring] = await Promise.all([
      latestRanking("top_prioridades", companyId),
      latestRanking("top10_clientes", companyId),
    ]);
    return {
      priorities: priorities.rows.map(toItem),
      recurring: recurring.rows.map(toItem),
    };
  });

  server.put("/top-clients", async (request) => {
    const companyId = request.ctx!.companyId;
    const input = saveSchema.parse(request.body);
    await Promise.all([
      replaceLatestRanking("top_prioridades", companyId, unique(input.priorities)),
      replaceLatestRanking("top10_clientes", companyId, unique(input.recurring).slice(0, 10)),
    ]);
    return { saved: true };
  });
}
