/**
 * Contexto de autenticação. Encapsula a sessão do Supabase e expõe
 * um hook simples (`useAuth`) para o restante da aplicação, evitando
 * que componentes falem diretamente com `supabase.auth`.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  profile: { name: string; role: string } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: user } = await supabase.from("app_users").select("name, role").eq("auth_user_id", data.session.user.id).maybeSingle();
        setProfile(user);
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (!newSession) setProfile(null);
      else { const { data: user } = await supabase.from("app_users").select("name, role").eq("auth_user_id", newSession.user.id).maybeSingle(); setProfile(user); }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await getSupabaseClient().auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
