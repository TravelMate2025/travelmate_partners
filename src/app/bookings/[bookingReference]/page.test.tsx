import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookingDetailPage from "./page";
import type { BookingRecord } from "@/modules/bookings/contracts";

const getBookingMock = vi.fn();
const usePartnerAccessMock = vi.fn();

vi.mock("@/components/common/partner-shell", () => ({
  PartnerShell: ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/use-partner-access", () => ({
  usePartnerAccess: () => usePartnerAccessMock(),
}));

vi.mock("@/modules/bookings/bookings-client", () => ({
  bookingsClient: {
    getBooking: (...args: unknown[]) => getBookingMock(...args),
  },
}));

function baseBooking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "bkr-1",
    bookingReference: "BOOK-DETAIL-001",
    listingKind: "stay",
    listingId: "stay-1",
    listingName: "Detail Villa",
    checkInDate: "2026-06-20",
    checkOutDate: "2026-06-22",
    pickupAt: null,
    guestCount: 2,
    roomSelections: [],
    ratePlanSelection: null,
    cancellationOptionSelection: null,
    grossAmount: 100000,
    currency: "NGN",
    status: "confirmed",
    bookingStatus: "confirmed",
    paymentStatus: "succeeded",
    serviceStatus: "pending_completion",
    operationalStatus: "confirmed",
    refundTimeline: [],
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

async function renderPage(bookingReference = "BOOK-DETAIL-001") {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <BookingDetailPage params={Promise.resolve({ bookingReference })} />
      </Suspense>,
    );
  });
}

describe("BookingDetailPage", () => {
  beforeEach(() => {
    getBookingMock.mockReset();
    usePartnerAccessMock.mockReset();
    usePartnerAccessMock.mockReturnValue({ user: { id: "101" }, loading: false, error: null });
  });

  it("does not render a rate plan section, even when ratePlanSelection is present (legacy/stale field)", async () => {
    getBookingMock.mockResolvedValue(
      baseBooking({
        ratePlanSelection: {
          ratePlanId: "rp-1",
          code: "deal_non_ref",
          name: "Non-refundable Deal",
          planType: "non_refundable",
          policyVersion: 1,
          cancellationPolicy: {
            policyType: "non_refundable",
            penaltyType: "full_charge",
            cancelDeadlineHoursBeforeCheckIn: null,
            penaltyPercent: null,
            penaltyAmount: null,
          },
        },
        cancellationOptionSelection: {
          optionId: "NON_CANCELLABLE",
          label: "Non-cancellable",
          amount: 100000,
          currency: "NGN",
          policyCopy: "Cancel any time for a 60% refund.",
        },
      }),
    );
    await renderPage();
    await waitFor(() => expect(screen.getByRole("heading", { name: "BOOK-DETAIL-001" })).toBeInTheDocument());

    expect(screen.queryByText("Selected Rate Plan")).not.toBeInTheDocument();
    expect(screen.queryByText(/full charge/i)).not.toBeInTheDocument();
    expect(screen.getByText("Selected Cancellation Option")).toBeInTheDocument();
    expect(screen.getByText(/Cancel any time for a 60% refund\./)).toBeInTheDocument();
  });

  it("renders no refund section when refundTimeline is empty", async () => {
    getBookingMock.mockResolvedValue(baseBooking({ refundTimeline: [] }));
    await renderPage();
    await waitFor(() => expect(screen.getByRole("heading", { name: "BOOK-DETAIL-001" })).toBeInTheDocument());
    expect(screen.queryByTestId("refund-timeline-section")).not.toBeInTheDocument();
  });

  it("renders a pending refund badge and amount for a cancelled booking with no explicit refund action yet", async () => {
    getBookingMock.mockResolvedValue(
      baseBooking({
        status: "cancelled",
        bookingStatus: "cancelled",
        operationalStatus: "cancelled",
        refundTimeline: [
          { status: "pending", amount: 60000, maxRefundableAmount: 60000, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" },
        ],
      }),
    );
    await renderPage();
    await waitFor(() => expect(screen.getByTestId("refund-timeline-section")).toBeInTheDocument());
    expect(screen.getByText("Refund pending")).toBeInTheDocument();
    expect(screen.getByText(/₦60,000/)).toBeInTheDocument();
  });

  it("renders the full timeline and settled badge once a refund has been settled", async () => {
    getBookingMock.mockResolvedValue(
      baseBooking({
        status: "refunded",
        bookingStatus: "refunded",
        operationalStatus: "refunded",
        refundTimeline: [
          { refundId: "rf_1", status: "requested", amount: 60000, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" },
          { refundId: "rf_1", status: "approved", amount: 60000, currency: "NGN", updatedAt: "2026-06-16T00:00:00Z" },
          { refundId: "rf_1", status: "settled", amount: 60000, currency: "NGN", updatedAt: "2026-06-17T00:00:00Z" },
        ],
      }),
    );
    await renderPage();
    await waitFor(() => expect(screen.getByTestId("refund-timeline-section")).toBeInTheDocument());
    expect(screen.getByText("Refund settled")).toBeInTheDocument();
    expect(screen.getByText("requested")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("renders a not-required badge with no amount for a payment-failed booking", async () => {
    getBookingMock.mockResolvedValue(
      baseBooking({
        status: "payment_failed",
        bookingStatus: "payment_failed",
        operationalStatus: "payment_failed",
        paymentStatus: "failed",
        refundTimeline: [{ status: "not_required", amount: 0, currency: "NGN", updatedAt: "2026-06-15T00:00:00Z" }],
      }),
    );
    await renderPage();
    await waitFor(() => expect(screen.getByTestId("refund-timeline-section")).toBeInTheDocument());
    expect(screen.getByText("No refund required")).toBeInTheDocument();
  });

  it("shows an error state when the booking fails to load", async () => {
    getBookingMock.mockRejectedValue(new Error("Booking record was not found."));
    await renderPage();
    await waitFor(() => expect(screen.getByText("Booking record was not found.")).toBeInTheDocument());
  });
});
