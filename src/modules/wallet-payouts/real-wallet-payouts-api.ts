import { apiRequest } from "@/lib/http-client";
import type {
  EligibleBookingPage,
  SettlementAccount,
  SettlementAccountHistoryEntry,
  SubmitSettlementAccountResult,
  SettlementRecord,
  SettlementSettings,
  WalletPayoutsApi,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";

type Envelope<T> = { data: T };

export const realWalletPayoutsApi: WalletPayoutsApi = {
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    const response = await apiRequest<Envelope<WalletSummary>>(`/partners/${userId}/wallet/summary`);
    return response.data;
  },

  async listSettlements(userId: string): Promise<SettlementRecord[]> {
    const response = await apiRequest<Envelope<SettlementRecord[]>>(
      `/partners/${userId}/wallet/settlements`,
    );
    return response.data;
  },

  async getSettlementSettings(userId: string): Promise<SettlementSettings> {
    const response = await apiRequest<Envelope<SettlementSettings>>(
      `/partners/${userId}/wallet/settlement-settings`,
    );
    return response.data;
  },

  async updateSettlementSettings(userId: string, input): Promise<SettlementSettings> {
    const response = await apiRequest<Envelope<SettlementSettings>>(
      `/partners/${userId}/wallet/settlement-settings`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return response.data;
  },

  async recordBookingCompletion(userId: string, input): Promise<SettlementRecord> {
    const response = await apiRequest<Envelope<SettlementRecord>>(
      `/partners/${userId}/wallet/settlements/record-completion`,
      {
        method: "POST",
        body: { bookingReference: input.bookingReference },
      },
    );
    return response.data;
  },

  async listEligibleBookings(userId: string, input = {}): Promise<EligibleBookingPage> {
    const params = new URLSearchParams();
    if (input.page) params.set("page", String(input.page));
    if (input.pageSize) params.set("page_size", String(input.pageSize));
    if (input.search) params.set("search", input.search);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<Envelope<EligibleBookingPage>>(
      `/partners/${userId}/wallet/eligible-bookings${suffix}`,
    );
    return response.data;
  },

  async createSettlementsFromBookings(userId: string, input) {
    const response = await apiRequest<
      Envelope<{
        created: SettlementRecord[];
        skipped: Array<{ bookingReference: string; reason: string }>;
        failed: Array<{ bookingReference: string; reason: string }>;
      }>
    >(`/partners/${userId}/wallet/settlements/from-bookings`, {
      method: "POST",
      body: input,
    });
    return response.data;
  },

  async recordCancellationRefund(userId: string, input): Promise<SettlementRecord> {
    const response = await apiRequest<Envelope<SettlementRecord>>(
      `/partners/${userId}/wallet/settlements/refund`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },

  async downloadSettlementStatement(userId: string, settlementId: string): Promise<string> {
    const response = await apiRequest<Envelope<{ csv: string }>>(
      `/partners/${userId}/wallet/settlements/${settlementId}/statement`,
      {
        method: "POST",
      },
    );
    return response.data.csv;
  },

  async listSettlementAccounts(userId: string): Promise<SettlementAccount[]> {
    const response = await apiRequest<Envelope<SettlementAccount[]>>(
      `/partners/${userId}/wallet/settlement-accounts`,
    );
    return response.data;
  },

  async archiveSettlementAccount(userId: string, accountId: string): Promise<{ archivedAccountId: string }> {
    const response = await apiRequest<Envelope<{ archivedAccountId: string }>>(
      `/partners/${userId}/wallet/settlement-accounts/${accountId}`,
      {
        method: "DELETE",
      },
    );
    return response.data;
  },

  async listSettlementAccountHistory(userId: string): Promise<SettlementAccountHistoryEntry[]> {
    const response = await apiRequest<Envelope<SettlementAccountHistoryEntry[]>>(
      `/partners/${userId}/wallet/settlement-accounts/history`,
    );
    return response.data;
  },

  async submitSettlementAccount(
    userId: string,
    input,
  ): Promise<SubmitSettlementAccountResult> {
    const response = await apiRequest<Envelope<SubmitSettlementAccountResult>>(
      `/partners/${userId}/wallet/settlement-accounts`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },

  async verifySettlementAccountOtp(userId: string, input): Promise<SettlementAccount> {
    const response = await apiRequest<Envelope<SettlementAccount>>(
      `/partners/${userId}/wallet/settlement-accounts/verify-otp`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },
};
