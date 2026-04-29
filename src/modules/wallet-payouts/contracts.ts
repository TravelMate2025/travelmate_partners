export type SettlementStatus =
  | "pending_completion"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export type RefundStatus =
  | "requested"
  | "partner_notified"
  | "refunded"
  | "disputed"
  | "recovered";

export type WalletSummary = {
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  currency: string;
  reserveHoldDays: number;
};

export type SettlementSettings = {
  autoSettleOnBookingCompletion: boolean;
  reserveHoldDays: number;
  requireAdminRefundNotification: boolean;
  updatedAt: string;
};

export type EligibleBooking = {
  id: number;
  bookingReference: string;
  grossAmount: number;
  currency: string;
  sourceGrossAmount?: number;
  sourceCurrency?: string;
  conversionRateUsed?: string;
  convertible?: boolean;
  conversionError?: string | null;
  completedAt: string;
  sourceLabel: string;
};

export type EligibleBookingPage = {
  results: EligibleBooking[];
  count: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type SettlementRecord = {
  id: string;
  bookingReference: string;
  settlementReference: string;
  grossAmount: number;
  commissionFee: number;
  taxWithholding: number;
  totalDeductions: number;
  netAmount: number;
  currency: string;
  status: SettlementStatus;
  refundStatus?: RefundStatus;
  refundedAmount?: number;
  refundReason?: string;
  failureReason?: string;
  completedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SettlementAccountMethodType = "bank_account" | "mobile_money";
export type SettlementAccountVerificationStatus = "pending" | "verified" | "rejected";
export type SettlementAccountNameMatchStatus = "matched" | "mismatched";

export type SettlementAccount = {
  id: string;
  methodType: SettlementAccountMethodType;
  country: string;
  currency: string;
  accountHolderName: string;
  bankName?: string;
  ibanMasked?: string;
  accountNumberMasked?: string;
  routingCodeMasked?: string;
  swiftCodeMasked?: string;
  mobileMoneyProvider?: string;
  mobileNumberMasked?: string;
  status: SettlementAccountVerificationStatus;
  nameMatchStatus: SettlementAccountNameMatchStatus;
  isDefault: boolean;
  maskedSummary: string;
  rejectionReason?: string;
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  updatedAt: string;
  createdAt: string;
};

export type SettlementAccountHistoryEntry = {
  id: string;
  accountId: string;
  action:
    | "submitted"
    | "otp_sent"
    | "verified"
    | "rejected"
    | "updated"
    | "reverification_required"
    | "set_default";
  message: string;
  createdAt: string;
};

export type SettlementAccountUpsertInput = {
  accountId?: string;
  methodType: SettlementAccountMethodType;
  country: string;
  currency: string;
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  routingCode?: string;
  swiftCode?: string;
  mobileMoneyProvider?: string;
  mobileNumber?: string;
  isDefault?: boolean;
};

export type SubmitSettlementAccountResult = {
  account: SettlementAccount;
  otpCodeHint?: string;
  otpDeliveryChannels?: Array<"email" | "sms">;
};

export type WalletPayoutsApi = {
  getWalletSummary(userId: string): Promise<WalletSummary>;
  listSettlements(userId: string): Promise<SettlementRecord[]>;
  getSettlementSettings(userId: string): Promise<SettlementSettings>;
  updateSettlementSettings(
    userId: string,
    input: Partial<
      Pick<
        SettlementSettings,
        "autoSettleOnBookingCompletion" | "reserveHoldDays" | "requireAdminRefundNotification"
      >
    >,
  ): Promise<SettlementSettings>;
  recordBookingCompletion(
    userId: string,
    input: { bookingReference: string; grossAmount?: number },
  ): Promise<SettlementRecord>;
  listEligibleBookings(
    userId: string,
    input?: { page?: number; pageSize?: number; search?: string },
  ): Promise<EligibleBookingPage>;
  createSettlementsFromBookings(
    userId: string,
    input: { bookingReferences: string[] },
  ): Promise<{ created: SettlementRecord[]; skipped: Array<{ bookingReference: string; reason: string }>; failed: Array<{ bookingReference: string; reason: string }> }>;
  recordCancellationRefund(
    userId: string,
    input: {
      settlementId: string;
      refundAmount: number;
      reason: string;
      status?: RefundStatus;
    },
  ): Promise<SettlementRecord>;
  downloadSettlementStatement(userId: string, settlementId: string): Promise<string>;
  listSettlementAccounts(userId: string): Promise<SettlementAccount[]>;
  archiveSettlementAccount(userId: string, accountId: string): Promise<{ archivedAccountId: string }>;
  listSettlementAccountHistory(userId: string): Promise<SettlementAccountHistoryEntry[]>;
  submitSettlementAccount(
    userId: string,
    input: SettlementAccountUpsertInput,
  ): Promise<SubmitSettlementAccountResult>;
  verifySettlementAccountOtp(
    userId: string,
    input: { accountId: string; otpCode: string },
  ): Promise<SettlementAccount>;
};
