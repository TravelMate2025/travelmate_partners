import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { mockApiAccessApi } from "@/modules/api-access/mock-api-access-api";

const USER_ID = "user-test-1";
const STORAGE_KEY = `tm_partner_api_access_application_v1:${USER_ID}`;

function seedApprovedApp() {
  const app = {
    id: "app-approved",
    companyName: "Test Co",
    applicantName: "Alice",
    email: "alice@test.com",
    useCase: "Integration testing",
    region: "Global",
    status: "approved",
    plan: "starter",
    keyStatus: "active",
    riskLevel: "low",
    submittedAt: "2026-01-01T00:00:00Z",
    approvedAt: "2026-01-02T00:00:00Z",
    usage: { monthlyRequests: 0, rateLimitPerMinute: 60, errorRatePercent: 0, lastActiveAt: "N/A" },
    requestedRateLimitPerMinute: 60,
    note: "",
    partnerPolicy: { environment: "production", tier: "standard", alertProfile: "balanced" },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
  return app;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("mockApiAccessApi.getCatalog — payment contract (110.2b)", () => {
  it("returns no_application catalog when no app exists", async () => {
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    expect(catalog.access.status).toBe("no_application");
    expect(catalog.access.scopes).toEqual([]);
    expect(catalog.endpoints).toEqual([]);
  });

  it("includes payments.read and payments.write in approved catalog scopes", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    expect(catalog.access.scopes).toContain("payments.read");
    expect(catalog.access.scopes).toContain("payments.write");
  });

  it("includes bookings in productLanes for approved catalog", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    expect(catalog.access.productLanes).toContain("bookings");
  });

  it("returns payment-intents-create endpoint with correct shape", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const ep = catalog.endpoints.find((e) => e.id === "payments-intents-create");
    expect(ep).toBeDefined();
    expect(ep?.method).toBe("POST");
    expect(ep?.path).toBe("/api/v1/public/payments/intents");
    expect(ep?.requiredScope).toBe("payments.write");
    expect(ep?.productLane).toBe("bookings");
    expect(ep?.responseFields).toContain("paymentIntentId");
    expect(ep?.responseFields).toContain("flutterwaveRef");
    expect(ep?.responseFields).toContain("paymentLink");
    expect(ep?.responseFields).toContain("nextAction");
  });

  it("returns booking-quote endpoint with availabilitySummary in response fields", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const ep = catalog.endpoints.find((e) => e.id === "bookings-quote");
    expect(ep).toBeDefined();
    expect(ep?.method).toBe("POST");
    expect(ep?.requiredScope).toBe("bookings.write");
    expect(ep?.responseFields).toContain("availabilitySummary");
  });

  it("returns stay rooms list endpoint with remaining inventory fields", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const ep = catalog.endpoints.find((e) => e.id === "stays-rooms-list");
    expect(ep).toBeDefined();
    expect(ep?.method).toBe("GET");
    expect(ep?.requiredScope).toBe("inventory.read");
    expect(ep?.responseFields).toContain("remainingInventory");
    expect(ep?.responseFields).toContain("isExhausted");
  });

  it("returns payments-intents-confirm endpoint with correct shape", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const ep = catalog.endpoints.find((e) => e.id === "payments-intents-confirm");
    expect(ep).toBeDefined();
    expect(ep?.method).toBe("POST");
    expect(ep?.requiredScope).toBe("payments.write");
    expect(ep?.responseFields).toContain("flutterwaveRef");
    expect(ep?.responseFields).toContain("paymentState");
  });

  it("returns payments-intents-read endpoint with correct shape", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const ep = catalog.endpoints.find((e) => e.id === "payments-intents-read");
    expect(ep).toBeDefined();
    expect(ep?.method).toBe("GET");
    expect(ep?.requiredScope).toBe("payments.read");
    expect(ep?.responseFields).toContain("flutterwaveRef");
    expect(ep?.responseFields).toContain("bookingReference");
  });

  it("includes payments scope guide entries", async () => {
    seedApprovedApp();
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    const guide = catalog.policyExplainer?.scopeGuide ?? [];
    const readGuide = guide.find((g) => g.scope === "payments.read");
    const writeGuide = guide.find((g) => g.scope === "payments.write");
    expect(readGuide).toBeDefined();
    expect(readGuide?.endpointCount).toBe(1);
    expect(writeGuide).toBeDefined();
    expect(writeGuide?.endpointCount).toBe(2);
  });

  it("does not return payment endpoints when application is not approved", async () => {
    const app = {
      id: "app-pending",
      companyName: "Test Co",
      applicantName: "Bob",
      email: "bob@test.com",
      useCase: "pending",
      region: "Global",
      status: "pending_review",
      plan: "starter",
      keyStatus: "not_issued",
      riskLevel: "medium",
      submittedAt: "2026-01-01T00:00:00Z",
      approvedAt: null,
      usage: { monthlyRequests: 0, rateLimitPerMinute: 60, errorRatePercent: 0, lastActiveAt: "N/A" },
      requestedRateLimitPerMinute: 60,
      note: "",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
    const catalog = await mockApiAccessApi.getCatalog(USER_ID);
    expect(catalog.endpoints).toEqual([]);
  });
});
