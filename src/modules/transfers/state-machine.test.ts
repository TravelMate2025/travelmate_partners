import { describe, expect, it } from "vitest";

import {
  canTransitionTransfer,
  transitionTransferStatus,
  validateTransferForSubmission,
} from "@/modules/transfers/state-machine";
import type { TransferListing } from "@/modules/transfers/contracts";

function makeTransfer(status: TransferListing["status"]): TransferListing {
  const now = new Date().toISOString();
  return {
    id: "transfer-1",
    userId: "u1",
    status,
    name: "Airport Express",
    description: "",
    transferType: "airport",
    pickupPoint: "MM2 Airport",
    dropoffPoint: "Victoria Island",
    vehicleClass: "SUV",
    passengerCapacity: 4,
    luggageCapacity: 3,
    features: [],
    coverageArea: "Lagos Island",
    operatingHours: "",
    currency: "NGN",
    baseFare: 0,
    nightSurcharge: 0,
    cancellationPolicy: "",
    images: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe("transfers state machine", () => {
  it("supports valid transitions and rejects invalid transitions", () => {
    expect(canTransitionTransfer("draft", "pending")).toBe(true);
    expect(canTransitionTransfer("live", "approved")).toBe(false);

    const item = makeTransfer("live");
    expect(() => transitionTransferStatus(item, "approved")).toThrow(
      "Invalid transfer status transition",
    );
  });

  it("requires required fields before submission", () => {
    const item = makeTransfer("draft");
    expect(validateTransferForSubmission(item)).toBe(true);

    item.pickupPoint = "";
    expect(validateTransferForSubmission(item)).toBe(false);
    expect(() => transitionTransferStatus(item, "pending")).toThrow(
      "Missing required transfer fields for submission.",
    );
  });
});
