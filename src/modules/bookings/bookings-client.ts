import { appConfig } from "@/lib/config";
import type { BookingsApi } from "@/modules/bookings/contracts";
import { mockBookingsApi } from "@/modules/bookings/mock-bookings-api";
import { realBookingsApi } from "@/modules/bookings/real-bookings-api";

export const bookingsClient: BookingsApi = appConfig.useMockApi ? mockBookingsApi : realBookingsApi;
