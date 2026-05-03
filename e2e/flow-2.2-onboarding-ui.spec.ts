import { expect, test } from "@playwright/test";
import { signupAndLoginGetUserId } from "./helpers";

test.describe("TravelMate Partner onboarding UI flow (2.2)", () => {
  test("completes onboarding against the live profile API", async ({ page }) => {
    const email = `onboarding+${Date.now()}@example.com`;
    const phone = "+2348222222222";
    const password = "Password123!";

    await signupAndLoginGetUserId(page, email, phone, password);

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

    await page.getByRole("checkbox", { name: "Operating countries Nigeria" }).click();
    await page.getByRole("checkbox", { name: "Lagos", exact: true }).click();
    await page.getByRole("checkbox", { name: "Lekki", exact: true }).click();
    await page.getByLabel("Payout method").selectOption("bank_transfer");
    await page.getByLabel("Settlement currency").selectOption("NGN");
    await page.getByLabel("Payout schedule").selectOption("weekly");
    await page.getByRole("button", { name: "Submit Onboarding" }).click();

    await expect(page).toHaveURL("/verification");
    await expect(page.getByText(/Partner Verification/i)).toBeVisible();
  });
});
