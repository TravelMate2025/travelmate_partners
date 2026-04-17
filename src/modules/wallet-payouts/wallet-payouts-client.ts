import { appConfig } from "@/lib/config";
import type { WalletPayoutsApi } from "@/modules/wallet-payouts/contracts";
import { mockWalletPayoutsApi } from "@/modules/wallet-payouts/mock-wallet-payouts-api";
import { realWalletPayoutsApi } from "@/modules/wallet-payouts/real-wallet-payouts-api";

export const walletPayoutsClient: WalletPayoutsApi = appConfig.useMockApi
  ? mockWalletPayoutsApi
  : realWalletPayoutsApi;
