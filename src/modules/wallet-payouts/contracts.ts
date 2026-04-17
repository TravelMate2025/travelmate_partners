export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "reversed";

export type WalletSummary = {
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  currency: string;
  reserveHoldDays: number;
};

export type PayoutSchedule = "weekly" | "bi-weekly" | "monthly";

export type PayoutSettings = {
  schedule: PayoutSchedule;
  minimumThreshold: number;
  manualModeEnabled: boolean;
  updatedAt: string;
};

export type PayoutRecord = {
  id: string;
  reference: string;
  grossAmount: number;
  commissionFee: number;
  taxWithholding: number;
  totalDeductions: number;
  netAmount: number;
  amount: number;
  currency: string;
  status: PayoutStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type WalletPayoutsApi = {
  getWalletSummary(userId: string): Promise<WalletSummary>;
  listPayouts(userId: string): Promise<PayoutRecord[]>;
  getPayoutSettings(userId: string): Promise<PayoutSettings>;
  updatePayoutSettings(
    userId: string,
    input: Partial<Pick<PayoutSettings, "schedule" | "minimumThreshold" | "manualModeEnabled">>,
  ): Promise<PayoutSettings>;
  requestPayout(userId: string, amount: number): Promise<PayoutRecord>;
  downloadPayoutStatement(userId: string, payoutId: string): Promise<string>;
};
