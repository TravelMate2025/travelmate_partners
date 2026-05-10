"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { showToast } from "@/components/common/toast";
import { authClient } from "@/modules/auth/auth-client";
import { notificationsClient } from "@/modules/notifications/notifications-client";
import { maybeShowBrowserNotification } from "@/modules/notifications/realtime";

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
        label: "Wallet & Settlements",
        status: "live",
        match: (path) => path.startsWith("/wallet-payouts"),
      },
      {
        href: "/notifications",
        label: "Notifications",
        status: "live",
        match: (path) => path.startsWith("/notifications"),
      },
      {
        href: "/reports",
        label: "Reports",
        status: "live",
        match: (path) => path.startsWith("/reports"),
      },
      {
        href: "/api-access",
        label: "API Access",
        status: "live",
        match: (path) => path.startsWith("/api-access"),
      },
      {
        href: "/settings",
        label: "Support & Settings",
        status: "live",
        match: (path) => path.startsWith("/settings"),
      },
    ],
  },
];

export function PartnerShell({ title, description, children, headerExtra }: PartnerShellProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function pollNotifications() {
      try {
        const user = await authClient.me();
        const items = await notificationsClient.listNotifications(user.id);
        if (!active) {
          return;
        }

        const unread = items.filter((item) => !item.read).length;
        setUnreadCount(unread);

        const nextSeen = new Set(items.map((item) => item.id));
        if (!initialized.current) {
          seenNotificationIds.current = nextSeen;
          initialized.current = true;
          return;
        }

        const newItems = items.filter((item) => !seenNotificationIds.current.has(item.id));
        for (const item of [...newItems].reverse()) {
          showToast({ message: `${item.title}: ${item.message}` });
          maybeShowBrowserNotification(item);
        }
        seenNotificationIds.current = nextSeen;
      } catch {
        // Notifications should never block shell rendering.
      }
    }

    void pollNotifications();
    timer = setInterval(() => {
      void pollNotifications();
    }, 15000);

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  return (
    <main className="tm-page tm-grid-drift">
      <div className="tm-shell grid max-w-7xl gap-5 md:grid-cols-[250px_1fr]">
        <aside className="tm-panel tm-nav-panel p-4 md:sticky md:top-6 md:self-start">
          <p className="tm-kicker">TravelMate Partner</p>
          <nav className="mt-4 space-y-4">
            {NAV_SECTIONS.map((section) => (
              <section key={section.label}>
                <p className="mb-2 text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">
                  {section.label}
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                  {section.items.map((item, index) => {
                    const active = item.match(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`tm-nav-link flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold tm-animate-in ${
                          active
                            ? "tm-nav-link-active"
                            : "tm-nav-link-idle"
                        }`}
                        style={{ animationDelay: `${index * 35}ms` }}
                      >
                        <span>{item.label}</span>
                        {item.href === "/notifications" && unreadCount > 0 ? (
                          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        ) : null}
                        {item.status === "soon" ? (
                          <span className="tm-chip-soon rounded-full px-2 py-0.5 text-[10px] font-semibold">
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

        <div className="min-w-0 space-y-5">
          <section className="tm-panel tm-overview min-w-0 overflow-hidden p-6 tm-animate-in">
            <p className="tm-kicker">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
            <p className="tm-muted mt-2 max-w-2xl text-sm md:text-[0.95rem]">{description}</p>
            {headerExtra ? <div className="mt-3">{headerExtra}</div> : null}
          </section>
          {children}
        </div>
      </div>
    </main>
  );
}
