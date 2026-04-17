export type QuickActionType = "add_stay" | "add_transfer" | "update_availability";

export type DashboardSummary = {
  activeListings: number;
  pendingApprovals: number;
  totalViews: number;
};

export type DashboardAlert = {
  id: string;
  level: "info" | "warning" | "success";
  message: string;
  actionLabel?: string;
  actionPath?: string;
};

export type DashboardActivity = {
  id: string;
  title: string;
  createdAt: string;
};

export type PartnerDashboardData = {
  summary: DashboardSummary;
  alerts: DashboardAlert[];
  recentActivity: DashboardActivity[];
};

export type DashboardApi = {
  getDashboard(userId: string): Promise<PartnerDashboardData>;
  recordQuickAction(userId: string, action: QuickActionType): Promise<PartnerDashboardData>;
};
