import { expect, test } from "@playwright/test";
import { seedProfileAndVerification, signupAndLoginGetUserId } from "./helpers";

test.describe("TravelMate Partner auth UI flow (2.1)", () => {
  test("supports signup, email verification, and login via UI", async ({ page }) => {
    const email = `auth+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";

    await signupAndLoginGetUserId(page, email, phone, password);

    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("Partner Onboarding")).toBeVisible();
  });

  test("supports session controls and password reset via UI", async ({ page }) => {
    const email = `auth-reset+${Date.now()}@example.com`;
    const phone = "+2348111111111";
    const password = "Password123!";
    const newPassword = "NewPassword123!";

    const userId = await signupAndLoginGetUserId(page, email, phone, password);
    await expect(page).toHaveURL("/onboarding");

    await seedProfileAndVerification(page, userId, new Date().toISOString());

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
