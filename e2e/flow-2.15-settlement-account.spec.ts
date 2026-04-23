import { expect, test } from "@playwright/test";
import { signupAndLoginGetUserId, seedProfileAndVerification } from "./helpers";

test.describe("TravelMate Partner flow 2.15 settlement account verification UI", () => {
  test("submits a payout method, verifies with OTP, updates details, and re-verifies", async ({
    page,
  }) => {
    const email = `flow215+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";
    const now = new Date().toISOString();

    const userId = await signupAndLoginGetUserId(page, email, phone, password);
    await seedProfileAndVerification(page, userId, now);

    await page.goto("/wallet-payouts");
    await expect(page.getByRole("heading", { name: "Settlement Account Verification" })).toBeVisible();

    await page.getByLabel("Account Holder Name").fill("TravelMate Ltd");
    await page.getByLabel("Bank Name").fill("Zenith Bank");
    await page.getByLabel("Account Number").fill("1234567890");
    await page.getByRole("button", { name: "Submit Payout Method" }).click();

    const submitMessage = page.locator("p.text-sm.text-slate-700", {
      hasText: "Settlement account submitted. Mock OTP:",
    });
    await expect(submitMessage).toBeVisible();
    const submitText = (await submitMessage.textContent()) ?? "";
    const firstOtp = submitText.match(/(\d{6})/)?.[1] ?? "";
    expect(firstOtp).toHaveLength(6);

    await page.getByLabel("OTP Code").fill(firstOtp);
    await page.getByRole("button", { name: "Verify Payout Method" }).click();
    await expect(page.getByText("Settlement account verified.")).toBeVisible();
    await expect(page.getByText("Status: verified")).toBeVisible();
    await expect(page.getByText("Acct ******7890 • Default")).toBeVisible();

    await page.getByLabel("Edit Existing Account").selectOption({ index: 1 });
    await page.getByLabel("Account Holder Name").fill("Wrong Owner");
    await page.getByRole("button", { name: "Submit Payout Method" }).click();

    const updateMessage = page.locator("p.text-sm.text-slate-700", {
      hasText: "Settlement account submitted. Mock OTP:",
    });
    await expect(updateMessage).toBeVisible();
    const updateText = (await updateMessage.textContent()) ?? "";
    const secondOtp = updateText.match(/(\d{6})/)?.[1] ?? "";
    expect(secondOtp).toHaveLength(6);

    await page.getByLabel("OTP Code").fill(secondOtp);
    await page.getByRole("button", { name: "Verify Payout Method" }).click();
    await expect(page.getByText(/Account holder name does not match/).first()).toBeVisible();
    await expect(page.getByText("reverification_required")).toBeVisible();
    await expect(page.getByText("Status: rejected • Name match: mismatched")).toBeVisible();
  });
});
