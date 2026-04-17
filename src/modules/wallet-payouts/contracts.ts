export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "reversed";

export type WalletSummary = {
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  currency: string;
};

export type PayoutRecord = {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  createdAt: string;
};

export type WalletPayoutsApi = {
  getWalletSummary(userId: string): Promise<WalletSummary>;
  listPayouts(userId: string): Promise<PayoutRecord[]>;
};
