import { expect, test } from "@playwright/test";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

test.describe("TravelMate Partner auth UI flow (2.1)", () => {
  test("supports signup, email verification, and login via UI", async ({ page }) => {
    const email = `auth+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";

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
    await expect(page.getByText("Partner Onboarding")).toBeVisible();
  });

  test("supports session controls and password reset via UI", async ({ page }) => {
    const email = `auth-reset+${Date.now()}@example.com`;
    const phone = "+2348111111111";
    const password = "Password123!";
    const newPassword = "NewPassword123!";

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

    await page.evaluate(async (baseUrl) => {
      const meResponse = await fetch(`${baseUrl}/auth/me`, {
        credentials: "include",
      });
      const mePayload = (await meResponse.json()) as { data: { id: string } };
      const userId = mePayload.data.id;

      window.localStorage.setItem(
        "tm_partner_profile_state_v1",
        JSON.stringify({
          onboardingByUserId: {
            [userId]: {
              userId,
              data: {
                businessType: "business",
                legalName: "Auth Reset Travel Ltd",
                tradeName: "Auth Reset Travel",
                registrationNumber: "RC-12345",
                primaryContactName: "Auth Reset",
                primaryContactEmail: "ops@example.com",
                supportContactEmail: "support@example.com",
                operatingCountries: ["Nigeria"],
                operatingRegions: ["Lagos"],
                operatingCities: ["Ikeja"],
                coverageNotes: "",
                payoutMethod: "bank_transfer",
                settlementCurrency: "NGN",
                disbursementCadence: "weekly",
              },
              completedSteps: ["business", "contact", "operations"],
              status: "completed",
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      );

      window.localStorage.setItem(
        "tm_partner_verification_state_v1",
        JSON.stringify({
          byUserId: {
            [userId]: {
              userId,
              status: "approved",
              documents: [],
              submissionCount: 1,
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      );
    }, apiBaseUrl);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Active Sessions")).toBeVisible();
    await expect(page.getByRole("button", { name: "Revoke" })).toBeVisible();
    await page.getByRole("button", { name: "Revoke" }).first().click();
    await expect(page.getByText("Session revoked.")).toBeVisible();

    await page.goto("/auth/forgot-password");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByRole("button", { name: "Send reset code" }).click();
    await page.waitForSelector("p.tm-note");
    const resetMessage = await page.locator("p.tm-note").textContent();
    const resetCode = resetMessage?.match(/(\d{6})/)?.[1];
    expect(resetCode).toMatch(/^\d{6}$/);

    await page.goto("/auth/reset-password");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Reset code").fill(resetCode ?? "");
    await page.getByPlaceholder("New password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated. Sign in with the new password.")).toBeVisible();

    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();

    await page.getByPlaceholder("Password").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
