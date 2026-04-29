import type { PartnerNotification } from "@/modules/notifications/contracts";

const CRITICAL_SETTLEMENT_KEYWORDS = ["failed", "failure", "reversed", "refund"];
const CRITICAL_MODERATION_KEYWORDS = ["suspend", "suspended", "reject", "rejected", "unpublish"];

function includesAny(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function isCriticalNotification(notification: PartnerNotification) {
  if (notification.eventType === "listing_moderation_updated") {
    return (
      includesAny(notification.title, CRITICAL_MODERATION_KEYWORDS)
      || includesAny(notification.message, CRITICAL_MODERATION_KEYWORDS)
    );
  }

  if (notification.eventType === "settlement_refund_status_updated") {
    return (
      includesAny(notification.title, CRITICAL_SETTLEMENT_KEYWORDS)
      || includesAny(notification.message, CRITICAL_SETTLEMENT_KEYWORDS)
    );
  }

  return false;
}

export function maybeShowBrowserNotification(notification: PartnerNotification) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  if (!isCriticalNotification(notification)) {
    return;
  }

  const title = notification.title || "TravelMate Notification";
  const body = notification.message || "You have a critical update.";
  // Optional escalation path for critical events when the app is in background.
  if (document.visibilityState === "hidden") {
    // Browser push fallback. SMS escalation remains backend-owned.
    new Notification(title, { body });
  }
}
