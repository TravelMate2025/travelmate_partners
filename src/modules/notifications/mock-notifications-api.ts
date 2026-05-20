import type {
  EmitNotificationEventInput,
  NotificationEventType,
  NotificationsApi,
  PartnerNotification,
} from "@/modules/notifications/contracts";

type State = {
  byUserId: Record<string, PartnerNotification[]>;
};

const STORAGE_KEY = "tm_partner_notifications_state_v1";
let notificationIdSequence = 0;

function readState(): State {
  if (typeof window === "undefined") {
    return { byUserId: {} };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { byUserId: {} };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      byUserId:
        parsed.byUserId && typeof parsed.byUserId === "object"
          ? parsed.byUserId
          : {},
    };
  } catch {
    return { byUserId: {} };
  }
}

function writeState(state: State) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createNotificationFromEvent(
  input: EmitNotificationEventInput,
): Omit<PartnerNotification, "id" | "createdAt"> {
  const context = input.contextLabel?.trim();

  switch (input.eventType) {
    case "verification_status_updated":
      return {
        eventType: input.eventType,
        title: "Verification Updated",
        message: context
          ? `Verification status changed: ${context}.`
          : "Your verification status has changed.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
        actionLabel: "Review Verification",
        actionUrl: "/verification",
      };
    case "listing_moderation_updated":
      return {
        eventType: input.eventType,
        title: "Listing Moderation Update",
        message: context
          ? `Moderation update received for ${context}.`
          : "A listing moderation update is available.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
        actionLabel: "Open Listings",
        actionUrl: "/stays",
      };
    case "settlement_refund_status_updated":
      return {
        eventType: input.eventType,
        title: "Settlement/Refund Status Updated",
        message: context
          ? `Settlement or refund status changed: ${context}.`
          : "Your settlement or refund status has changed.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
        actionLabel: "Open Wallet & Settlements",
        actionUrl: "/wallet-payouts",
      };
    case "settlement_account_updated":
      return {
        eventType: input.eventType,
        title: "Settlement Account Updated",
        message: context
          ? `Settlement account update: ${context}.`
          : "Your settlement account details have changed.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
        actionLabel: "Review Payout Method",
        actionUrl: "/wallet-payouts",
      };
    case "incomplete_listing_reminder":
      return {
        eventType: input.eventType,
        title: "Incomplete Listing Reminder",
        message: context
          ? `Please complete ${context} to continue submission.`
          : "You have incomplete listings that need attention.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
        actionLabel: "Fix Listing",
        actionUrl: "/stays",
      };
    case "admin_triggered_message":
      return {
        eventType: input.eventType,
        title: context ?? "Message from TravelMate",
        message: context ?? "You have a new message from the TravelMate team.",
        read: false,
        acknowledged: false,
        channels: input.channels,
        emailDispatched: input.channels.includes("email"),
      };
    default: {
      const _exhaustive: never = input.eventType;
      return _exhaustive;
    }
  }
}

function makeSeedNotifications() {
  const now = Date.now();
  const seedEvents: NotificationEventType[] = [
    "verification_status_updated",
    "listing_moderation_updated",
  ];

  return seedEvents.map((eventType, index) => {
    const draft = createNotificationFromEvent({
      eventType,
      channels: ["in_app"],
    });
    return {
      ...draft,
      id: `notif-seed-${index + 1}`,
      createdAt: new Date(now - index * 120_000).toISOString(),
    } satisfies PartnerNotification;
  });
}

function ensure(state: State, userId: string) {
  if (!state.byUserId[userId]) {
    state.byUserId[userId] = makeSeedNotifications();
  }
  state.byUserId[userId] = normalizeNotificationIds(state.byUserId[userId]);
  return state.byUserId[userId];
}

function sortNewestFirst(items: PartnerNotification[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function createNotificationId() {
  notificationIdSequence += 1;
  return `notif-${Date.now()}-${notificationIdSequence}`;
}

function normalizeNotificationIds(
  items: PartnerNotification[],
): PartnerNotification[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    let candidate = createNotificationId();
    while (seen.has(candidate)) {
      candidate = createNotificationId();
    }
    seen.add(candidate);
    return {
      ...item,
      id: candidate,
    };
  });
}

export const mockNotificationsApi: NotificationsApi = {
  async listNotifications(userId) {
    const state = readState();
    const notifications = ensure(state, userId);
    writeState(state);
    return sortNewestFirst(notifications);
  },

  async emitEvent(userId, input) {
    const state = readState();
    const notifications = ensure(state, userId);
    const draft = createNotificationFromEvent(input);
    const created: PartnerNotification = {
      ...draft,
      id: createNotificationId(),
      createdAt: new Date().toISOString(),
    };
    state.byUserId[userId] = sortNewestFirst([created, ...notifications]);
    writeState(state);
    return state.byUserId[userId];
  },

  async markAsRead(userId, notificationId) {
    const state = readState();
    const notifications = ensure(state, userId);
    const updated = notifications.map((item) =>
      item.id === notificationId
        ? {
            ...item,
            read: true,
            readAt: item.readAt ?? new Date().toISOString(),
          }
        : item,
    );
    state.byUserId[userId] = sortNewestFirst(updated);
    writeState(state);
    return state.byUserId[userId];
  },

  async markAsUnread(userId, notificationId) {
    const state = readState();
    const notifications = ensure(state, userId);
    const updated = notifications.map((item) =>
      item.id === notificationId
        ? {
            ...item,
            read: false,
            readAt: undefined,
          }
        : item,
    );
    state.byUserId[userId] = sortNewestFirst(updated);
    writeState(state);
    return state.byUserId[userId];
  },

  async acknowledge(userId, notificationId) {
    const state = readState();
    const notifications = ensure(state, userId);
    const updated = notifications.map((item) =>
      item.id === notificationId
        ? {
            ...item,
            read: true,
            readAt: item.readAt ?? new Date().toISOString(),
            acknowledged: true,
            acknowledgedAt: item.acknowledgedAt ?? new Date().toISOString(),
          }
        : item,
    );
    state.byUserId[userId] = sortNewestFirst(updated);
    writeState(state);
    return state.byUserId[userId];
  },

  async markAllAsRead(userId) {
    const state = readState();
    const notifications = ensure(state, userId);
    const now = new Date().toISOString();
    const updated = notifications.map((item) =>
      item.read
        ? item
        : {
            ...item,
            read: true,
            readAt: item.readAt ?? now,
          },
    );
    state.byUserId[userId] = sortNewestFirst(updated);
    writeState(state);
    return state.byUserId[userId];
  },
};
