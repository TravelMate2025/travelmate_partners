import { apiRequest } from "@/lib/http-client";
import type { BookingRecord, BookingsApi, BookingsListResult, CompletionResult, NoShowReport } from "@/modules/bookings/contracts";

type Envelope<T> = { data: T };

export const realBookingsApi: BookingsApi = {
  async listBookings(userId, options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.pageSize) params.set("pageSize", String(options.pageSize));
    if (options.status) params.set("status", options.status);
    if (options.from) params.set("from", options.from);
    if (options.to) params.set("to", options.to);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<Envelope<BookingsListResult>>(
      `/partners/${userId}/bookings${suffix}`,
    );
    return response.data;
  },

  async getBooking(userId, bookingReference) {
    const response = await apiRequest<Envelope<BookingRecord>>(
      `/partners/${userId}/bookings/${bookingReference}`,
    );
    return response.data;
  },

  async reportNoShow(userId, bookingReference, reason = "") {
    const response = await apiRequest<Envelope<NoShowReport>>(
      `/partners/${userId}/bookings/${bookingReference}/no-show`,
      { method: "POST", body: { reason } },
    );
    return response.data;
  },

  async markComplete(userId, bookingReference) {
    const response = await apiRequest<Envelope<CompletionResult>>(
      `/partners/${userId}/bookings/${bookingReference}/complete`,
      { method: "POST" },
    );
    return response.data;
  },
};
