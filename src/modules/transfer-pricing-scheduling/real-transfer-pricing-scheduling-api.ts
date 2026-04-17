import { apiRequest } from "@/lib/http-client";
import type {
  TransferPricingScheduling,
  TransferPricingSchedulingApi,
  UpsertTransferPricingSchedulingInput,
} from "@/modules/transfer-pricing-scheduling/contracts";

type Envelope<T> = { data: T };

export const realTransferPricingSchedulingApi: TransferPricingSchedulingApi = {
  async getPricingScheduling(userId, transferId) {
    const response = await apiRequest<Envelope<TransferPricingScheduling>>(
      `/partners/${userId}/transfers/${transferId}/pricing-scheduling`,
    );
    return response.data;
  },

  async upsertPricingScheduling(userId, transferId, input: UpsertTransferPricingSchedulingInput) {
    const response = await apiRequest<Envelope<TransferPricingScheduling>>(
      `/partners/${userId}/transfers/${transferId}/pricing-scheduling`,
      {
        method: "PUT",
        body: input,
      },
    );
    return response.data;
  },
};
