import { expect, test } from "@playwright/test";

function createPartnerCredentials() {
  const email = `partner+${Date.now()}@example.com`;
  const phone = "+2348000000000";
  const password = "Password123!";

  return { email, phone, password };
}

test.describe("TravelMate Partner implemented UI flows (2.2-2.5)", () => {
  test("completes onboarding, verification, dashboard, and stay lifecycle in UI", async ({
    page,
  }) => {
    const creds = createPartnerCredentials();

    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    await page.evaluate(({ email, phone, password }) => {
      const key = "tm_partner_mock_state_v1";
      const token = `token-${Date.now()}`;
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();

      const state = {
        users: [
          {
            id: userId,
            email: email.toLowerCase(),
            phone,
            password,
            emailVerified: true,
            otpEnabled: false,
            createdAt: now,
            updatedAt: now,
            verificationCode: "",
            knownFingerprints: [],
          },
        ],
        sessions: [
          {
            id: `session-${Date.now()}`,
            userId,
            token,
            fingerprint: "en-US::e2e",
            createdAt: now,
            lastSeenAt: now,
          },
        ],
        signupOtps: [],
        currentToken: token,
      };

      window.localStorage.setItem(key, JSON.stringify(state));
    }, creds);

    await page.goto("/onboarding");
    await expect(page.getByText("Partner Onboarding")).toBeVisible();

    await page.getByLabel("Business Type").selectOption("business");
    await page.getByPlaceholder("Legal name").fill("TravelMate Ltd");
    await page.getByPlaceholder("Registration number").fill("RC123456");
    await page.getByRole("button", { name: "Save and Continue" }).click();

    await page.getByPlaceholder("Primary contact name").fill("Jane Doe");
    await page.getByPlaceholder("Primary contact email").fill("jane@example.com");
    await page.getByRole("button", { name: "Save and Continue" }).click();

    await page.getByPlaceholder("Service regions (comma separated)").fill("Lagos, Abuja");
    await page.getByPlaceholder("Operating cities (comma separated)").fill("Lekki, Ikeja");
    await page.getByLabel("Payout Schedule").selectOption("weekly");
    await page.getByRole("button", { name: "Submit Onboarding" }).click();

    await expect(page).toHaveURL("/verification");
    await expect(page.getByText("Partner Verification (KYC/KYB)")).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "id.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("mock-id-document"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await page.getByRole("button", { name: "Submit Verification" }).click();
    await expect(page.getByText("Status: pending")).toBeVisible();

    await page.waitForTimeout(1700);
    await page.getByRole("button", { name: "Refresh Status" }).click();
    await expect(page.getByText("Status: rejected")).toBeVisible();

    await page.locator("select").first().selectOption("business");
    await page.locator('input[type="file"]').setInputFiles({
      name: "business.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("mock-business-document"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await page.getByRole("button", { name: "Re-submit Verification" }).click();

    await page.waitForTimeout(1700);
    await page.getByRole("button", { name: "Refresh Status" }).click();
    await expect(page.getByText("Status: approved")).toBeVisible();

    await page.getByRole("button", { name: "Continue to Dashboard" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Partner Dashboard" })).toBeVisible();

    await page.getByRole("button", { name: "Add Stay" }).click();
    await expect(page).toHaveURL("/stays/new");
    await page.getByPlaceholder("Property type (hotel, apartment, villa...)").fill("hotel");
    await page.getByPlaceholder("Stay name").fill("Ocean View Hotel");
    await page.getByPlaceholder("Short description").fill("Seaside property for guests.");
    await page.getByPlaceholder("Address").fill("1 Marina Road");
    await page.getByPlaceholder("City").fill("Lagos");
    await page.getByPlaceholder("Country").fill("Nigeria");
    await page.getByRole("button", { name: "Create Stay Draft" }).click();

    await expect(page).toHaveURL(/\/stays\/.+/);
    await page.getByPlaceholder("Amenities (comma separated)").fill("wifi, pool");
    await page.getByRole("button", { name: "Save Details" }).click();
    await expect(page.getByText("Stay details saved.")).toBeVisible();

    await page.getByPlaceholder("Room name").fill("Deluxe Suite");
    await page.getByPlaceholder("Occupancy").fill("2");
    await page.getByPlaceholder("Bed configuration").fill("1 King Bed");
    await page.getByPlaceholder("Base rate").fill("120");
    await page.getByRole("button", { name: "Add Room" }).click();
    await expect(page.getByText("Room added.")).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "front.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("mock-image-data"),
    });
    await expect(page.getByText("Image added.")).toBeVisible();

    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(page.getByText("Status updated to rejected.")).toBeVisible();

    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(page.getByText("Status updated to approved.")).toBeVisible();

    await page.getByRole("button", { name: "Go Live" }).click();
    await expect(page.getByText("Status updated to live.")).toBeVisible();

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByText("Status updated to paused.")).toBeVisible();

    await page.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Stay archived.")).toBeVisible();
  });
});
