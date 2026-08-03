import type {
  BookingOperationalStatus,
  BookingRecord,
  BookingsApi,
  BookingsListResult,
  BookingStatus,
  CompletionResult,
  NoShowReport,
} from "@/modules/bookings/contracts";

const MOCK_STATUSES: BookingStatus[] = ["confirmed", "completed", "cancelled", "amended", "refunded"];
const MOCK_OPERATIONAL_STATUSES: BookingOperationalStatus[] = [
  "awaiting_payment",
  "confirmed",
  "completed",
  "cancelled",
  "amended",
  "refunded",
  "payment_failed",
];

function mockRecord(index: number): BookingRecord {
  const status = MOCK_STATUSES[index % MOCK_STATUSES.length];
  const operationalStatus = MOCK_OPERATIONAL_STATUSES[index % MOCK_OPERATIONAL_STATUSES.length];
  const base = new Date("2026-04-01");
  base.setDate(base.getDate() + index * 3);
  const checkIn = new Date(base);
  const checkOut = new Date(base);
  checkOut.setDate(checkOut.getDate() + 2);
  return {
    id: `pbr-mock${index.toString().padStart(4, "0")}`,
    bookingReference: `BOOK-MOCK-${(index + 1).toString().padStart(4, "0")}`,
    listingKind: index % 3 === 0 ? "transfer" : "stay",
    listingId: `listing-${index + 1}`,
    listingName: index % 3 === 0 ? `Airport Express ${index + 1}` : `Lekki Villa ${index + 1}`,
    checkInDate: index % 3 === 0 ? null : checkIn.toISOString().slice(0, 10),
    checkOutDate: index % 3 === 0 ? null : checkOut.toISOString().slice(0, 10),
    pickupAt: index % 3 === 0 ? new Date(base.getTime() - 2 * 60 * 60 * 1000).toISOString() : null,
    guestCount: (index % 4) + 1,
    roomSelections: null,
    ratePlanSelection:
      index % 2 === 0
        ? {
            ratePlanId: `rp-${index + 1}`,
            code: index % 4 === 0 ? "deal_non_ref" : "flex_48",
            name: index % 4 === 0 ? "Non-refundable Deal" : "Flexible 48h",
            planType: index % 4 === 0 ? "non_refundable" : "refundable",
            policyVersion: 1,
            cancellationPolicy: index % 4 === 0
              ? {
                  policyType: "non_refundable",
                  penaltyType: "full_charge",
                  cancelDeadlineHoursBeforeCheckIn: null,
                  penaltyPercent: null,
                  penaltyAmount: null,
                }
              : {
                  policyType: "free_cancellation_until",
                  penaltyType: "none",
                  cancelDeadlineHoursBeforeCheckIn: 48,
                  penaltyPercent: null,
                  penaltyAmount: null,
                },
          }
        : null,
    cancellationOptionSelection:
      index % 2 === 0
        ? {
            optionId: index % 4 === 0 ? "NON_CANCELLABLE" : "FREE_CANCELLATION",
            label: index % 4 === 0 ? "Non-cancellable" : "Free cancellation",
            amount: index % 4 === 0 ? (index + 1) * 32000 : (index + 1) * 35000,
            currency: "NGN",
            policyCopy:
              index % 4 === 0
                ? "Cancel any time for a 60% refund."
                : "Free cancellation up to 48 hours before check-in/pickup.",
          }
        : null,
    grossAmount: (index + 1) * 35000,
    currency: "NGN",
    status,
    bookingStatus: operationalStatus === "payment_failed" ? "payment_failed" : status,
    paymentStatus:
      operationalStatus === "awaiting_payment"
        ? null
        : operationalStatus === "payment_failed"
          ? "failed"
          : "succeeded",
    serviceStatus: operationalStatus === "awaiting_payment" || operationalStatus === "payment_failed" ? "pending_completion" : "completed",
    operationalStatus,
    createdAt: base.toISOString(),
    updatedAt: base.toISOString(),
  };
}

const ALL_RECORDS: BookingRecord[] = Array.from({ length: 25 }, (_, i) => mockRecord(i));

export const mockBookingsApi: BookingsApi = {
  async listBookings(_userId, options = {}) {
    const { page = 1, pageSize = 20, status, from, to } = options;
    let records = [...ALL_RECORDS];
    if (status) records = records.filter((r) => r.operationalStatus === status);
    if (from) records = records.filter((r) => r.createdAt >= from);
    if (to) records = records.filter((r) => r.createdAt <= `${to}T23:59:59`);
    const total = records.length;
    const offset = (page - 1) * pageSize;
    return {
      records: records.slice(offset, offset + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    } satisfies BookingsListResult;
  },

  async getBooking(_userId, bookingReference) {
    const record = ALL_RECORDS.find((r) => r.bookingReference === bookingReference);
    if (!record) {
      throw new Error("Booking record was not found.");
    }
    return record;
  },

  async reportNoShow(_userId, bookingReference, _reason = ""): Promise<NoShowReport> {
    return {
      bookingReference,
      reportedAt: new Date().toISOString(),
      serviceDate: new Date().toISOString().slice(0, 10),
    };
  },

  async markComplete(_userId, bookingReference): Promise<CompletionResult> {
    return {
      bookingReference,
      completedAt: new Date().toISOString(),
      serviceStatus: "completed",
    };
  },
};
