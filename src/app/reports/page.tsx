"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import type { ReportsSummary } from "@/modules/reports/contracts";
import { reportsClient } from "@/modules/reports/reports-client";

type DateRangePreset = "7d" | "30d" | "90d" | "custom";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDays(baseIsoDate: string, days: number) {
  const date = new Date(baseIsoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage() {
  const { user, loading } = usePartnerAccess();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);
  const [csvPreview, setCsvPreview] = useState("");
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [toDate, setToDate] = useState(todayIsoDate());
  const [fromDate, setFromDate] = useState(shiftDays(todayIsoDate(), -29));

  const healthState = useMemo(() => {
    if (!summary) return "unknown";
    if (summary.missingFieldsCount === 0 && summary.pausedListingsCount === 0) return "healthy";
    if (summary.missingFieldsCount <= 2 && summary.pausedListingsCount <= 1) return "attention";
    return "risk";
  }, [summary]);

  useEffect(() => {
    const end = todayIsoDate();
    if (preset === "7d") {
      setToDate(end);
      setFromDate(shiftDays(end, -6));
    } else if (preset === "30d") {
      setToDate(end);
      setFromDate(shiftDays(end, -29));
    } else if (preset === "90d") {
      setToDate(end);
      setFromDate(shiftDays(end, -89));
    }
  }, [preset]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setBusy(true);
    setMessage("");
    reportsClient
      .getSummary(user.id, fromDate, toDate)
      .then((result) => { if (active) setSummary(result); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Failed to load reports."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [fromDate, toDate, user]);

  async function refreshSummary() {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await reportsClient.getSummary(user.id, fromDate, toDate);
      setSummary(result);
      setMessage("Report metrics refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to refresh reports.");
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const csv = await reportsClient.exportCsv(user.id, fromDate, toDate);
      setCsvPreview(csv);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `travelmate-reports-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setMessage("CSV exported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to export CSV.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading reports...</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerShell
      title="Reports & Insights"
      description="Track listing performance, monitor health indicators, and export reporting snapshots."
      headerExtra={
        <div className="tm-inline-actions">
          <button className="tm-btn tm-btn-primary" type="button" disabled={busy} onClick={() => void refreshSummary()}>
            Refresh Metrics
          </button>
          <button className="tm-btn tm-btn-accent" type="button" disabled={busy} onClick={() => void exportCsv()}>
            Export CSV
          </button>
          <Link href="/bookings" className="tm-btn tm-btn-outline">
            Booking History
          </Link>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Back to Dashboard
          </Link>
        </div>
      }
    >
      {/* Date Range */}
      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <h2 className="tm-section-title">Date Range</h2>
          <div className="tm-inline-actions">
            {(["7d", "30d", "90d", "custom"] as DateRangePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                className={`tm-tag-pill ${preset === p ? "tm-tag-pill-active" : ""}`}
                onClick={() => setPreset(p)}
              >
                {p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : p === "90d" ? "Last 90 days" : "Custom"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="tm-field">
            <span className="tm-field-label">From</span>
            <input
              className="tm-input"
              type="date"
              value={fromDate}
              onChange={(e) => { setPreset("custom"); setFromDate(e.target.value); }}
            />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">To</span>
            <input
              className="tm-input"
              type="date"
              value={toDate}
              onChange={(e) => { setPreset("custom"); setToDate(e.target.value); }}
            />
          </label>
        </div>
      </section>

      {/* Booking Activity */}
      <section className="tm-panel p-6">
        <div className="tm-section-head">
          <h2 className="tm-section-title">Booking Activity</h2>
          <Link href="/bookings" className="text-sm font-medium text-[#033D89] hover:underline">
            View all bookings →
          </Link>
        </div>
        {busy ? (
          <p className="mt-4 text-sm text-slate-500">Loading booking metrics...</p>
        ) : summary ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="tm-soft-note">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Total Bookings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalBookings}</p>
              </div>
              <div className="tm-soft-note">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Gross Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(summary.grossRevenue, "NGN")}
                </p>
              </div>
              <div className="tm-soft-note">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Cancellations</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.cancelledBookings}</p>
              </div>
              <div className="tm-soft-note">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Cancellation Rate</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.cancellationRate}%</p>
              </div>
            </div>

            {summary.topListings.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">Top Listings by Bookings</h3>
                <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {summary.topListings.map((listing, rank) => (
                    <div key={listing.listingId} className="flex items-center gap-4 px-4 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {rank + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{listing.listingName || listing.listingId}</p>
                        <p className="text-xs capitalize text-slate-500">{listing.listingKind}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-slate-900">
                        {listing.bookingCount} {listing.bookingCount === 1 ? "booking" : "bookings"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">No bookings in this period yet.</p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No booking data available.</p>
        )}
      </section>

      {/* Performance Metrics */}
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Performance Metrics</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Views</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary?.views ?? 0}</p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Impressions</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary?.impressions ?? 0}</p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Search Appearances</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary?.searchAppearances ?? 0}</p>
          </div>
        </div>
      </section>

      {/* Listing Health */}
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Listing Health</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Missing Fields</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary?.missingFieldsCount ?? 0}</p>
          </div>
          <div className="tm-soft-note">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Paused Listings</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary?.pausedListingsCount ?? 0}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          Health status:{" "}
          <span className="font-semibold">
            {healthState === "healthy" ? "Healthy" : healthState === "attention" ? "Needs Attention" : healthState === "risk" ? "At Risk" : "Unknown"}
          </span>
        </p>
      </section>

      {/* CSV Preview */}
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">CSV Preview</h2>
        <p className="tm-muted mt-1 text-sm">Most recent export content for quick verification.</p>
        <textarea className="tm-input mt-3 min-h-40 font-mono text-xs" value={csvPreview} readOnly />
      </section>

      {busy ? <p className="tm-soft-note text-sm">Updating reports...</p> : null}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </PartnerShell>
  );
}
