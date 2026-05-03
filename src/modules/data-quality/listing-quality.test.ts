import { describe, expect, it } from "vitest";

import { buildStayQualityReport, buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import type { StayListing } from "@/modules/stays/contracts";
import type { TransferListing } from "@/modules/transfers/contracts";

function makeStay(overrides: Partial<StayListing> = {}): StayListing {
  const now = new Date().toISOString();
  return {
    id: "stay-1",
    userId: "u1",
    status: "draft",
    propertyType: "hotel",
    name: "Harbor Stay",
    description: "City waterfront stay",
    address: "12 Marina",
    city: "Lagos",
    country: "Nigeria",
    amenities: ["wifi"],
    houseRules: "No smoking",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    cancellationPolicy: "Flexible",
    images: [],
    rooms: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeTransfer(overrides: Partial<TransferListing> = {}): TransferListing {
  const now = new Date().toISOString();
  return {
    id: "transfer-1",
    userId: "u1",
    status: "draft",
    name: "Airport Express",
    description: "Comfort transfer",
    transferType: "airport",
    pickupPoint: "MM2 Airport",
    dropoffPoint: "Victoria Island",
    vehicleClass: "SUV",
    passengerCapacity: 4,
    luggageCapacity: 2,
    features: ["ac"],
    coverageArea: "Lagos",
    operatingHours: "06:00-23:00",
    currency: "NGN",
    baseFare: 20000,
    nightSurcharge: 5000,
    cancellationPolicy: "",
    images: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("listing quality", () => {
  it("computes stay completeness and required missing fields", () => {
    const report = buildStayQualityReport(
      makeStay({ name: "", description: "", amenities: [] }),
      [makeStay()],
    );
    expect(report.completenessScore).toBeLessThan(100);
    expect(report.missingRequiredFields).toContain("Name");
    expect(report.missingRequiredFields).toContain("Description");
  });

  it("emits duplicate warning for same stay signature", () => {
    const stay = makeStay();
    const duplicate = makeStay({ id: "stay-2" });
    const report = buildStayQualityReport(stay, [stay, duplicate]);
    expect(report.duplicateWarnings.length).toBe(1);
  });

  it("computes transfer completeness and duplicate warning", () => {
    const transfer = makeTransfer({ transferType: "" });
    const duplicate = makeTransfer({ id: "transfer-2" });
    const report = buildTransferQualityReport(transfer, [transfer, duplicate]);
    expect(report.missingRequiredFields).toContain("Transfer Type");
    expect(report.duplicateWarnings.length).toBe(0);

    const duplicateReport = buildTransferQualityReport(duplicate, [duplicate, makeTransfer()]);
    expect(duplicateReport.duplicateWarnings.length).toBe(1);
  });

  it("handles legacy transfer records with missing array fields", () => {
    const legacy = {
      ...makeTransfer(),
      features: undefined,
      images: undefined,
    } as unknown as TransferListing;

    const report = buildTransferQualityReport(legacy, [legacy]);
    expect(report.completenessScore).toBeGreaterThanOrEqual(0);
    expect(report.missingRequiredFields.length).toBe(0);
  });
});
