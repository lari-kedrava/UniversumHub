/**
 * Tela de login. Autentica via Supabase Auth (email/senha). O
 * redirecionamento pós-login é tratado pelo `ProtectedRoute`.
 */
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "@/lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (signInError) {
      setError("Não foi possível entrar. Verifique suas credenciais.");
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-raised p-8"
      >
        <h1 className="mb-1 text-xl font-semibold text-white">Universum Hub</h1>
        <p className="mb-6 text-sm text-slate-400">Entre com sua conta para continuar.</p>

        <label className="mb-1 block text-sm text-slate-300">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        />

        <label className="mb-1 block text-sm text-slate-300">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
