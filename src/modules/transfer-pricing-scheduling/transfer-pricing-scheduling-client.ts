import { appConfig } from "@/lib/config";
import type { TransferPricingSchedulingApi } from "@/modules/transfer-pricing-scheduling/contracts";
import { mockTransferPricingSchedulingApi } from "@/modules/transfer-pricing-scheduling/mock-transfer-pricing-scheduling-api";
import { realTransferPricingSchedulingApi } from "@/modules/transfer-pricing-scheduling/real-transfer-pricing-scheduling-api";

export const transferPricingSchedulingClient: TransferPricingSchedulingApi = appConfig.useMockApi
  ? mockTransferPricingSchedulingApi
  : realTransferPricingSchedulingApi;
