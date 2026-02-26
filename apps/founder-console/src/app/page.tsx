export default function FounderConsoleHome() {
  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <section className="mx-auto max-w-5xl px-8 py-24">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Founder Console</p>
        <h1 className="mt-3 text-4xl font-semibold">Operational Control Center</h1>
        <p className="mt-4 text-zinc-300">
          This shell will host app builder tools, tenant onboarding, token overrides, and
          deployment guardrails. Use this environment for internal workflows distinct from
          the client dashboard.
        </p>
      </section>
    </main>
  );
}
