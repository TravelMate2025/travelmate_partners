"use client";

import { FeatureComingSoon } from "@/components/common/feature-coming-soon";

export default function NotificationsPage() {
  return (
    <FeatureComingSoon
      title="Notifications"
      description="Track product events and partner communication."
      highlights={[
        "View in-app notifications for verification and moderation updates.",
        "Review unread/read status and actionable items.",
        "Centralize reminder notifications for incomplete listings.",
      ]}
    />
  );
}
