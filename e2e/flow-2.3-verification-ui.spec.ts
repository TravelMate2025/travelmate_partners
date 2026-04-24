import { execFileSync } from "node:child_process";

import { expect, test } from "@playwright/test";

function seedVerifiedPartner(email: string, password: string) {
  const script = `
from django.contrib.auth import get_user_model
from apps.users.choices import UserRole

User = get_user_model()
user = User.objects.filter(email=${JSON.stringify(email)}).first()
if not user:
    User.objects.create_user(
        username=${JSON.stringify(email)},
        email=${JSON.stringify(email)},
        password=${JSON.stringify(password)},
        role=UserRole.PARTNER,
        email_verified=True,
        is_active=True,
    )
`

  execFileSync("./venv/bin/python", ["manage.py", "shell", "-c", script], {
    cwd: "../api",
    stdio: "pipe",
  });
}

test.describe("TravelMate Partner verification UI flow (2.3)", () => {
  test("supports real document upload and verification submission from the partner UI", async ({
    page,
  }) => {
    const unique = Date.now();
    const email = `verification-ui+${unique}@example.com`;
    const password = "Password123!";

    seedVerifiedPartner(email, password);

    await page.goto("/auth/login");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await Promise.all([
      page.waitForURL(/\/onboarding/),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);

    await page.getByRole("combobox").first().selectOption("business");
    await page.getByPlaceholder("Legal name").fill(`Verification Flow ${unique} Ltd`);
    await page.getByPlaceholder("Trade name (optional)").fill(`Verification Flow ${unique}`);
    await page.getByPlaceholder("Registration number").fill(`RC${unique}`);
    await page.getByRole("button", { name: "Save and Continue" }).click();

    await page.getByPlaceholder("Primary contact name").fill(`Verification Partner ${unique}`);
    await page.getByPlaceholder("Primary contact email").fill(`partner-${unique}@example.com`);
    await page.getByPlaceholder("Support contact email (optional)").fill(`support-${unique}@example.com`);
    await page.getByRole("button", { name: "Save and Continue" }).click();

    await page.getByText("Nigeria").click();
    await page.getByText("Lagos", { exact: true }).click();
    await page.getByText("Lekki", { exact: true }).click();
    await page.getByLabel("Payout method").selectOption("bank_transfer");
    await page.getByLabel("Settlement currency").selectOption("NGN");
    await page.getByLabel("Payout schedule").selectOption("weekly");
    await page.getByRole("button", { name: "Submit Onboarding" }).click();

    await expect(page).toHaveURL("/verification");
    await expect(page.getByText(/Partner Verification/i)).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: "identity-proof.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 identity-proof"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Document added." }).last()).toBeVisible();
    await expect(page.getByText("identity-proof.pdf")).toBeVisible();

    await page.getByRole("combobox").first().selectOption("business");
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "business-registration.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 business-registration"),
    });
    await page.getByRole("button", { name: "Add Document" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Document added." }).last()).toBeVisible();
    await expect(page.getByText("business-registration.pdf")).toBeVisible();

    await page.getByRole("button", { name: "Submit Verification" }).click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Verification submitted. Status is in_review." }),
    ).toBeVisible();
    await expect(page.getByText(/Status: in_review/i)).toBeVisible();
  });
});
