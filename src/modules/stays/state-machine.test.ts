import { describe, expect, it } from "vitest";

import { canTransition, transitionStatus, validateStayForSubmission } from "@/modules/stays/state-machine";
import type { StayListing } from "@/modules/stays/contracts";

function makeStay(status: StayListing["status"]): StayListing {
  const now = new Date().toISOString();
  return {
    id: "stay-1",
    userId: "u1",
    status,
    propertyType: "hotel",
    name: "Lagos Suites",
    description: "Comfortable stay",
    address: "12 Marina Road",
    city: "Lagos",
    country: "Nigeria",
    amenities: ["wifi"],
    houseRules: "",
    checkInTime: "",
    checkOutTime: "",
    cancellationPolicy: "",
    images: [],
    rooms: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe("stays state machine", () => {
  it("supports valid transitions and rejects invalid transitions", () => {
    expect(canTransition("draft", "pending")).toBe(true);
    expect(canTransition("live", "approved")).toBe(false);

    const stay = makeStay("live");
    expect(() => transitionStatus(stay, "approved")).toThrow("Invalid status transition");
  });

  it("requires required fields before submission", () => {
    const stay = makeStay("draft");
    expect(validateStayForSubmission(stay)).toBe(true);

    stay.name = "";
    expect(validateStayForSubmission(stay)).toBe(false);
    expect(() => transitionStatus(stay, "pending")).toThrow("Missing required stay fields for submission.");
  });
});
