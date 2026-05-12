import type { TransferListing, TransferStatus } from "@/modules/transfers/contracts";

const ALLOWED_NEXT: Record<TransferStatus, TransferStatus[]> = {
  draft: ["pending", "archived"],
  pending: ["approved", "rejected", "draft", "archived"],
  approved: ["live", "paused", "archived"],
  live: ["paused", "archived"],
  paused: ["live", "draft", "archived"],
  paused_by_admin: [],
  rejected: ["draft", "pending", "archived"],
  archived: ["draft"],
};

export function canTransitionTransfer(from: TransferStatus, to: TransferStatus) {
  return ALLOWED_NEXT[from].includes(to);
}

export function validateTransferForSubmission(item: TransferListing) {
  const required = [
    item.name,
    item.transferType,
    item.pickupPoint,
    item.dropoffPoint,
    item.vehicleClass,
    item.coverageArea,
  ];

  return (
    required.every((field) => String(field).trim().length > 0) &&
    item.passengerCapacity > 0 &&
    item.luggageCapacity >= 0
  );
}

export function transitionTransferStatus(
  item: TransferListing,
  next: TransferStatus,
): TransferListing {
  if (!canTransitionTransfer(item.status, next)) {
    throw new Error(`Invalid transfer status transition: ${item.status} -> ${next}`);
  }

  if (next === "pending" && !validateTransferForSubmission(item)) {
    throw new Error("Missing required transfer fields for submission.");
  }

  return {
    ...item,
    status: next,
    updatedAt: new Date().toISOString(),
  };
}
