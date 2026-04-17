export type NotificationEventType =
  | "verification_status_updated"
  | "listing_moderation_updated"
  | "payout_status_updated"
  | "incomplete_listing_reminder";

export type NotificationChannel = "in_app" | "email";

export type PartnerNotification = {
  id: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  read: boolean;
  acknowledged: boolean;
  channels: NotificationChannel[];
  emailDispatched: boolean;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  acknowledgedAt?: string;
};

export type EmitNotificationEventInput = {
  eventType: NotificationEventType;
  channels: NotificationChannel[];
  contextLabel?: string;
};

export type NotificationsApi = {
  listNotifications(userId: string): Promise<PartnerNotification[]>;
  emitEvent(
    userId: string,
    input: EmitNotificationEventInput,
  ): Promise<PartnerNotification[]>;
  markAsRead(userId: string, notificationId: string): Promise<PartnerNotification[]>;
  markAsUnread(userId: string, notificationId: string): Promise<PartnerNotification[]>;
  acknowledge(userId: string, notificationId: string): Promise<PartnerNotification[]>;
  markAllAsRead(userId: string): Promise<PartnerNotification[]>;
};
