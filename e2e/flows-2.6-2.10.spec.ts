import { expect, test } from "@playwright/test";

test.describe("TravelMate Partner implemented UI flows (2.6-2.10)", () => {
  test("covers pricing, transfer scheduling, and data quality interactions", async ({ page }) => {
    const userId = `user-${Date.now()}`;
    const stayId = `stay-${Date.now()}`;
    const transferId = `transfer-${Date.now()}`;
    const now = new Date().toISOString();

    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    await page.evaluate(
      ({ userId: seededUserId, stayId: seededStayId, transferId: seededTransferId, ts }) => {
        const token = `token-${Date.now()}`;

        window.localStorage.setItem(
          "tm_partner_mock_state_v1",
          JSON.stringify({
            users: [
              {
                id: seededUserId,
                email: "flow26@example.com",
                phone: "+2348000000000",
                password: "Password123!",
                emailVerified: true,
                otpEnabled: false,
                createdAt: ts,
                updatedAt: ts,
                verificationCode: "",
                knownFingerprints: [],
              },
            ],
            sessions: [
              {
                id: `session-${Date.now()}`,
                userId: seededUserId,
                token,
                fingerprint: "en-US::e2e",
                createdAt: ts,
                lastSeenAt: ts,
              },
            ],
            signupOtps: [],
            currentToken: token,
          }),
        );

        window.localStorage.setItem(
          "tm_partner_profile_state_v1",
          JSON.stringify({
            onboardingByUserId: {
              [seededUserId]: {
                userId: seededUserId,
                data: {
                  businessType: "business",
                  legalName: "TravelMate Ltd",
                  tradeName: "TravelMate",
                  registrationNumber: "RC123456",
                  primaryContactName: "Jane Doe",
                  primaryContactEmail: "jane@example.com",
                  supportContactEmail: "support@example.com",
                  serviceRegions: ["Lagos"],
                  operatingCities: ["Lekki"],
                  payoutSchedule: "weekly",
                },
                completedSteps: ["business", "contact", "operations"],
                status: "completed",
                updatedAt: ts,
              },
            },
          }),
        );

        window.localStorage.setItem(
          "tm_partner_verification_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: {
                userId: seededUserId,
                status: "approved",
                documents: [],
                submissionCount: 2,
                submittedAt: ts,
                decidedAt: ts,
                updatedAt: ts,
              },
            },
          }),
        );

        window.localStorage.setItem(
          "tm_partner_stays_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: [
                {
                  id: seededStayId,
                  userId: seededUserId,
                  status: "draft",
                  propertyType: "hotel",
                  name: "Flow 2.6 Stay",
                  description: "",
                  address: "1 Marina Road",
                  city: "Lagos",
                  country: "Nigeria",
                  amenities: [],
                  houseRules: "",
                  checkInTime: "",
                  checkOutTime: "",
                  cancellationPolicy: "",
                  images: [],
                  rooms: [],
                  createdAt: ts,
                  updatedAt: ts,
                },
              ],
            },
          }),
        );

        window.localStorage.setItem(
          "tm_partner_transfers_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: [
                {
                  id: seededTransferId,
                  userId: seededUserId,
                  status: "draft",
                  name: "Flow 2.8 Transfer",
                  description: "",
                  transferType: "airport",
                  pickupPoint: "MM2 Airport",
                  dropoffPoint: "Victoria Island",
                  vehicleClass: "SUV",
                  passengerCapacity: 4,
                  luggageCapacity: 2,
                  features: [],
                  coverageArea: "",
                  operatingHours: "",
                  currency: "NGN",
                  baseFare: 0,
                  nightSurcharge: 0,
                  images: [],
                  createdAt: ts,
                  updatedAt: ts,
                },
              ],
            },
          }),
        );
      },
      {
        userId: userId,
        stayId: stayId,
        transferId: transferId,
        ts: now,
      },
    );

    await page.context().addCookies([
      {
        name: "tm_partner_session",
        value: "1",
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    await page.goto("/pricing-availability");
    await expect(page.getByRole("heading", { name: "Pricing & Availability" })).toBeVisible();
    await page.getByRole("button", { name: "Save Pricing & Availability" }).click();
    await expect(page.getByText("Pricing and availability saved.")).toBeVisible();

    await page.goto("/transfer-pricing-scheduling");
    await expect(page.getByRole("heading", { name: "Transfer Pricing & Scheduling" })).toBeVisible();
    await page.getByRole("button", { name: "Save Pricing & Scheduling" }).click();
    await expect(page.getByText("Transfer pricing and scheduling saved.")).toBeVisible();

    await page.goto(`/stays/${stayId}`);
    await expect(page.getByRole("heading", { name: "Data Quality" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(page.getByText("Cannot submit stay. Missing required fields: Description.")).toBeVisible();

    await page.goto(`/transfers/${transferId}`);
    await expect(page.getByRole("heading", { name: "Data Quality" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(
      page.getByText("Cannot submit transfer. Missing required fields: Coverage Area."),
    ).toBeVisible();
  });
});
