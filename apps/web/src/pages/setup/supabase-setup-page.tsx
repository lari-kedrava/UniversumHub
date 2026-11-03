/** Tela exibida antes da primeira configuração do Supabase. */
export function SupabaseSetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-6 text-slate-100">
      <section className="w-full max-w-2xl rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-2xl">
        <p className="mb-2 text-sm font-medium text-brand-300">Primeira configuração</p>
        <h1 className="text-2xl font-semibold text-white">Conecte o Universum Hub ao Supabase</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">O sistema precisa das chaves do Supabase antes de exibir a tela de login.</p>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-300">
          <li>Crie um projeto gratuito no Supabase.</li>
          <li>Copie <code className="rounded bg-white/10 px-1.5 py-0.5">.env.example</code> para <code className="rounded bg-white/10 px-1.5 py-0.5">apps/web/.env</code>.</li>
          <li>Preencha <code className="rounded bg-white/10 px-1.5 py-0.5">VITE_SUPABASE_URL</code> e <code className="rounded bg-white/10 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>.</li>
          <li>Reinicie o comando <code className="rounded bg-white/10 px-1.5 py-0.5">pnpm dev</code>.</li>
        </ol>
      </section>
    </main>
  );
}
