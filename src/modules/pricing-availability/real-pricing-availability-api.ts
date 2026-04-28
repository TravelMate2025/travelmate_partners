import { apiRequest, HttpError } from "@/lib/http-client";
import type {
  PricingAvailabilityApi,
  StayPricingAvailability,
  UpsertPricingAvailabilityInput,
} from "@/modules/pricing-availability/contracts";
import { createDefaultPricingAvailability } from "@/modules/pricing-availability/state-machine";

type Envelope<T> = { data: T };

export const realPricingAvailabilityApi: PricingAvailabilityApi = {
  async getPricing(userId, stayId) {
    try {
      const response = await apiRequest<Envelope<StayPricingAvailability>>(
        `/partners/${userId}/stays/${stayId}/pricing-availability`,
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        return createDefaultPricingAvailability(userId, stayId);
      }
      throw error;
    }
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
