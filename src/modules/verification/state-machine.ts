import type { PartnerVerification } from "@/modules/verification/contracts";

export function canSubmitVerification(item: PartnerVerification) {
  if (item.documents.length === 0) {
    return false;
  }

  return item.status === "pending" || item.status === "rejected";
}

export function shouldAutoResolvePending(item: PartnerVerification) {
  if (item.status !== "in_review" || !item.submittedAt) {
    return false;
  }

  const submittedAt = new Date(item.submittedAt).getTime();
  const now = Date.now();

  return now - submittedAt >= 1500;
}

export function resolvePending(item: PartnerVerification): PartnerVerification {
  if (!shouldAutoResolvePending(item)) {
    return item;
  }

  const next = { ...item, updatedAt: new Date().toISOString(), decidedAt: new Date().toISOString() };

  // Deterministic mock review lifecycle:
  // first submission => rejected for missing clarity,
  // second submission onward => approved.
  if (item.submissionCount <= 1) {
    next.status = "rejected";
    next.rejectionReason =
      "Document quality check failed: please re-upload clearer ID and business proof files.";
    return next;
  }

  next.status = "approved";
  next.rejectionReason = undefined;
  return next;
}
