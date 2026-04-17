"use client";

import { FeatureComingSoon } from "@/components/common/feature-coming-soon";

export default function WalletPayoutsPage() {
  return (
    <FeatureComingSoon
      title="Wallet & Payouts"
      description="Monitor earnings and configure payout operations."
      highlights={[
        "View pending, available, and paid balances.",
        "Configure payout method and payout schedule.",
        "Track payout status: pending, processing, paid, failed, reversed.",
        "Download payout statements and deduction breakdowns.",
      ]}
    />
  );
}
