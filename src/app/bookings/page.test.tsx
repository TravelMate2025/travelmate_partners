import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookingsPage from "./page";

const listBookingsMock = vi.fn();
const usePartnerAccessMock = vi.fn();

vi.mock("@/components/common/use-toast-message", () => ({
  useToastMessage: vi.fn(),
}));

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
    listBookings: (...args: unknown[]) => listBookingsMock(...args),
  },
}));

describe("BookingsPage", () => {
  beforeEach(() => {
    listBookingsMock.mockReset();
    usePartnerAccessMock.mockReset();
    usePartnerAccessMock.mockReturnValue({
      user: { id: "101" },
      loading: false,
      error: null,
    });
  });

  it("renders completed API-client bookings returned by the partner bookings API", async () => {
    listBookingsMock.mockResolvedValue({
      records: [
        {
          id: "bkr-1",
          bookingReference: "TRACE-BOOK-001",
          listingKind: "stay",
          listingId: "stay-1",
          listingName: "Trace Villa",
          checkInDate: "2026-06-20",
          checkOutDate: "2026-06-22",
          guestCount: 2,
          roomSelections: [],
          ratePlanSelection: null,
          refundTimeline: [],
          cancellationOptionSelection: null,
          grossAmount: 132000,
          currency: "NGN",
          status: "completed",
          bookingStatus: "completed",
          paymentStatus: "succeeded",
          operationalStatus: "completed",
          createdAt: "2026-06-09T21:18:25.130166+00:00",
          updatedAt: "2026-06-09T21:18:25.141213+00:00",
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });

    render(<BookingsPage />);

    await waitFor(() => expect(listBookingsMock).toHaveBeenCalledWith("101", expect.any(Object)));
    expect(screen.getByText("Booking History")).toBeInTheDocument();
    expect(screen.getByText("TRACE-BOOK-001")).toBeInTheDocument();
    expect(screen.getByText("Trace Villa")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("₦132,000")).toBeInTheDocument();
  });

  it("renders awaiting payment and payment failed lifecycle labels distinctly", async () => {
    listBookingsMock.mockResolvedValue({
      records: [
        {
          id: "bkr-2",
          bookingReference: "TRACE-BOOK-002",
          listingKind: "stay",
          listingId: "stay-2",
          listingName: "Pending Villa",
          checkInDate: "2026-06-20",
          checkOutDate: "2026-06-22",
          guestCount: 2,
          roomSelections: [],
          ratePlanSelection: null,
          refundTimeline: [],
          cancellationOptionSelection: null,
          grossAmount: 110000,
          currency: "NGN",
          status: "confirmed",
          bookingStatus: "confirmed",
          paymentStatus: null,
          operationalStatus: "awaiting_payment",
          createdAt: "2026-06-09T21:18:25.130166+00:00",
          updatedAt: "2026-06-09T21:18:25.141213+00:00",
        },
        {
          id: "bkr-3",
          bookingReference: "TRACE-BOOK-003",
          listingKind: "stay",
          listingId: "stay-3",
          listingName: "Failed Villa",
          checkInDate: "2026-06-20",
          checkOutDate: "2026-06-22",
          guestCount: 2,
          roomSelections: [],
          ratePlanSelection: null,
          refundTimeline: [],
          cancellationOptionSelection: null,
          grossAmount: 110000,
          currency: "NGN",
          status: "payment_failed",
          bookingStatus: "payment_failed",
          paymentStatus: "failed",
          operationalStatus: "payment_failed",
          createdAt: "2026-06-09T21:18:25.130166+00:00",
          updatedAt: "2026-06-09T21:18:25.141213+00:00",
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });

    render(<BookingsPage />);

    await waitFor(() => expect(listBookingsMock).toHaveBeenCalled());
    expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
  });
});
