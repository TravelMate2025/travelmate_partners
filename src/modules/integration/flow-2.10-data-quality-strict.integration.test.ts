import { beforeEach, describe, expect, it } from "vitest";

import { buildStayQualityReport, buildTransferQualityReport } from "@/modules/data-quality/listing-quality";
import { staysClient } from "@/modules/stays/stays-client";
import { transfersClient } from "@/modules/transfers/transfers-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.10 strict alignment (data quality tools)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("enforces required fields, computes completeness score, warns on duplicates, and supports correction re-submit", async () => {
    const userId = "flow210-user";

    let stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Quality Stay",
      description: "",
      address: "12 Marina",
      city: "Lagos",
      country: "Nigeria",
    });

    await expect(staysClient.updateStatus(userId, stay.id, "pending")).rejects.toThrow(
      "Cannot submit stay. Missing required fields: Description.",
    );

    stay = await staysClient.updateStay(userId, stay.id, { description: "Ready for review" });
    let duplicateStay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Quality Stay",
      description: "Another listing with same signature",
      address: "12 Marina",
      city: "Lagos",
      country: "Nigeria",
    });
    duplicateStay = await staysClient.updateStatus(userId, duplicateStay.id, "pending");
    expect(duplicateStay.status).toBe("rejected");
    expect(duplicateStay.moderationFeedback).toContain("Possible duplicate stay found");

    const stayReport = buildStayQualityReport(stay, await staysClient.listStays(userId));
    expect(stayReport.completenessScore).toBeGreaterThan(0);
    expect(stayReport.duplicateWarnings.length).toBeGreaterThan(0);

    let transfer = await transfersClient.createTransfer(userId, {
      name: "Airport Premium",
      transferType: "airport",
      pickupPoint: "MM2 Airport",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });
    transfer = await transfersClient.updateTransfer(userId, transfer.id, { transferType: "" });
    await expect(transfersClient.updateStatus(userId, transfer.id, "pending")).rejects.toThrow(
      "Cannot submit transfer. Missing required fields: Transfer Type.",
    );

    transfer = await transfersClient.updateTransfer(userId, transfer.id, { transferType: "airport" });
    let duplicateTransfer = await transfersClient.createTransfer(userId, {
      name: "Airport Premium 2",
      transferType: "airport",
      pickupPoint: "MM2 Airport",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });
    duplicateTransfer = await transfersClient.updateStatus(userId, duplicateTransfer.id, "pending");
    expect(duplicateTransfer.status).toBe("rejected");
    expect(duplicateTransfer.moderationFeedback).toContain("Possible duplicate transfer found");

    const transferReport = buildTransferQualityReport(
      transfer,
      await transfersClient.listTransfers(userId),
    );
    expect(transferReport.completenessScore).toBeGreaterThan(0);
    expect(transferReport.duplicateWarnings.length).toBeGreaterThan(0);
  });
});
