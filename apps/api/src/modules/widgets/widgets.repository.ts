/**
 * Repository do módulo Widgets. Cada widget pertence a um dashboard e
 * opcionalmente referencia uma fonte de dados (`data_source_id`).
 */
import type { CreateWidgetInput, UpdateWidgetInput } from "@universum/shared";
import { supabaseAdmin } from "../../config/supabase.js";

const TABLE = "widgets";

function toWidget(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    dashboardId: row.dashboard_id as string,
    type: row.type,
    title: row.title as string,
    dataSourceId: (row.data_source_id as string) ?? undefined,
    settings: row.settings as Record<string, unknown>,
    layout: {
      x: row.layout_x as number,
      y: row.layout_y as number,
      w: row.layout_w as number,
      h: row.layout_h as number,
    },
  };
}

export const widgetsRepository = {
  async findByDashboard(companyId: string, dashboardId: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .eq("dashboard_id", dashboardId);
    if (error) throw error;
    return (data ?? []).map(toWidget);
  },

  async findById(companyId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? toWidget(data) : null;
  },

  async create(companyId: string, dashboardId: string, input: CreateWidgetInput) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        company_id: companyId,
        dashboard_id: dashboardId,
        type: input.type,
        title: input.title,
        data_source_id: input.dataSourceId,
        settings: input.settings ?? {},
        layout_x: input.layout.x,
        layout_y: input.layout.y,
        layout_w: input.layout.w,
        layout_h: input.layout.h,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toWidget(data);
  },

  async update(companyId: string, id: string, input: UpdateWidgetInput) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.type !== undefined) patch.type = input.type;
    if (input.dataSourceId !== undefined) patch.data_source_id = input.dataSourceId;
    if (input.settings !== undefined) patch.settings = input.settings;
    if (input.layout !== undefined) {
      patch.layout_x = input.layout.x;
      patch.layout_y = input.layout.y;
      patch.layout_w = input.layout.w;
      patch.layout_h = input.layout.h;
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(patch)
      .eq("company_id", companyId)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toWidget(data) : null;
  },

  async delete(companyId: string, id: string) {
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("company_id", companyId).eq("id", id);
    if (error) throw error;
  },
};
