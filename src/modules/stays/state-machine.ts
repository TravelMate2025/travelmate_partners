import type { StayListing, StayStatus } from "@/modules/stays/contracts";

const ALLOWED_NEXT: Record<StayStatus, StayStatus[]> = {
  draft: ["pending", "archived"],
  pending: ["approved", "rejected", "draft", "archived"],
  approved: ["live", "paused", "archived"],
  live: ["paused", "archived"],
  paused: ["live", "archived"],
  rejected: ["draft", "pending", "archived"],
  archived: ["draft"],
};

export function canTransition(from: StayStatus, to: StayStatus) {
  return ALLOWED_NEXT[from].includes(to);
}

export function validateStayForSubmission(item: StayListing) {
  const required = [item.propertyType, item.name, item.description, item.address, item.city, item.country];
  return required.every((field) => field.trim().length > 0);
}

export function transitionStatus(item: StayListing, next: StayStatus): StayListing {
  if (!canTransition(item.status, next)) {
    throw new Error(`Invalid status transition: ${item.status} -> ${next}`);
  }

  if (next === "pending" && !validateStayForSubmission(item)) {
    throw new Error("Missing required stay fields for submission.");
  }

  return {
    ...item,
    status: next,
    updatedAt: new Date().toISOString(),
  };
}
