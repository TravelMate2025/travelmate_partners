import { beforeEach, describe, expect, it } from "vitest";

import { staysClient } from "@/modules/stays/stays-client";

function resetStorage() {
  window.localStorage.clear();
}

describe("Flow 2.5 strict alignment (stay listing management)", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("follows create, enrich, draft/review, tracked transitions, edit/pause/archive lifecycle", async () => {
    const userId = "flow25-strict-user";

    // User creates stay listing and enters core details.
    let stay = await staysClient.createStay(userId, {
      propertyType: "hotel",
      name: "Strict Flow Suites",
      description: "Initial core details",
      address: "10 Admiralty Way",
      city: "Lagos",
      country: "Nigeria",
    });
    expect(stay.status).toBe("draft");
    expect(stay.name).toBe("Strict Flow Suites");

    // User uploads images and optional room/unit data.
    stay = await staysClient.addImage(userId, stay.id, {
      fileName: "front.jpg",
      fileType: "image/jpeg",
      fileSize: 125_000,
    });
    stay = await staysClient.upsertRoom(userId, stay.id, {
      name: "Deluxe Room",
      occupancy: 2,
      bedConfiguration: "1 King Bed",
      baseRate: 140,
    });
    expect(stay.images.length).toBe(1);
    expect(stay.rooms.length).toBe(1);

    // Save as draft by editing without submission.
    stay = await staysClient.updateStay(userId, stay.id, {
      description: "Updated while still in draft",
      amenities: ["wifi", "pool"],
    });
    expect(stay.status).toBe("draft");
    expect(stay.description).toBe("Updated while still in draft");

    // System tracks listing state transitions.
    await expect(staysClient.updateStatus(userId, stay.id, "live")).rejects.toThrow(
      "Invalid status transition: draft -> live",
    );

    stay = await staysClient.updateStatus(userId, stay.id, "pending");
    expect(stay.status).toBe("rejected");

    stay = await staysClient.updateStatus(userId, stay.id, "pending");
    expect(stay.status).toBe("approved");

    stay = await staysClient.updateStatus(userId, stay.id, "live");
    expect(stay.status).toBe("live");

    // User edits, pauses, or archives listing as needed.
    stay = await staysClient.updateStay(userId, stay.id, {
      houseRules: "No smoking",
    });
    expect(stay.houseRules).toBe("No smoking");

    stay = await staysClient.updateStatus(userId, stay.id, "paused");
    expect(stay.status).toBe("paused");

    stay = await staysClient.archiveStay(userId, stay.id);
    expect(stay.status).toBe("archived");
  });
});
