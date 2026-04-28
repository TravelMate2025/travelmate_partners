import type {
  DashboardActivity,
  DashboardAlert,
  DashboardApi,
  PartnerDashboardData,
  QuickActionType,
} from "@/modules/dashboard/contracts";
import { notificationsClient } from "@/modules/notifications/notifications-client";
import { reportsClient } from "@/modules/reports/reports-client";
import { staysClient } from "@/modules/stays/stays-client";
import { transfersClient } from "@/modules/transfers/transfers-client";

const ACTIVE_STATUSES = new Set(["approved", "live"]);
const PENDING_STATUS = "pending";

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapAlerts(input: {
  activeListings: number;
  pendingApprovals: number;
  unreadNotifications: number;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (input.activeListings === 0) {
    alerts.push({
      id: makeId(),
      level: "warning",
      message: "You have no active listings yet.",
      actionLabel: "Add listing",
      actionPath: "/dashboard",
    });
  }

  if (input.pendingApprovals > 0) {
    alerts.push({
      id: makeId(),
      level: "info",
      message: `${input.pendingApprovals} listing(s) are pending approval.`,
      actionLabel: "View status",
      actionPath: "/dashboard",
    });
  }

  if (input.unreadNotifications > 0) {
    alerts.push({
      id: makeId(),
      level: "info",
      message: `${input.unreadNotifications} notification(s) are unread.`,
      actionLabel: "Open notifications",
      actionPath: "/notifications",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: makeId(),
      level: "success",
      message: "All clear. Your dashboard is up to date.",
    });
  }

  return alerts;
}

function buildRecentActivity(input: {
  stays: Awaited<ReturnType<typeof staysClient.listStays>>;
  transfers: Awaited<ReturnType<typeof transfersClient.listTransfers>>;
  notifications: Awaited<ReturnType<typeof notificationsClient.listNotifications>>;
}): DashboardActivity[] {
  const listingActivity = [
    ...input.stays.map((stay) => ({
      id: `stay-${stay.id}`,
      title: `Stay "${stay.name}" is ${stay.status.replaceAll("_", " ")}.`,
      createdAt: stay.updatedAt || stay.createdAt,
    })),
    ...input.transfers.map((transfer) => ({
      id: `transfer-${transfer.id}`,
      title: `Transfer "${transfer.name}" is ${transfer.status.replaceAll("_", " ")}.`,
      createdAt: transfer.updatedAt || transfer.createdAt,
    })),
  ];

  const notificationActivity = input.notifications.map((notification) => ({
    id: `notification-${notification.id}`,
    title: notification.title,
    createdAt: notification.createdAt,
  }));

  return [...listingActivity, ...notificationActivity]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
}

async function resolveDashboard(userId: string): Promise<PartnerDashboardData> {
  const [stays, transfers, reportsSummary, notifications] = await Promise.all([
    staysClient.listStays(userId),
    transfersClient.listTransfers(userId),
    reportsClient.getSummary(userId),
    notificationsClient.listNotifications(userId),
  ]);

  const activeListings =
    stays.filter((stay) => ACTIVE_STATUSES.has(stay.status)).length +
    transfers.filter((transfer) => ACTIVE_STATUSES.has(transfer.status)).length;
  const pendingApprovals =
    stays.filter((stay) => stay.status === PENDING_STATUS).length +
    transfers.filter((transfer) => transfer.status === PENDING_STATUS).length;
  const totalViews = reportsSummary.views;
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return {
    summary: {
      activeListings,
      pendingApprovals,
      totalViews,
    },
    alerts: mapAlerts({ activeListings, pendingApprovals, unreadNotifications }),
    recentActivity: buildRecentActivity({ stays, transfers, notifications }),
  };
}

export const realDashboardApi: DashboardApi = {
  async getDashboard(userId: string) {
    return resolveDashboard(userId);
  },

  async recordQuickAction(userId: string, action: QuickActionType) {
    void action;
    return resolveDashboard(userId);
  },
};
