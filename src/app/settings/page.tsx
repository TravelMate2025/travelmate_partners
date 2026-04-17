"use client";

import { FeatureComingSoon } from "@/components/common/feature-coming-soon";

export default function SettingsPage() {
  return (
    <FeatureComingSoon
      title="Support & Settings"
      description="Manage account preferences and support operations."
      highlights={[
        "Update profile and security preferences.",
        "Submit support requests and track responses.",
        "Manage account deactivation and recovery preferences.",
      ]}
    />
  );
}
