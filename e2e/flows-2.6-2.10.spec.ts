import { expect, test } from "@playwright/test";
import { signupAndLoginGetUserId, seedProfileAndVerification } from "./helpers";

test.describe("TravelMate Partner implemented UI flows (2.6-2.10)", () => {
  test("covers pricing, transfer scheduling, and data quality interactions", async ({ page }) => {
    const email = `flow26+${Date.now()}@example.com`;
    const phone = "+2348000000000";
    const password = "Password123!";
    const stayId = `stay-${Date.now()}`;
    const transferId = `transfer-${Date.now()}`;
    const now = new Date().toISOString();

    const userId = await signupAndLoginGetUserId(page, email, phone, password);

    await seedProfileAndVerification(page, userId, now);

    await page.evaluate(
      ({ seededUserId, seededStayId, seededTransferId, ts }) => {
        window.localStorage.setItem(
          "tm_partner_stays_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: [
                {
                  id: seededStayId,
                  userId: seededUserId,
                  status: "draft",
                  propertyType: "hotel",
                  name: "Flow 2.6 Stay",
                  description: "",
                  address: "1 Marina Road",
                  city: "Lagos",
                  country: "Nigeria",
                  amenities: [],
                  houseRules: "",
                  checkInTime: "",
                  checkOutTime: "",
                  cancellationPolicy: "",
                  images: [],
                  rooms: [],
                  createdAt: ts,
                  updatedAt: ts,
                },
              ],
            },
          }),
        );

        window.localStorage.setItem(
          "tm_partner_transfers_state_v1",
          JSON.stringify({
            byUserId: {
              [seededUserId]: [
                {
                  id: seededTransferId,
                  userId: seededUserId,
                  status: "draft",
                  name: "Flow 2.8 Transfer",
                  description: "",
                  transferType: "airport",
                  pickupPoint: "MM2 Airport",
                  dropoffPoint: "Victoria Island",
                  vehicleClass: "SUV",
                  passengerCapacity: 4,
                  luggageCapacity: 2,
                  features: [],
                  coverageArea: "",
                  operatingHours: "",
                  currency: "NGN",
                  baseFare: 0,
                  nightSurcharge: 0,
                  images: [],
                  createdAt: ts,
                  updatedAt: ts,
                },
              ],
            },
          }),
        );
      },
      { seededUserId: userId, seededStayId: stayId, seededTransferId: transferId, ts: now },
    );

    await page.goto("/pricing-availability");
    await expect(page.getByRole("heading", { name: "Pricing & Availability" })).toBeVisible();
    await page.getByRole("button", { name: "Save Pricing & Availability" }).click();
    await expect(
      page.getByRole("status").getByText("Pricing and availability saved."),
    ).toBeVisible();

    await page.goto("/transfer-pricing-scheduling");
    await expect(page.getByRole("heading", { name: "Transfer Pricing & Scheduling" })).toBeVisible();
    await page.getByRole("button", { name: "Save Pricing & Scheduling" }).click();
    await expect(page.getByText("Transfer pricing and scheduling saved.")).toBeVisible();

    await page.goto(`/stays/${stayId}`);
    await expect(page.getByRole("heading", { name: "Data Quality" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(page.getByText("Cannot submit stay. Missing required fields: Description.")).toBeVisible();

    await page.goto(`/transfers/${transferId}`);
    await expect(page.getByRole("heading", { name: "Data Quality" })).toBeVisible();
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await expect(
      page.getByText("Cannot submit transfer. Missing required fields: Coverage Area."),
    ).toBeVisible();
  });
});
