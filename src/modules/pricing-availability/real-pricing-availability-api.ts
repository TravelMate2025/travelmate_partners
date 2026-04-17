import { apiRequest } from "@/lib/http-client";
import type {
  PricingAvailabilityApi,
  StayPricingAvailability,
  UpsertPricingAvailabilityInput,
} from "@/modules/pricing-availability/contracts";

type Envelope<T> = { data: T };

export const realPricingAvailabilityApi: PricingAvailabilityApi = {
  async getPricing(userId, stayId) {
    const response = await apiRequest<Envelope<StayPricingAvailability>>(
      `/partners/${userId}/stays/${stayId}/pricing-availability`,
    );
    return response.data;
  },

  async upsertPricing(userId, stayId, input: UpsertPricingAvailabilityInput) {
    const response = await apiRequest<Envelope<StayPricingAvailability>>(
      `/partners/${userId}/stays/${stayId}/pricing-availability`,
      {
        method: "PUT",
        body: input,
      },
    );
    return response.data;
  },
};
