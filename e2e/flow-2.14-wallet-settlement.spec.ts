import { expect, test } from "@playwright/test";

test.describe("TravelMate Partner flow 2.14 wallet and settlement UI", () => {
  test("records completed booking settlement, tracks cancellation refund, and downloads statement", async ({
    page,
  }) => {
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();
    const bookingReference = `TM-BOOK-${Date.now().toString().slice(-8)}`;

    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    await page.evaluate(
      ({ seededUserId, ts }) => {
        const token = `token-${Date.now()}`;

        window.localStorage.setItem(
          "tm_partner_mock_state_v1",
          JSON.stringify({
            users: [
              {
                id: seededUserId,
                email: "flow214@example.com",
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
                submissionCount: 1,
                submittedAt: ts,
                decidedAt: ts,
                updatedAt: ts,
              },
            },
          }),
        );
      },
      {
        seededUserId: userId,
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

    await page.goto("/wallet-payouts");
    await expect(page.getByRole("heading", { name: "Wallet & Settlements" })).toBeVisible();

    await page.getByLabel("Booking Reference").fill(bookingReference);
    await page.getByLabel(/Gross Amount/i).fill("25000");
    await page.getByRole("button", { name: "Record Completion" }).click();
    await expect(page.getByText("Completed booking recorded for settlement.")).toBeVisible();
    await expect(page.getByText(`Booking: ${bookingReference}`)).toBeVisible();

    await page.getByLabel(/Refund Amount/i).fill("5000");
    await page.getByLabel("Reason").fill("Traveler cancelled after settlement.");
    await page.getByRole("button", { name: "Track Refund" }).click();
    await expect(
      page.locator("p.text-sm.text-slate-700", {
        hasText: "Cancellation refund status tracked.",
      }),
    ).toBeVisible();
    await expect(page.getByText("Refund: partner_notified")).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Statement" }).first().click();
    await download;
    await expect(
      page.locator("p.text-sm.text-slate-700", {
        hasText: "Settlement statement downloaded.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Statement Preview" })).toBeVisible();
    await expect(page.locator("textarea")).toContainText("field,value");
  });
});
