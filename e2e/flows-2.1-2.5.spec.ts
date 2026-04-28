import { expect, test } from "@playwright/test";

async function signupAndLogin(
  page: import("@playwright/test").Page,
  email: string,
  phone: string,
  password: string,
) {
  await page.goto("/auth/signup");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await expect(page.getByText(/Signup OTP sent/i)).toBeVisible();

  const otpMessage = await page.getByText(/Signup OTP sent/i).textContent();
  const signupOtp = otpMessage?.match(/(\d{6})/)?.[1];
  expect(signupOtp).toMatch(/^\d{6}$/);

  await page.getByLabel("Signup OTP").fill(signupOtp ?? "");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/auth\/verify-email/);
  const verificationCode = new URL(page.url()).searchParams.get("codeHint");
  expect(verificationCode).toMatch(/^\d{6}$/);

  await page.getByPlaceholder("Verification code").fill(verificationCode ?? "");
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByText("Email verified successfully. You can now sign in.")).toBeVisible();

  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/onboarding");
}

test.describe("TravelMate Partner implemented UI flows (2.2-2.5)", () => {
  test("completes onboarding, verification, dashboard, and stay lifecycle in UI", async ({
    page,
  }) => {
    const email = `partner+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";

    await signupAndLogin(page, email, phone, password);

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
    await page.getByLabel("Settlement Preference").selectOption("weekly");
    await page.getByRole("button", { name: "Submit Onboarding" }).click();

    await expect(page).toHaveURL("/verification");
    await expect(page.getByText("Partner Verification (KYC/KYB)")).toBeVisible();

    await page.locator('input[type="file"]:not(.hidden)').first().setInputFiles({
      name: "id.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("mock-id-document"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await page.getByRole("button", { name: "Submit Verification" }).click();
    await expect(page.getByText("Status: in_review")).toBeVisible();

    await page.waitForTimeout(1700);
    await page.getByRole("button", { name: "Refresh Status" }).click();
    await expect(page.getByText("Status: rejected")).toBeVisible();

    await page.locator("select").first().selectOption("business");
    await page.locator('input[type="file"]:not(.hidden)').first().setInputFiles({
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
    await page.getByLabel("Property Type").selectOption("hotel");
    await page.getByLabel("Stay Name").fill("Ocean View Hotel");
    await page.getByLabel("Description").fill("Seaside property for guests.");
    await page.getByLabel("Address").fill("1 Marina Road");
    await page.getByLabel("Country").selectOption("Nigeria");
    await page.getByPlaceholder("Search city").fill("Lagos");
    await page.getByLabel("City").selectOption("Lagos");
    await page.getByRole("button", { name: "Create Stay Draft" }).click();

    await expect(page).toHaveURL(/\/stays\/.+/);
    await page.getByLabel("Amenities").fill("wifi, pool");
    await page.getByRole("button", { name: "Save Details" }).click();
    await expect(page.getByText("Stay details saved.")).toBeVisible();

    await page.getByPlaceholder("Room name").fill("Deluxe Suite");
    await page.getByPlaceholder("Occupancy").fill("2");
    await page.getByPlaceholder("Bed configuration").fill("1 King Bed");
    await page.getByPlaceholder("Base rate").fill("120");
    await page.getByRole("button", { name: "Add Room" }).click();
    await expect(page.getByText("Room added.")).toBeVisible();

    await page.locator('input[type="file"]:not(.hidden)').first().setInputFiles({
      name: "front.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("mock-image-data"),
    });
    await expect(page.getByRole("status").getByText("Image added.")).toBeVisible();

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
