import { apiRequest } from "@/lib/http-client";
import type {
  PayoutRecord,
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
};
