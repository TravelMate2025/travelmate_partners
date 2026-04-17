"use client";

import { useState } from "react";

import type { PartnerDashboardData, QuickActionType } from "@/modules/dashboard/contracts";

type DashboardWidgetsProps = {
  data: PartnerDashboardData;
  onNavigateQuickAction: (action: QuickActionType) => void;
  onRefresh: () => Promise<void>;
};

function toneClass(level: "info" | "warning" | "success") {
  if (level === "warning") {
    return "border-amber-200 bg-amber-50/90 text-amber-900";
  }

  if (level === "success") {
    return "border-emerald-200 bg-emerald-50/90 text-emerald-900";
  }

  return "border-blue-200 bg-blue-50/90 text-blue-900";
}

export function DashboardWidgets({
  data,
  onNavigateQuickAction,
  onRefresh,
}: DashboardWidgetsProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setBusy(true);
    setMessage("");

    try {
      await onRefresh();
      setMessage("Dashboard refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to refresh dashboard.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="grid gap-3 md:grid-cols-3">
        <article className="tm-panel p-5">
          <p className="tm-kicker">Active Listings</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.activeListings}</p>
        </article>

        <article className="tm-panel p-5">
          <p className="tm-kicker">Pending Approvals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.pendingApprovals}</p>
        </article>

        <article className="tm-panel p-5">
          <p className="tm-kicker">Total Views</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{data.summary.totalViews}</p>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="tm-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
            <button className="tm-btn tm-btn-outline" disabled={busy} onClick={() => void refresh()} type="button">
              Refresh
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {data.alerts.map((alert) => (
              <li key={alert.id} className={`rounded-xl border px-3 py-2 text-sm ${toneClass(alert.level)}`}>
                {alert.message}
              </li>
            ))}
          </ul>
        </div>

        <div className="tm-panel p-5">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <button
              className="tm-btn tm-btn-primary w-full"
              disabled={busy}
              onClick={() => onNavigateQuickAction("add_stay")}
              type="button"
            >
              Add Stay
            </button>
            <button
              className="tm-btn tm-btn-accent w-full"
              disabled={busy}
              onClick={() => onNavigateQuickAction("add_transfer")}
              type="button"
            >
              Add Transfer
            </button>
            <button
              className="tm-btn tm-btn-outline w-full"
              disabled={busy}
              onClick={() => onNavigateQuickAction("update_availability")}
              type="button"
            >
              Update Availability
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
        </div>
      </section>

      <section className="tm-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        <ul className="mt-3 space-y-2">
          {data.recentActivity.map((activity) => (
            <li key={activity.id} className="rounded-xl border border-slate-200/90 bg-white/70 px-3 py-2">
              <p className="text-sm text-slate-800">{activity.title}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
        {data.recentActivity.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No recent activity yet.</p>
        ) : null}
      </section>
    </>
  );
}
