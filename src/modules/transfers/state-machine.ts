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
  const destinationRoutes = Array.isArray(item.destinationRoutes) && item.destinationRoutes.length > 0
    ? item.destinationRoutes
    : item.destinationCity && item.destinationArea
      ? [{
          destinationCity: item.destinationCity,
          destinationArea: item.destinationArea,
          destinationSubArea: item.destinationSubArea ?? "",
        }]
      : [];
  const required = [
    item.name,
    item.transferType,
    item.pickupPoint,
    item.vehicleClass,
    item.coverageArea,
  ];

  return (
    required.every((field) => String(field).trim().length > 0) &&
    item.passengerCapacity > 0 &&
    item.luggageCapacity >= 0 &&
    destinationRoutes.length > 0 &&
    destinationRoutes.every((route) =>
      String(route.destinationCity).trim().length > 0 &&
      String(route.destinationArea).trim().length > 0,
    )
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
