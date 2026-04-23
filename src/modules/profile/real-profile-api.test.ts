import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http-client";
import { realProfileApi } from "@/modules/profile/real-profile-api";

const fetchMock = vi.fn();

describe("realProfileApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("loads onboarding from the backend contract", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          userId: "42",
          data: {
            businessType: "business",
            legalName: "TravelMate Ltd",
            tradeName: "TravelMate",
            registrationNumber: "RC123456",
            primaryContactName: "",
            primaryContactEmail: "",
            supportContactEmail: "",
            serviceRegions: [],
            operatingCities: [],
            payoutSchedule: "",
          },
          completedSteps: ["business"],
          status: "in_progress",
          updatedAt: "2026-04-23T00:00:00.000Z",
        },
      }),
    });

    const onboarding = await realProfileApi.getOnboarding("42");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/partners/42/onboarding",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
    expect(onboarding.completedSteps).toEqual(["business"]);
    expect(onboarding.status).toBe("in_progress");
  });

  it("submits step updates with the expected payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          userId: "42",
          data: {
            businessType: "business",
            legalName: "TravelMate Ltd",
            tradeName: "TravelMate",
            registrationNumber: "RC123456",
            primaryContactName: "",
            primaryContactEmail: "",
            supportContactEmail: "",
            serviceRegions: [],
            operatingCities: [],
            payoutSchedule: "",
          },
          completedSteps: ["business"],
          status: "in_progress",
          updatedAt: "2026-04-23T00:00:00.000Z",
        },
      }),
    });

    await realProfileApi.saveStep("42", "business", {
      businessType: "business",
      legalName: "TravelMate Ltd",
      registrationNumber: "RC123456",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/partners/42/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          step: "business",
          data: {
            businessType: "business",
            legalName: "TravelMate Ltd",
            registrationNumber: "RC123456",
          },
        }),
      }),
    );
  });

  it("surfaces backend validation failures", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        message: "Complete all onboarding steps before submission.",
      }),
    });

    await expect(realProfileApi.submitOnboarding("42")).rejects.toEqual(
      expect.objectContaining<HttpError>({
        message: "Complete all onboarding steps before submission.",
        status: 400,
      }),
    );
  });
});
