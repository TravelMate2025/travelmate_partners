"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PartnerShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  headerExtra?: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  status?: "live" | "soon";
  match: (path: string) => boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Core",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        status: "live",
        match: (path) => path === "/dashboard",
      },
      {
        href: "/onboarding",
        label: "Onboarding",
        status: "live",
        match: (path) => path === "/onboarding",
      },
      {
        href: "/verification",
        label: "Verification",
        status: "live",
        match: (path) => path === "/verification",
      },
    ],
  },
  {
    label: "Listings",
    items: [
      {
        href: "/stays",
        label: "Stays",
        status: "live",
        match: (path) => path.startsWith("/stays"),
      },
      {
        href: "/transfers",
        label: "Transfers",
        status: "live",
        match: (path) => path.startsWith("/transfers"),
      },
      {
        href: "/pricing-availability",
        label: "Pricing & Availability",
        status: "live",
        match: (path) => path.startsWith("/pricing-availability"),
      },
      {
        href: "/transfer-pricing-scheduling",
        label: "Transfer Pricing",
        status: "live",
        match: (path) => path.startsWith("/transfer-pricing-scheduling"),
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/wallet-payouts",
        label: "Wallet & Payouts",
        status: "soon",
        match: (path) => path.startsWith("/wallet-payouts"),
      },
      {
        href: "/notifications",
        label: "Notifications",
        status: "soon",
        match: (path) => path.startsWith("/notifications"),
      },
      {
        href: "/reports",
        label: "Reports",
        status: "soon",
        match: (path) => path.startsWith("/reports"),
      },
      {
        href: "/settings",
        label: "Support & Settings",
        status: "soon",
        match: (path) => path.startsWith("/settings"),
      },
    ],
  },
];

export function PartnerShell({ title, description, children, headerExtra }: PartnerShellProps) {
  const pathname = usePathname();

  return (
    <main className="tm-page">
      <div className="tm-shell grid max-w-6xl gap-5 md:grid-cols-[220px_1fr]">
        <aside className="tm-panel p-4 md:sticky md:top-6 md:self-start">
          <p className="tm-kicker">TravelMate Partner</p>
          <nav className="mt-4 space-y-4">
            {NAV_SECTIONS.map((section) => (
              <section key={section.label}>
                <p className="mb-2 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">
                  {section.label}
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                  {section.items.map((item) => {
                    const active = item.match(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                          active
                            ? "border-[#1d4f9a] bg-blue-50 text-[#1a3f76]"
                            : "border-slate-200/90 bg-white/70 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.status === "soon" ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Soon
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <div className="space-y-5">
          <section className="tm-panel p-6">
            <p className="tm-kicker">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="tm-muted mt-1 text-sm">{description}</p>
            {headerExtra ? <div className="mt-3">{headerExtra}</div> : null}
          </section>
          {children}
        </div>
      </div>
    </main>
  );
}
