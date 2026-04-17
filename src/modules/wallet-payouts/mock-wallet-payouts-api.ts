import type { PayoutRecord, WalletPayoutsApi, WalletSummary } from "@/modules/wallet-payouts/contracts";

export const mockWalletPayoutsApi: WalletPayoutsApi = {
  async getWalletSummary(_userId: string): Promise<WalletSummary> {
    return {
      pendingBalance: 45000,
      availableBalance: 120000,
      paidBalance: 830000,
      currency: "NGN",
    };
  },

  async listPayouts(_userId: string): Promise<PayoutRecord[]> {
    return [
      {
        id: "payout-1",
        amount: 50000,
        currency: "NGN",
        status: "paid",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "payout-2",
        amount: 75000,
        currency: "NGN",
        status: "processing",
        createdAt: new Date().toISOString(),
      },
    ];
  },
};
