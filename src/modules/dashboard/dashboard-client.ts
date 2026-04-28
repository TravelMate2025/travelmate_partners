import type { DashboardApi } from "@/modules/dashboard/contracts";
import { mockDashboardApi } from "@/modules/dashboard/mock-dashboard-api";

// Backend /partners/{id}/dashboard is not yet implemented (Phase 3+).
// Dashboard data remains on mock until the real endpoint is delivered.
export const dashboardClient: DashboardApi = mockDashboardApi;
