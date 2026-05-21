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
    expect(result.ratePlans.length).toBeGreaterThan(0);
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

  it("sanitizes unit-level upsert payload before API call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          data: {
            userId: "user-1",
            stayId: "stay-1",
            currency: "NGN",
            baseRate: 120,
            weekdayRate: 120,
            weekendRate: 140,
            minStayNights: 1,
            maxStayNights: 10,
            seasonalOverrides: [],
            blackoutDates: [],
            ratePlans: [],
            cancellationOptions: [],
            updatedAt: new Date().toISOString(),
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await realPricingAvailabilityApi.upsertPricing("user-1", "stay-1", {
      saleMode: "unit_level",
      currency: "NGN",
      baseRate: 120,
      weekdayRate: 120,
      weekendRate: 140,
      minStayNights: 1,
      maxStayNights: 10,
      seasonalOverrides: [],
      blackoutDates: [],
      ratePlans: [
        {
          code: "room_plan_should_drop",
          name: "Room Plan",
          roomId: "room-123",
          planType: "non_refundable",
          isActive: true,
          nightlyRate: 120,
          policyVersion: 1,
          startsOn: null,
          endsOn: null,
          cancellationPolicy: {
            policyType: "non_refundable",
            penaltyType: "full_charge",
            cancelDeadlineHoursBeforeCheckIn: null,
            penaltyPercent: null,
            penaltyAmount: null,
          },
        },
      ],
      cancellationOptions: [],
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));
    expect(body.ratePlans).toEqual([]);
  });
});
