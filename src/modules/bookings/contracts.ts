export type BookingStatus =
  | "confirmed"
  | "amended"
  | "cancelled"
  | "completed"
  | "refunded"
  | "payment_failed";
export type BookingPaymentStatus = "pending" | "requires_action" | "succeeded" | "failed" | "refunded" | null;
export type BookingServiceStatus = "pending_completion" | "completed" | null;
export type BookingOperationalStatus =
  | "awaiting_payment"
  | "confirmed"
  | "amended"
  | "cancelled"
  | "completed"
  | "payment_failed"
  | "refunded";

export type RoomSelection = {
  roomId: string;
  quantity: number;
  name: string;
  baseRate: number;
  occupancy: number;
};

export type NoShowReport = {
  bookingReference: string;
  reportedAt: string;
  serviceDate: string;
};

export type CompletionResult = {
  bookingReference: string;
  completedAt: string;
  serviceStatus: "completed";
};

export type BookingRecord = {
  id: string;
  bookingReference: string;
  listingKind: string;
  listingId: string;
  listingName: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  pickupAt: string | null;
  guestCount: number;
  roomSelections: RoomSelection[] | null;
  ratePlanSelection: {
    ratePlanId: string;
    code: string;
    name: string;
    planType: "refundable" | "non_refundable";
    policyVersion: number;
    cancellationPolicy: {
      policyType: "non_refundable" | "free_cancellation_until" | "partial_refund";
      penaltyType: "none" | "full_charge" | "percent" | "amount";
      cancelDeadlineHoursBeforeCheckIn: number | null;
      penaltyPercent: number | null;
      penaltyAmount: number | null;
      terms?: string | null;
    };
  } | null;
  cancellationOptionSelection: {
    optionId: "NON_CANCELLABLE" | "FREE_CANCELLATION";
    id?: "NON_CANCELLABLE" | "FREE_CANCELLATION";
    label: string;
    amount: number;
    currency?: string;
    policyCopy?: string;
    cancellationCutoffAtLocal?: string;
    cancellationCutoffAtUtc?: string;
    timezone?: string;
    selectedAt?: string;
    source?: string;
  } | null;
  grossAmount: number;
  currency: string;
  status: BookingStatus;
  bookingStatus: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  serviceStatus?: BookingServiceStatus;
  operationalStatus: BookingOperationalStatus;
  createdAt: string;
  updatedAt: string;
};

export type BookingsPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type BookingsListResult = {
  records: BookingRecord[];
  pagination: BookingsPagination;
};

export type BookingsApi = {
  listBookings(
    userId: string,
    options?: {
      page?: number;
      pageSize?: number;
      status?: BookingOperationalStatus | "";
      from?: string;
      to?: string;
    },
  ): Promise<BookingsListResult>;
  getBooking(userId: string, bookingReference: string): Promise<BookingRecord>;
  reportNoShow(userId: string, bookingReference: string, reason?: string): Promise<NoShowReport>;
  markComplete(userId: string, bookingReference: string): Promise<CompletionResult>;
};
