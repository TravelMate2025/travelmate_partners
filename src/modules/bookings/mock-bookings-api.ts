import type { BookingRecord, BookingsApi, BookingsListResult, BookingStatus } from "@/modules/bookings/contracts";

const MOCK_STATUSES: BookingStatus[] = ["confirmed", "completed", "cancelled", "amended", "refunded"];

function mockRecord(index: number): BookingRecord {
  const status = MOCK_STATUSES[index % MOCK_STATUSES.length];
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
    guestCount: (index % 4) + 1,
    roomSelections: null,
    grossAmount: (index + 1) * 35000,
    currency: "NGN",
    status,
    createdAt: base.toISOString(),
    updatedAt: base.toISOString(),
  };
}

const ALL_RECORDS: BookingRecord[] = Array.from({ length: 25 }, (_, i) => mockRecord(i));

export const mockBookingsApi: BookingsApi = {
  async listBookings(_userId, options = {}) {
    const { page = 1, pageSize = 20, status, from, to } = options;
    let records = [...ALL_RECORDS];
    if (status) records = records.filter((r) => r.status === status);
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
};
