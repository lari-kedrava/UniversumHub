import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const callsUrl = import.meta.env.VITE_CALLS_SUPABASE_URL;
const callsAnonKey = import.meta.env.VITE_CALLS_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("Variáveis do Supabase ausentes. Configure o .env do apps/web.");
}

export const isSupabaseConfigured = Boolean(url && anonKey);
export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;
export const isCallsSupabaseConfigured = Boolean(callsUrl && callsAnonKey);
export const callsSupabase = isCallsSupabaseConfigured ? createClient(callsUrl!, callsAnonKey!) : null;

export function getSupabaseClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function getCallsSupabaseClient() {
  if (!callsSupabase) throw new Error("Calls Supabase is not configured.");
  return callsSupabase;
}
