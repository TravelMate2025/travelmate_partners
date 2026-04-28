import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { realPricingAvailabilityApi } from "@/modules/pricing-availability/real-pricing-availability-api";

describe("realPricingAvailabilityApi", () => {
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000/api/v1";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  });

  it("returns default pricing when backend has no pricing row yet (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () =>
          JSON.stringify({
            message: "Pricing for stay 'stay-404' not found.",
          }),
      }),
    );

    const result = await realPricingAvailabilityApi.getPricing("user-1", "stay-404");

    expect(result.userId).toBe("user-1");
    expect(result.stayId).toBe("stay-404");
    expect(result.currency).toBe("NGN");
    expect(result.baseRate).toBeGreaterThan(0);
  });

  it("throws non-404 API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () =>
          JSON.stringify({
            message: "Internal server error",
          }),
      }),
    );

    await expect(realPricingAvailabilityApi.getPricing("user-1", "stay-500")).rejects.toThrow(
      "Internal server error",
    );
  });
});
