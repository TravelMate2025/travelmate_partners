import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEvents } from "@/modules/audit/audit-log";
import { mockTransfersApi } from "@/modules/transfers/mock-transfers-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockTransfersApi", () => {
  beforeEach(() => {
    resetStorage();
    clearAuditEvents();
  });

  it("supports draft -> rejected -> approved lifecycle through submission flow", async () => {
    const userId = "u1";
    const item = await mockTransfersApi.createTransfer(userId, {
      name: "City Airport Shuttle",
      transferType: "airport",
      pickupPoint: "MM2",
      dropoffPoint: "Victoria Island",
      vehicleClass: "SUV",
      passengerCapacity: 4,
      luggageCapacity: 3,
      coverageArea: "Lagos Island",
    });

    let updated = await mockTransfersApi.updateStatus(userId, item.id, "pending");
    expect(updated.status).toBe("rejected");
    expect(updated.moderationFeedback).toContain("First review rejected");

    updated = await mockTransfersApi.updateStatus(userId, item.id, "pending");
    expect(updated.status).toBe("approved");
  });

  it("updates fields and archives transfer", async () => {
    const userId = "u1";
    const item = await mockTransfersApi.createTransfer(userId, {
      name: "City Transfer",
      transferType: "one_way",
      pickupPoint: "Lekki",
      dropoffPoint: "Ikeja",
      vehicleClass: "Sedan",
      passengerCapacity: 3,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });

    let updated = await mockTransfersApi.updateTransfer(userId, item.id, {
      features: ["ac", "wifi"],
      baseFare: 20000,
    });
    expect(updated.features).toContain("wifi");

    updated = await mockTransfersApi.archiveTransfer(userId, item.id);
    expect(updated.status).toBe("archived");
  });

  it("validates transfer image type and supports reorder/replace/remove", async () => {
    const userId = "u1";
    const item = await mockTransfersApi.createTransfer(userId, {
      name: "Image Transfer",
      transferType: "one_way",
      pickupPoint: "Lekki",
      dropoffPoint: "Ikeja",
      vehicleClass: "Sedan",
      passengerCapacity: 3,
      luggageCapacity: 2,
      coverageArea: "Lagos",
    });

    await expect(
      mockTransfersApi.addImage(userId, item.id, {
        fileName: "bad.gif",
        fileType: "image/gif",
        fileSize: 1000,
      }),
    ).rejects.toThrow("Invalid image format");

    let updated = await mockTransfersApi.addImage(userId, item.id, {
      fileName: "one.jpg",
      fileType: "image/jpeg",
      fileSize: 2000,
    });
    updated = await mockTransfersApi.addImage(userId, item.id, {
      fileName: "two.png",
      fileType: "image/png",
      fileSize: 2200,
    });

    const orderedIds = updated.images.map((img) => img.id);
    updated = await mockTransfersApi.reorderImages(userId, item.id, [...orderedIds].reverse());
    expect(updated.images[0].id).toBe(orderedIds[1]);

    const targetId = updated.images[0].id;
    updated = await mockTransfersApi.replaceImage(userId, item.id, targetId, {
      fileName: "two-new.webp",
      fileType: "image/webp",
      fileSize: 2400,
    });
    expect(updated.images[0].id).toBe(targetId);
    expect(updated.images[0].fileName).toBe("two-new.webp");

    updated = await mockTransfersApi.removeImage(userId, item.id, targetId);
    expect(updated.images).toHaveLength(1);
  });
});
