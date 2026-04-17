import { appConfig } from "@/lib/config";
import type { ReportsApi } from "@/modules/reports/contracts";
import { mockReportsApi } from "@/modules/reports/mock-reports-api";
import { realReportsApi } from "@/modules/reports/real-reports-api";

export const reportsClient: ReportsApi = appConfig.useMockApi
  ? mockReportsApi
  : realReportsApi;
