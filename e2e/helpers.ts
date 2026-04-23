import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Does a full real-API signup → verify email → login flow.
 * Returns the real userId from /auth/me so callers can key mock
 * feature state by the correct user.
 */
export async function signupAndLoginGetUserId(
  page: Page,
  email: string,
  phone: string,
  password: string,
): Promise<string> {
  await page.goto("/auth/signup");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await expect(page.getByText(/Signup OTP sent/i)).toBeVisible();

  const otpMessage = await page.getByText(/Signup OTP sent/i).textContent();
  const signupOtp = otpMessage?.match(/(\d{6})/)?.[1] ?? "";
  await page.getByLabel("Signup OTP").fill(signupOtp);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/auth\/verify-email/);
  const verificationCode = new URL(page.url()).searchParams.get("codeHint") ?? "";
  await page.getByPlaceholder("Verification code").fill(verificationCode);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByText("Email verified successfully. You can now sign in.")).toBeVisible();

  await page.goto("/auth/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/onboarding");

  const userId = await page.evaluate(async () => {
    const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
      credentials: "include",
    });
    const payload = (await response.json()) as { data: { id: string } };
    return String(payload.data.id);
  });

  return userId;
}

export function seedProfileAndVerification(
  page: Page,
  userId: string,
  ts: string,
): Promise<void> {
  return page.evaluate(
    ({ seededUserId, seededTs }) => {
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
              updatedAt: seededTs,
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
              submittedAt: seededTs,
              decidedAt: seededTs,
              updatedAt: seededTs,
            },
          },
        }),
      );
    },
    { seededUserId: userId, seededTs: ts },
  );
}
