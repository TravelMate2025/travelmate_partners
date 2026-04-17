"use client";

import { FeatureComingSoon } from "@/components/common/feature-coming-soon";

export default function ReportsPage() {
  return (
    <FeatureComingSoon
      title="Reports & Insights"
      description="Measure listing health and partner performance."
      highlights={[
        "Track listing views, impressions, and search appearances.",
        "Surface listing health issues and missing data fields.",
        "Export report data to CSV.",
      ]}
    />
  );
}
