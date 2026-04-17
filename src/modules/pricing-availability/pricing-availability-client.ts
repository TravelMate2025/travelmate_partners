import { appConfig } from "@/lib/config";
import type { PricingAvailabilityApi } from "@/modules/pricing-availability/contracts";
import { mockPricingAvailabilityApi } from "@/modules/pricing-availability/mock-pricing-availability-api";
import { realPricingAvailabilityApi } from "@/modules/pricing-availability/real-pricing-availability-api";

export const pricingAvailabilityClient: PricingAvailabilityApi = appConfig.useMockApi
  ? mockPricingAvailabilityApi
  : realPricingAvailabilityApi;
