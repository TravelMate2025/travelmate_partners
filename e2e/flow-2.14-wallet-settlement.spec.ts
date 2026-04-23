import { expect, test } from "@playwright/test";
import { signupAndLoginGetUserId, seedProfileAndVerification } from "./helpers";

test.describe("TravelMate Partner flow 2.14 wallet and settlement UI", () => {
  test("records completed booking settlement, tracks cancellation refund, and downloads statement", async ({
    page,
  }) => {
    const email = `flow214+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";
    const bookingReference = `TM-BOOK-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();

    const userId = await signupAndLoginGetUserId(page, email, phone, password);
    await seedProfileAndVerification(page, userId, now);

    await page.goto("/wallet-payouts");
    await expect(page.getByRole("heading", { name: "Wallet & Settlements" })).toBeVisible();

    await page.getByLabel("Booking Reference").fill(bookingReference);
    await page.getByLabel(/Gross Amount/i).fill("25000");
    await page.getByRole("button", { name: "Record Completion" }).click();
    await expect(page.getByText("Completed booking recorded for settlement.")).toBeVisible();
    await expect(page.getByText(`Booking: ${bookingReference}`)).toBeVisible();

    await page.getByLabel(/Refund Amount/i).fill("5000");
    await page.getByLabel("Reason").fill("Traveler cancelled after settlement.");
    await page.getByRole("button", { name: "Track Refund" }).click();
    await expect(
      page.locator("p.text-sm.text-slate-700", {
        hasText: "Cancellation refund status tracked.",
      }),
    ).toBeVisible();
    await expect(page.getByText("Refund: partner_notified")).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Statement" }).first().click();
    await download;
    await expect(
      page.locator("p.text-sm.text-slate-700", {
        hasText: "Settlement statement downloaded.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Statement Preview" })).toBeVisible();
    await expect(page.locator("textarea")).toContainText("field,value");
  });
});
