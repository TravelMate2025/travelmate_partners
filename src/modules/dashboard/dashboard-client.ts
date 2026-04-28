import { appConfig } from "@/lib/config";
import type { DashboardApi } from "@/modules/dashboard/contracts";
import { mockDashboardApi } from "@/modules/dashboard/mock-dashboard-api";
import { realDashboardApi } from "@/modules/dashboard/real-dashboard-api";

export const dashboardClient: DashboardApi = appConfig.useMockApi
  ? mockDashboardApi
  : realDashboardApi;
