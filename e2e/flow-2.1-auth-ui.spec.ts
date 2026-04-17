import { expect, test } from "@playwright/test";

test.describe("TravelMate Partner auth UI flow (2.1)", () => {
  test("supports signup, email verification, and login via UI", async ({ page }) => {
    const email = `auth+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";
    const signupOtp = "123456";

    await page.goto("/auth/signup");
    await page.waitForLoadState("networkidle");

    await page.evaluate(
      ({ seededEmail, seededPhone, seededCode }) => {
        const key = "tm_partner_mock_state_v1";
        const raw = window.localStorage.getItem(key);
        const base = raw
          ? (JSON.parse(raw) as {
              users?: unknown[];
              sessions?: unknown[];
              signupOtps?: Array<{ email: string; phone: string; code: string }>;
            })
          : {};

        const state = {
          users: Array.isArray(base.users) ? base.users : [],
          sessions: Array.isArray(base.sessions) ? base.sessions : [],
          signupOtps: Array.isArray(base.signupOtps)
            ? [...base.signupOtps.filter((item) => item.email !== seededEmail.toLowerCase())]
            : [],
        };

        state.signupOtps.push({
          email: seededEmail.toLowerCase(),
          phone: seededPhone,
          code: seededCode,
        });
        window.localStorage.setItem(key, JSON.stringify(state));
      },
      {
        seededEmail: email,
        seededPhone: phone,
        seededCode: signupOtp,
      },
    );

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Phone").fill(phone);
    await page.getByLabel("Signup OTP").fill(signupOtp);
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
});
