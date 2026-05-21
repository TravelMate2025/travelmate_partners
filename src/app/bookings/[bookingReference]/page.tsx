"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { PartnerShell } from "@/components/common/partner-shell";
import { usePartnerAccess } from "@/components/common/use-partner-access";
import { bookingsClient } from "@/modules/bookings/bookings-client";
import type { BookingRecord, BookingStatus } from "@/modules/bookings/contracts";

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
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  params: Promise<{ bookingReference: string }>;
};

export default function BookingDetailPage({ params }: Props) {
  const { bookingReference } = use(params);
  const { user, loading } = usePartnerAccess();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !bookingReference) return;
    let active = true;
    setBusy(true);
    setError("");
    bookingsClient
      .getBooking(user.id, bookingReference)
      .then((data) => { if (active) setBooking(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load booking."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user, bookingReference]);

  if (loading || busy) {
    return (
      <main className="tm-page">
        <div className="tm-shell tm-panel mx-auto max-w-3xl p-6">
          <p className="text-sm text-slate-600">Loading booking details...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tm-page">
        <div className="tm-shell mx-auto max-w-3xl">
          <div className="tm-panel p-6">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <Link href="/bookings" className="tm-btn tm-btn-outline mt-4 inline-block">
              Back to Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) return null;

  return (
    <PartnerShell
      title={booking.bookingReference}
      description={`${booking.listingKind === "stay" ? "Stay" : "Transfer"} booking detail`}
      headerExtra={
        <div className="tm-inline-actions">
          <Link href="/bookings" className="tm-btn tm-btn-outline">
            Back to Bookings
          </Link>
        </div>
      }
    >
      {/* Status banner */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4">
        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusBadgeClass(booking.status)}`}>
          {booking.status}
        </span>
        <span className="text-sm text-slate-600">
          Created {formatDateTime(booking.createdAt)}
        </span>
      </div>

      {/* Core details */}
      <section className="tm-panel p-6">
        <h2 className="tm-section-title">Booking Details</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">{booking.bookingReference}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing</dt>
            <dd className="mt-1 text-sm text-slate-900">{booking.listingName || booking.listingId}</dd>
            <dd className="text-xs capitalize text-slate-500">{booking.listingKind}</dd>
          </div>
          {booking.checkInDate && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-in</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(booking.checkInDate)}</dd>
            </div>
          )}
          {booking.checkOutDate && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Check-out</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(booking.checkOutDate)}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guests</dt>
            <dd className="mt-1 text-sm text-slate-900">{booking.guestCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gross Amount</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(booking.grossAmount, booking.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDateTime(booking.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      {/* Room selections */}
      {booking.roomSelections && booking.roomSelections.length > 0 && (
        <section className="tm-panel p-6">
          <h2 className="tm-section-title">Room Selections</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {booking.roomSelections.map((room) => (
              <div key={room.roomId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{room.name}</p>
                  <p className="text-xs text-slate-500">Occupancy: {room.occupancy}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">×{room.quantity}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(room.baseRate, booking.currency)} / night</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {booking.ratePlanSelection ? (
        <section className="tm-panel p-6">
          <h2 className="tm-section-title">Selected Rate Plan</h2>
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {booking.ratePlanSelection.name} ({booking.ratePlanSelection.code})
            </p>
            <p className="mt-1 text-xs text-slate-600 capitalize">
              {booking.ratePlanSelection.planType.replace("_", " ")} · Policy v{booking.ratePlanSelection.policyVersion}
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Cancellation: {booking.ratePlanSelection.cancellationPolicy.policyType.replace(/_/g, " ")}
            </p>
            <p className="text-sm text-slate-700">
              Penalty: {booking.ratePlanSelection.cancellationPolicy.penaltyType.replace(/_/g, " ")}
            </p>
            {booking.ratePlanSelection.cancellationPolicy.cancelDeadlineHoursBeforeCheckIn !== null ? (
              <p className="text-sm text-slate-700">
                Free cancel cutoff: {booking.ratePlanSelection.cancellationPolicy.cancelDeadlineHoursBeforeCheckIn}h before check-in
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {booking.cancellationOptionSelection ? (
        <section className="tm-panel p-6">
          <h2 className="tm-section-title">Selected Cancellation Option</h2>
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{booking.cancellationOptionSelection.label}</p>
            <p className="mt-1 text-xs text-slate-600">
              {booking.cancellationOptionSelection.optionId ?? booking.cancellationOptionSelection.id}
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Price selected:{" "}
              {formatCurrency(
                booking.cancellationOptionSelection.amount,
                booking.cancellationOptionSelection.currency ?? booking.currency,
              )}
            </p>
            {booking.cancellationOptionSelection.policyCopy ? (
              <p className="mt-2 text-sm text-slate-700">
                Policy: {booking.cancellationOptionSelection.policyCopy}
              </p>
            ) : null}
            {booking.cancellationOptionSelection.cancellationCutoffAtLocal ? (
              <p className="mt-1 text-xs text-slate-500">
                Cutoff: {booking.cancellationOptionSelection.cancellationCutoffAtLocal}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </PartnerShell>
  );
}
