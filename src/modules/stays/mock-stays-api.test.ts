import { beforeEach, describe, expect, it } from "vitest";

import { mockStaysApi } from "@/modules/stays/mock-stays-api";

function resetStorage() {
  window.localStorage.clear();
}

describe("mockStaysApi", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("supports draft -> rejected -> approved lifecycle through submission flow", async () => {
    const userId = "u1";
    const stay = await mockStaysApi.createStay(userId, {
      propertyType: "hotel",
      name: "Harbor Hotel",
      description: "Near waterfront",
      address: "1 Ocean View",
      city: "Lagos",
      country: "Nigeria",
    });

    let updated = await mockStaysApi.updateStatus(userId, stay.id, "pending");
    expect(updated.status).toBe("rejected");
    expect(updated.moderationFeedback).toContain("First review rejected");

    updated = await mockStaysApi.updateStatus(userId, stay.id, "pending");
    expect(updated.status).toBe("approved");
  });

  it("validates image type and supports image order updates", async () => {
    const userId = "u1";
    const stay = await mockStaysApi.createStay(userId, {
      propertyType: "apartment",
      name: "Central Loft",
      description: "City center",
      address: "22 Broad Street",
      city: "Abuja",
      country: "Nigeria",
    });

    await expect(
      mockStaysApi.addImage(userId, stay.id, {
        fileName: "bad.gif",
        fileType: "image/gif",
        fileSize: 1024,
      }),
    ).rejects.toThrow("Invalid image format");

    let updated = await mockStaysApi.addImage(userId, stay.id, {
      fileName: "one.jpg",
      fileType: "image/jpeg",
      fileSize: 1024,
    });
    updated = await mockStaysApi.addImage(userId, stay.id, {
      fileName: "two.jpg",
      fileType: "image/jpeg",
      fileSize: 1024,
    });

    const originalIds = updated.images.map((img) => img.id);
    const reversed = [...originalIds].reverse();
    updated = await mockStaysApi.reorderImages(userId, stay.id, reversed);

    expect(updated.images[0].id).toBe(reversed[0]);
    expect(updated.images[1].id).toBe(reversed[1]);
  });

  it("adds and removes rooms", async () => {
    const userId = "u1";
    const stay = await mockStaysApi.createStay(userId, {
      propertyType: "villa",
      name: "Palm Villa",
      description: "Private villa",
      address: "5 Palm Avenue",
      city: "Ibadan",
      country: "Nigeria",
    });

    let updated = await mockStaysApi.upsertRoom(userId, stay.id, {
      name: "Deluxe Room",
      occupancy: 2,
      bedConfiguration: "1 King Bed",
      baseRate: 80,
    });
    expect(updated.rooms).toHaveLength(1);

    const roomId = updated.rooms[0].id;
    updated = await mockStaysApi.removeRoom(userId, stay.id, roomId);
    expect(updated.rooms).toHaveLength(0);
  });
});
