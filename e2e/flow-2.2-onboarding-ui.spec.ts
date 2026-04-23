import { expect, test } from "@playwright/test";

test.describe("TravelMate Partner onboarding UI flow (2.2)", () => {
  test("completes onboarding against the live profile API", async ({ page }) => {
    const email = `onboarding+${Date.now()}@example.com`;
    const phone = "+2348222222222";
    const password = "Password123!";

    await page.goto("/auth/signup");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Phone").fill(phone);
    await page.getByRole("button", { name: "Send OTP" }).click();
    const otpMessage = await page.getByText(/Signup OTP sent/i).textContent();
    const signupOtp = otpMessage?.match(/(\d{6})/)?.[1];

    await page.getByLabel("Signup OTP").fill(signupOtp ?? "");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/auth\/verify-email/);

    const verificationCode = new URL(page.url()).searchParams.get("codeHint");
    await page.getByPlaceholder("Verification code").fill(verificationCode ?? "");
    await page.getByRole("button", { name: "Verify email" }).click();
    await expect(page.getByText("Email verified successfully. You can now sign in.")).toBeVisible();

    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("Partner Onboarding")).toBeVisible();

    await page.getByLabel("Business Type").selectOption("business");
    await page.getByPlaceholder("Legal name").fill("TravelMate Partner Ltd");
    await page.getByPlaceholder("Trade name (optional)").fill("TravelMate Partner");
    await page.getByPlaceholder("Registration number").fill("RC-445566");
    await page.getByRole("button", { name: "Save and Continue" }).click();
    await expect(page.getByText("Progress saved.")).toBeVisible();

    await page.getByPlaceholder("Primary contact name").fill("Amina Yusuf");
    await page.getByPlaceholder("Primary contact email").fill("amina@example.com");
    await page.getByPlaceholder("Support contact email (optional)").fill("support@example.com");
    await page.getByRole("button", { name: "Save and Continue" }).click();
    await expect(page.getByText("Progress saved.")).toBeVisible();

    await page.getByPlaceholder("Service regions (comma separated)").fill("Lagos, Abuja");
    await page.getByPlaceholder("Operating cities (comma separated)").fill("Lekki, Ikeja");
    await page.getByLabel("Settlement Preference").selectOption("weekly");
    await page.getByRole("button", { name: "Submit Onboarding" }).click();

    await expect(page).toHaveURL("/verification");
    await expect(page.getByText(/Partner Verification/i)).toBeVisible();
  });
});
