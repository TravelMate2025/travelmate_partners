"use client";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";

type FeatureComingSoonProps = {
  title: string;
  description: string;
  highlights: string[];
};

export function FeatureComingSoon({ title, description, highlights }: FeatureComingSoonProps) {
  const { loading } = usePartnerAccess();

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title={title}
      description={description}
      headerExtra={
        <p className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Planned next
        </p>
      }
    >
      <section className="tm-panel p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Planned Scope</h2>
        <p className="tm-muted mt-1 text-sm">
          This module is scaffolded in navigation so the product shell is stable while we implement each flow.
        </p>

        <ul className="tm-highlight-list mt-4 space-y-2">
          {highlights.map((item) => (
            <li
              key={item}
              className="tm-highlight-item rounded-xl border px-3 py-2 text-sm text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </PartnerShell>
  );
}
