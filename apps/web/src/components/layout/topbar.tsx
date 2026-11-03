import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/query-client";
import { getSupabaseClient } from "@/lib/supabase";

type FunctionErrorDetails = { message?: string; error?: string };

async function readFunctionErrorDetails(error: unknown): Promise<FunctionErrorDetails | null> {
  const context = (error as { context?: unknown }).context;
  if (!context) return null;

  if (context instanceof Response) {
    return context.json().catch(() => null) as Promise<FunctionErrorDetails | null>;
  }

  if (typeof context === "object") {
    const value = context as FunctionErrorDetails & { json?: () => Promise<unknown> };
    if (typeof value.json === "function") {
      return value.json().then((body) => body as FunctionErrorDetails).catch(() => null);
    }
    return value;
  }

  return null;
}

export function Topbar() {
  const { session, profile, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const syncAuvo = async () => {
    setSyncing(true);
    try {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
      const { data, error } = await getSupabaseClient().functions.invoke("auvo-sync-request", { body: { start: today, end: today, full: false } });
      if (error) {
        const details = await readFunctionErrorDetails(error);
        const code = details?.error;
        const friendly: Record<string, string> = {
          sync_not_configured: "A sincronização Auvo ainda não foi configurada no servidor.",
          insufficient_permission: "Seu usuário não tem permissão para sincronizar a Auvo.",
          unauthorized: "Sua sessão expirou. Entre novamente no sistema.",
          sync_service_unavailable: "O serviço de sincronização está indisponível no momento.",
        };
        throw new Error((code && friendly[code]) || details?.message || code || error.message);
      }
      if (!data?.ok) throw new Error(data?.message ?? data?.error ?? "Não foi possível sincronizar a Auvo.");
      await queryClient.invalidateQueries();
      window.alert("Sincronização concluída com sucesso.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Nao foi possivel sincronizar a Auvo.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{session?.user.email}</span>
        {["owner", "admin"].includes(profile?.role ?? "") && <button
          type="button"
          onClick={syncAuvo}
          disabled={syncing}
          title="Atualiza os dados visíveis do Supabase"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Auvo"}
        </button>}
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  );
}
