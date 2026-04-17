import { appConfig } from "@/lib/config";
import type { TransfersApi } from "@/modules/transfers/contracts";
import { mockTransfersApi } from "@/modules/transfers/mock-transfers-api";
import { realTransfersApi } from "@/modules/transfers/real-transfers-api";

export const transfersClient: TransfersApi = appConfig.useMockApi
  ? mockTransfersApi
  : realTransfersApi;
