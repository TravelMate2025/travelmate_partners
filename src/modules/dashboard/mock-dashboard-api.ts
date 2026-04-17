import type {
  DashboardActivity,
  DashboardApi,
  DashboardAlert,
  PartnerDashboardData,
  QuickActionType,
} from "@/modules/dashboard/contracts";

type MockDashboardState = {
  byUserId: Record<
    string,
    {
      activeListings: number;
      pendingApprovals: number;
      totalViews: number;
      recentActivity: DashboardActivity[];
      alerts: DashboardAlert[];
    }
  >;
};

const STORAGE_KEY = "tm_partner_dashboard_state_v1";
type UserDashboardStore = MockDashboardState["byUserId"][string];

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultData(): UserDashboardStore {
  return {
    activeListings: 0,
    pendingApprovals: 0,
    totalViews: 0,
    recentActivity: [],
    alerts: [
      {
        id: makeId(),
        level: "info" as const,
        message: "Start by adding your first stay or transfer listing.",
        actionLabel: "Go to quick actions",
        actionPath: "/dashboard",
      },
    ],
  };
}

function readState(): MockDashboardState {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MockDashboardState>;
    return {
      byUserId:
        parsed && parsed.byUserId && typeof parsed.byUserId === "object" ? parsed.byUserId : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: MockDashboardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureUserState(state: MockDashboardState, userId: string) {
  const data = state.byUserId[userId] ?? defaultData();
  state.byUserId[userId] = data;
  return data;
}

function createAlertSnapshot(data: {
  activeListings: number;
  pendingApprovals: number;
}): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (data.activeListings === 0) {
    alerts.push({
      id: makeId(),
      level: "warning",
      message: "You have no active listings yet.",
      actionLabel: "Add listing",
      actionPath: "/dashboard",
    });
  }

  if (data.pendingApprovals > 0) {
    alerts.push({
      id: makeId(),
      level: "info",
      message: `${data.pendingApprovals} listing(s) are pending approval.`,
      actionLabel: "View status",
      actionPath: "/dashboard",
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

function mapToResponse(data: UserDashboardStore): PartnerDashboardData {
  return {
    summary: {
      activeListings: data.activeListings,
      pendingApprovals: data.pendingApprovals,
      totalViews: data.totalViews,
    },
    alerts: data.alerts,
    recentActivity: data.recentActivity,
  };
}

function logActivity(data: UserDashboardStore, title: string) {
  data.recentActivity = [
    {
      id: makeId(),
      title,
      createdAt: nowIso(),
    },
    ...data.recentActivity,
  ].slice(0, 12);
}

export const mockDashboardApi: DashboardApi = {
  async getDashboard(userId: string) {
    const state = readState();
    const data = ensureUserState(state, userId);
    data.alerts = createAlertSnapshot(data);
    writeState(state);
    return mapToResponse(data);
  },

  async recordQuickAction(userId: string, action: QuickActionType) {
    const state = readState();
    const data = ensureUserState(state, userId);

    if (action === "add_stay") {
      data.pendingApprovals += 1;
      data.totalViews += 8;
      logActivity(data, "Quick action used: Add Stay listing started.");
    }

    if (action === "add_transfer") {
      data.pendingApprovals += 1;
      data.totalViews += 5;
      logActivity(data, "Quick action used: Add Transfer listing started.");
    }

    if (action === "update_availability") {
      data.totalViews += 2;
      logActivity(data, "Quick action used: Update availability initiated.");
    }

    // Small mock behavior: after 2 pending approvals, mark one approved.
    if (data.pendingApprovals >= 2) {
      data.pendingApprovals -= 1;
      data.activeListings += 1;
      logActivity(data, "System update: one listing moved to active.");
    }

    data.alerts = createAlertSnapshot(data);
    writeState(state);

    return mapToResponse(data);
  },
};
