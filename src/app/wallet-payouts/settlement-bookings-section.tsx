"use client";

import { FormEvent } from "react";

import type { EligibleBooking } from "@/modules/wallet-payouts/contracts";

type Props = {
  eligibleBookings: EligibleBooking[];
  selectedBookingRefs: string[];
  eligibleSearch: string;
  eligiblePage: number;
  eligibleCount: number;
  eligiblePageCount: number;
  eligibleHasNext: boolean;
  eligibleHasPrevious: boolean;
  allOnPageSelected: boolean;
  busy: boolean;
  onCreateSettlements: (event: FormEvent<HTMLFormElement>) => void;
  onSetSelectedBookingRefs: React.Dispatch<React.SetStateAction<string[]>>;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
};

export function SettlementBookingsSection({
  eligibleBookings,
  selectedBookingRefs,
  eligibleSearch,
  eligiblePage,
  eligibleCount,
  eligiblePageCount,
  eligibleHasNext,
  eligibleHasPrevious,
  allOnPageSelected,
  busy,
  onCreateSettlements,
  onSetSelectedBookingRefs,
  onSearchChange,
  onPageChange,
}: Props) {
  return (
    <form className="tm-panel p-6" onSubmit={onCreateSettlements}>
      <h2 className="tm-section-title">Create Settlements From Completed Bookings</h2>
      <p className="tm-muted mt-1 text-sm">Select one or more completed bookings from the server-provided list.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="tm-input max-w-sm"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search booking reference"
          value={eligibleSearch}
        />
        <span className="text-xs text-slate-500">Selected: {selectedBookingRefs.length}</span>
        <button
          className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
          disabled={eligibleBookings.length === 0}
          onClick={() => {
            if (allOnPageSelected) {
              onSetSelectedBookingRefs((current) =>
                current.filter((ref) => !eligibleBookings.some((item) => item.bookingReference === ref)),
              );
              return;
            }
            onSetSelectedBookingRefs((current) => {
              const next = new Set(current);
              for (const item of eligibleBookings) next.add(item.bookingReference);
              return Array.from(next);
            });
          }}
          type="button"
        >
          {allOnPageSelected ? "Clear Page" : "Select Page"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {eligibleBookings.length === 0 ? (
          <p className="text-sm text-slate-500">No eligible completed bookings found.</p>
        ) : (
          eligibleBookings.map((booking) => (
            <label
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              key={booking.id}
            >
              <span className="text-sm text-slate-700">
                {booking.bookingReference} • {booking.grossAmount} {booking.currency}
                {booking.sourceCurrency && booking.sourceCurrency !== booking.currency ? (
                  <span className="ml-1 text-xs text-slate-500">
                    (from {booking.sourceGrossAmount} {booking.sourceCurrency})
                  </span>
                ) : null}
                {booking.convertible === false ? (
                  <span className="ml-1 text-xs text-rose-700">
                    {booking.conversionError ?? "Missing conversion rate"}
                  </span>
                ) : null}
              </span>
              <input
                checked={selectedBookingRefs.includes(booking.bookingReference)}
                disabled={booking.convertible === false}
                onChange={(e) => {
                  onSetSelectedBookingRefs((current) =>
                    e.target.checked
                      ? [...current, booking.bookingReference]
                      : current.filter((ref) => ref !== booking.bookingReference),
                  );
                }}
                type="checkbox"
              />
            </label>
          ))
        )}
      </div>

      {eligibleCount > 0 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {eligiblePage} of {eligiblePageCount} ({eligibleCount} booking{eligibleCount === 1 ? "" : "s"})
          </span>
          <div className="flex gap-2">
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              disabled={!eligibleHasPrevious}
              onClick={() => onPageChange(Math.max(1, eligiblePage - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="tm-btn tm-btn-outline px-3 py-1.5 text-xs"
              disabled={!eligibleHasNext}
              onClick={() => onPageChange(Math.min(eligiblePageCount, eligiblePage + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <div className="tm-inline-actions mt-4">
        <button className="tm-btn tm-btn-accent" disabled={busy || selectedBookingRefs.length === 0} type="submit">
          Create Settlements
        </button>
      </div>
    </form>
  );
}
