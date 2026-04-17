"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="tm-page">
      <div className="tm-shell grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="tm-panel tm-animate-in rounded-3xl p-6 md:p-10">
          <p className="tm-kicker mb-5 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1">
            TravelMate Partner
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
          <p className="tm-muted mt-2 text-sm md:text-base">{description}</p>
          <div className="mt-7 space-y-4">{children}</div>
          {footer ? <div className="tm-muted mt-6 text-sm">{footer}</div> : null}
        </section>

        <aside className="tm-animate-in rounded-3xl border border-[#1a4c93] bg-gradient-to-br from-[#05326f] via-[#0e3f85] to-[#154f9f] p-6 text-white shadow-[var(--tm-shadow-strong)] md:p-8">
          <h2 className="text-2xl font-semibold">Partner Security Checklist</h2>
          <ul className="mt-4 space-y-2 text-sm text-blue-100">
            <li>Verify email before first login.</li>
            <li>Use strong password policy (10+ chars).</li>
            <li>Review active sessions in account security.</li>
            <li>Reset password immediately if suspicious activity appears.</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-blue-50">
            Need onboarding context? See the <Link className="underline" href="/">home overview</Link>.
          </div>
        </aside>
      </div>
    </main>
  );
}
