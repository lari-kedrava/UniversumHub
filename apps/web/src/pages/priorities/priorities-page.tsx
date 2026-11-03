import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { UrgentAlertDisplay } from "@/components/urgent-alert-display";
import { api } from "@/lib/api";
import {
  emitUrgentClientAlert,
  getAlertSettings,
  removeAlertSound,
  saveAlertSound,
  type AlertSettings,
} from "@/lib/urgent-alert";

type AgendaAlert = { id: string; clientName: string; priority: string | null };
type AlertCustomization = { category: string; name: string; config?: Partial<AlertSettings> };

export function PrioritiesPage() {
  const cache = useQueryClient();
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(getAlertSettings);
  const [notice, setNotice] = useState("");
  const [soundName, setSoundName] = useState(localStorage.getItem("hub.alertSoundName") ?? "");
  const [status, setStatus] = useState("");

  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get<AgendaAlert[]>("/api/alerts"),
    refetchInterval: 10_000,
    staleTime: 0,
  });
  const savedSettings = useQuery({
    queryKey: ["customizations"],
    queryFn: () => api.get<AlertCustomization[]>("/api/customizations"),
  });

  useEffect(() => {
    const saved = savedSettings.data?.find((item) => item.category === "alert_settings" && item.name === "global")?.config;
    if (!saved) return;
    const next = { ...getAlertSettings(), ...saved } as AlertSettings;
    setAlertSettings(next);
    localStorage.setItem("hub.alertSettings", JSON.stringify(next));
  }, [savedSettings.data]);

  async function saveSettings() {
    localStorage.setItem("hub.alertSettings", JSON.stringify(alertSettings));
    try {
      await api.post("/api/customizations", { category: "alert_settings", name: "global", config: alertSettings });
      await cache.invalidateQueries({ queryKey: ["customizations"] });
      setStatus("Configuração salva para todo o sistema.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  }

  async function chooseSound(file?: File) {
    if (!file) return;
    if (file.size > 10_000_000) return setStatus("Escolha um áudio de até 10 MB.");
    try {
      await saveAlertSound(file);
      setSoundName(file.name);
      setStatus("Áudio salvo.");
    } catch {
      setStatus("Não foi possível salvar o áudio.");
    }
  }

  function testAlert() {
    void saveSettings();
    void emitUrgentClientAlert({ name: alerts.data?.[0]?.clientName ?? "Cliente de teste", priorityLevel: "urgent" }, setNotice);
    window.setTimeout(() => setNotice(""), alertSettings.duration * 1000);
  }

  return (
    <div className="space-y-6">
      <UrgentAlertDisplay message={notice} settings={alertSettings} onDismiss={() => setNotice("")} />
      <header className="flex items-center gap-3">
        <BellRing className="h-6 w-6 text-red-400" />
        <h1 className="text-xl font-semibold text-white">Prioridades</h1>
      </header>

      <details open className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <summary className="cursor-pointer font-semibold text-white">Configurar alerta</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input type="checkbox" checked={alertSettings.enabled} onChange={(event) => setAlertSettings({ ...alertSettings, enabled: event.target.checked })} />
            Alertas habilitados
          </label>
          <label className="text-sm text-slate-300">Layout
            <select value={alertSettings.layout} onChange={(event) => setAlertSettings({ ...alertSettings, layout: event.target.value as AlertSettings["layout"] })} className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-white">
              <option value="alert1">Alerta 1</option><option value="alert2">Alerta 2</option><option value="alert3">Alerta 3</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Duração
            <select value={alertSettings.duration} onChange={(event) => setAlertSettings({ ...alertSettings, duration: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-white">
              {[3, 6, 10, 15, 30].map((seconds) => <option key={seconds} value={seconds}>{seconds} segundos</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">Quantidade de alertas por cliente
            <input type="number" min={1} max={10} value={alertSettings.repeatCount} onChange={(event) => setAlertSettings({ ...alertSettings, repeatCount: Math.min(10, Math.max(1, Number(event.target.value))) })} className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Intervalo entre alertas (minutos)
            <input type="number" min={1} max={1440} value={alertSettings.repeatIntervalMinutes} onChange={(event) => setAlertSettings({ ...alertSettings, repeatIntervalMinutes: Math.min(1440, Math.max(1, Number(event.target.value))) })} className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-white" />
          </label>
          <label className="text-sm text-slate-300">Efeito visual
            <select value={alertSettings.visualEffect} onChange={(event) => setAlertSettings({ ...alertSettings, visualEffect: event.target.value as AlertSettings["visualEffect"] })} className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-white">
              <option value="pulse">Pulsar</option><option value="flash">Piscar</option><option value="steady">Fixo</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Som personalizado
            <input type="file" accept="audio/*" onChange={(event) => void chooseSound(event.target.files?.[0])} className="mt-2 block w-full text-sm" />
            <span className="mt-1 block text-xs text-slate-400">{soundName || "Som padrão"}</span>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveSettings()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Salvar configuração</button>
          <button type="button" onClick={testAlert} className="rounded-lg border border-brand-500 px-4 py-2 text-sm text-brand-300">Testar alerta</button>
          <button type="button" onClick={() => void removeAlertSound().then(() => { setSoundName(""); setStatus("Som padrão restaurado."); })} className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300">Usar som padrão</button>
        </div>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </details>

      <section className="rounded-xl border border-surface-border bg-surface-raised p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Clientes urgentes</h2>
          <button type="button" onClick={() => void alerts.refetch()} className="rounded-lg border border-cyan-500/60 px-3 py-2 text-sm text-cyan-200">Atualizar</button>
        </div>
        <div className="space-y-2">
          {(alerts.data ?? []).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
              <strong className="text-white">{alert.clientName}</strong>
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Urgente</span>
            </div>
          ))}
          {!alerts.isLoading && !(alerts.data ?? []).length && <p className="py-4 text-sm text-slate-400">Nenhum cliente urgente.</p>}
        </div>
      </section>
    </div>
  );
}
