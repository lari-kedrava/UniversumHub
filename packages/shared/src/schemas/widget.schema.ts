import { z } from "zod";

export const widgetTypeSchema = z.enum([
  "table", "cards", "text", "image", "video", "agenda", "calendar",
  "indicator", "chart", "map", "list", "ranking", "notice", "clock",
  "html", "iframe", "rss",
]);

export const widgetLayoutSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});

export const widgetSchema = z.object({
  id: z.string().uuid(),
  dashboardId: z.string().uuid(),
  type: widgetTypeSchema,
  title: z.string().min(1).max(120),
  dataSourceId: z.string().uuid().optional(),
  settings: z.record(z.unknown()).default({}),
  layout: widgetLayoutSchema,
});

export const createWidgetInput = widgetSchema.omit({ id: true, dashboardId: true });
export const updateWidgetInput = createWidgetInput.partial();

export type CreateWidgetInput = z.infer<typeof createWidgetInput>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetInput>;
