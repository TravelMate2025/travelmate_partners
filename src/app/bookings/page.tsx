"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { useToastMessage } from "@/components/common/use-toast-message";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { bookingsClient } from "@/modules/bookings/bookings-client";
import type { BookingRecord, BookingStatus, BookingsListResult } from "@/modules/bookings/contracts";

const STATUS_OPTIONS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Amended", value: "amended" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

function statusBadgeClass(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    confirmed: "bg-green-100 text-green-800",
    amended: "bg-blue-100 text-blue-800",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-yellow-100 text-yellow-800",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookingsPage() {
  const { user, loading } = usePartnerAccess();
  const [result, setResult] = useState<BookingsListResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useToastMessage(message);

  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setBusy(true);
    setMessage("");
    bookingsClient
      .listBookings(user.id, {
        page,
        pageSize: 20,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      })
      .then((data) => { if (active) setResult(data); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Failed to load bookings."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user, page, statusFilter, fromDate, toDate]);

  function applyFilters() {
    setPage(1);
  }

  function clearFilters() {
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  if (loading) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-5xl p-6">
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  const pagination = result?.pagination;

  return (
    <PartnerShell
      title="Booking History"
      description="Browse and filter all bookings made against your listings."
      headerExtra={
        <div className="tm-inline-actions">
          <Link href="/reports" className="tm-btn tm-btn-outline">
            Reports
          </Link>
          <Link href="/dashboard" className="tm-btn tm-btn-outline">
            Dashboard
          </Link>
        </div>
      }
    >
      {/* Filters */}
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Filters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="tm-field">
            <span className="tm-field-label">Status</span>
            <select
              className="tm-input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | ""); setPage(1); }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <label className="tm-field">
            <span className="tm-field-label">From</span>
            <input
              className="tm-input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label className="tm-field">
            <span className="tm-field-label">To</span>
            <input
              className="tm-input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="button" className="tm-btn tm-btn-primary flex-1" onClick={applyFilters}>
              Apply
            </button>
            <button type="button" className="tm-btn tm-btn-outline" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* Booking List */}
      <section className="tm-panel">
        {busy ? (
          <div className="p-6">
            <p className="text-sm text-slate-500">Loading bookings...</p>
          </div>
        ) : !result || result.records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No bookings found</p>
            <p className="mt-1 text-sm text-slate-500">
              {statusFilter || fromDate || toDate
                ? "Try adjusting your filters."
                : "Bookings from API clients will appear here once created."}
            </p>
            {(statusFilter || fromDate || toDate) && (
              <button type="button" className="tm-btn tm-btn-outline mt-4" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Listing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Check-in</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Guests</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.records.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} />
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <p className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.totalPages} — {pagination.total} total
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="tm-btn tm-btn-outline"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="tm-btn tm-btn-outline"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </PartnerShell>
  );
}

function BookingRow({ booking }: { booking: BookingRecord }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3 font-mono text-xs text-slate-800">{booking.bookingReference}</td>
      <td className="px-4 py-3">
        <p className="max-w-[160px] truncate text-slate-900">{booking.listingName || booking.listingId}</p>
        <p className="text-xs capitalize text-slate-500">{booking.listingKind}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">{formatDate(booking.checkInDate)}</td>
      <td className="px-4 py-3 text-slate-700">{booking.guestCount}</td>
      <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(booking.grossAmount, booking.currency)}</td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(booking.status)}`}>
          {booking.status}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{formatDate(booking.createdAt)}</td>
      <td className="px-4 py-3">
        <Link
          href={`/bookings/${booking.bookingReference}`}
          className="text-xs font-medium text-[#033D89] hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
