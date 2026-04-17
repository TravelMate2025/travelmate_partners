import { expect, test } from "@playwright/test";

test.describe("TravelMate Partner flow 2.15 settlement account verification UI", () => {
  test("submits a payout method, verifies with OTP, updates details, and re-verifies", async ({
    page,
  }) => {
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

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
                email: "flow215@example.com",
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
    await expect(page.getByRole("heading", { name: "Settlement Account Verification" })).toBeVisible();

    await page.getByLabel("Account Holder Name").fill("TravelMate Ltd");
    await page.getByLabel("Bank Name").fill("Zenith Bank");
    await page.getByLabel("Account Number").fill("1234567890");
    await page.getByRole("button", { name: "Submit Payout Method" }).click();

    const submitMessage = page.locator("p.text-sm.text-slate-700", {
      hasText: "Settlement account submitted. Mock OTP:",
    });
    await expect(submitMessage).toBeVisible();
    const submitText = (await submitMessage.textContent()) ?? "";
    const firstOtp = submitText.match(/(\d{6})/)?.[1] ?? "";
    expect(firstOtp).toHaveLength(6);

    await page.getByLabel("OTP Code").fill(firstOtp);
    await page.getByRole("button", { name: "Verify Payout Method" }).click();
    await expect(page.getByText("Settlement account verified.")).toBeVisible();
    await expect(page.getByText("Status: verified")).toBeVisible();
    await expect(page.getByText("Acct ******7890 • Default")).toBeVisible();

    await page.getByLabel("Edit Existing Account").selectOption({ index: 1 });
    await page.getByLabel("Account Holder Name").fill("Wrong Owner");
    await page.getByRole("button", { name: "Submit Payout Method" }).click();

    const updateMessage = page.locator("p.text-sm.text-slate-700", {
      hasText: "Settlement account submitted. Mock OTP:",
    });
    await expect(updateMessage).toBeVisible();
    const updateText = (await updateMessage.textContent()) ?? "";
    const secondOtp = updateText.match(/(\d{6})/)?.[1] ?? "";
    expect(secondOtp).toHaveLength(6);

    await page.getByLabel("OTP Code").fill(secondOtp);
    await page.getByRole("button", { name: "Verify Payout Method" }).click();
    await expect(page.getByText(/Account holder name does not match/).first()).toBeVisible();
    await expect(page.getByText("reverification_required")).toBeVisible();
    await expect(page.getByText("Status: rejected • Name match: mismatched")).toBeVisible();
  });
});
