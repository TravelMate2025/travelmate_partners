import { appConfig } from "@/lib/config";
import type { ApiAccessApi } from "@/modules/api-access/contracts";
import { mockApiAccessApi } from "@/modules/api-access/mock-api-access-api";
import { realApiAccessApi } from "@/modules/api-access/real-api-access-api";

export const apiAccessClient: ApiAccessApi = appConfig.useMockApi
  ? mockApiAccessApi
  : realApiAccessApi;
