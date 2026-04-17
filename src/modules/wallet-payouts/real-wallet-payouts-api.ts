import { apiRequest } from "@/lib/http-client";
import type {
  PayoutRecord,
  PayoutSettings,
  WalletPayoutsApi,
  WalletSummary,
} from "@/modules/wallet-payouts/contracts";

type Envelope<T> = { data: T };

export const realWalletPayoutsApi: WalletPayoutsApi = {
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    const response = await apiRequest<Envelope<WalletSummary>>(`/partners/${userId}/wallet/summary`);
    return response.data;
  },

  async listPayouts(userId: string): Promise<PayoutRecord[]> {
    const response = await apiRequest<Envelope<PayoutRecord[]>>(`/partners/${userId}/wallet/payouts`);
    return response.data;
  },

  async getPayoutSettings(userId: string): Promise<PayoutSettings> {
    const response = await apiRequest<Envelope<PayoutSettings>>(
      `/partners/${userId}/wallet/payout-settings`,
    );
    return response.data;
  },

  async updatePayoutSettings(userId: string, input): Promise<PayoutSettings> {
    const response = await apiRequest<Envelope<PayoutSettings>>(
      `/partners/${userId}/wallet/payout-settings`,
      {
        method: "PATCH",
        body: input,
      },
    );
    return response.data;
  },

  async requestPayout(userId: string, amount: number): Promise<PayoutRecord> {
    const response = await apiRequest<Envelope<PayoutRecord>>(
      `/partners/${userId}/wallet/payouts/request`,
      {
        method: "POST",
        body: { amount },
      },
    );
    return response.data;
  },

  async downloadPayoutStatement(userId: string, payoutId: string): Promise<string> {
    const response = await apiRequest<Envelope<{ csv: string }>>(
      `/partners/${userId}/wallet/payouts/${payoutId}/statement`,
      {
        method: "POST",
      },
    );
    return response.data.csv;
  },
};
