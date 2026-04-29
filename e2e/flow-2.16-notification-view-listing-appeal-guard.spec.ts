import { expect, test } from "@playwright/test";

test.describe("Flow 2.16 notification listing navigation", () => {
  test("opening a suspended listing from notifications does not auto-submit appeal", async ({ page, context }) => {
    const userId = "user-appeal-guard";
    const stayId = "stay-appeal-guard";
    const now = new Date().toISOString();

    await page.goto("/");
    await page.evaluate(
      ({ seededUserId, seededStayId, ts }) => {
        window.localStorage.setItem(
          "tm_partner_mock_state_v1",
          JSON.stringify({
            users: [
              {
                id: seededUserId,
                email: "appeal.guard@example.com",
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
            sessions: [],
            currentToken: undefined,
            signupOtps: [],
          }),
        );

        window.localStorage.setItem(
          "tm_partner_profile_state_v1",
          JSON.stringify({
            onboardingByUserId: {
              [seededUserId]: {
                userId: seededUserId,
                status: "completed",
                completedSteps: ["business", "contact", "operations"],
                updatedAt: ts,
                data: {
                  businessType: "hotel",
                  legalName: "Appeal Guard Ltd",
                  tradeName: "Appeal Guard",
                  registrationNumber: "RC-12345",
                  primaryContactName: "Guard User",
                  primaryContactEmail: "appeal.guard@example.com",
                  supportContactEmail: "support@example.com",
                  operatingCountries: ["Nigeria"],
                  operatingRegions: ["Lagos"],
                  operatingCities: ["Lagos Island"],
                  coverageNotes: "",
                  payoutMethod: "bank_transfer",
                  settlementCurrency: "NGN",
                  payoutSchedule: "weekly",
                },
                options: {
                  supportedCountries: ["Nigeria"],
                  regionsByCountry: { Nigeria: ["Lagos"] },
                  citiesByRegion: { Lagos: ["Lagos Island"] },
                },
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
                submissionCount: 1,
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
                  status: "paused_by_admin",
                  propertyType: "hotel",
                  name: "Appeal Guard Stay",
                  description: "Short stay",
                  address: "1 Marina Road",
                  city: "Lagos Island",
                  country: "Nigeria",
                  amenities: [],
                  houseRules: "",
                  checkInTime: "",
                  checkOutTime: "",
                  cancellationPolicy: "",
                  images: [],
                  rooms: [],
                  moderationFeedback: "Policy hold",
                  createdAt: ts,
                  updatedAt: ts,
                },
              ],
            },
          }),
        );

        window.localStorage.setItem(
          "tm_partner_notifications_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: [
                {
                  id: "notif-appeal-guard",
                  eventType: "listing_moderation_updated",
                  title: "Listing Moderation Update",
                  message: "A moderation update is available.",
                  read: false,
                  acknowledged: false,
                  channels: ["in_app"],
                  emailDispatched: false,
                  actionLabel: "View listing",
                  actionUrl: `/stays/${seededStayId}`,
                  createdAt: ts,
                },
              ],
            },
          }),
        );
      },
      { seededUserId: userId, seededStayId: stayId, ts: now },
    );

    await page.goto("/auth/login");
    await page.getByPlaceholder("Email").fill("appeal.guard@example.com");
    await page.getByPlaceholder("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/onboarding|\/dashboard|\/notifications|\/verification/);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await page.getByRole("link", { name: "View listing" }).click();

    await expect(page).toHaveURL(`/stays/${stayId}`);
    await expect(page.getByText("Status: Suspended by platform")).toBeVisible();
    await expect(page.getByText(/Appeal submitted\. We will review it and notify you of the outcome\./i)).toHaveCount(0);
  });
});
