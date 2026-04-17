import { apiRequest } from "@/lib/http-client";
import type {
  EmitNotificationEventInput,
  NotificationsApi,
  PartnerNotification,
} from "@/modules/notifications/contracts";

type Envelope<T> = { data: T };

export const realNotificationsApi: NotificationsApi = {
  async listNotifications(userId: string) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications`,
    );
    return response.data;
  },

  async markAsRead(userId: string, notificationId: string) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications/${notificationId}/read`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  async markAsUnread(userId: string, notificationId: string) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications/${notificationId}/unread`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  async acknowledge(userId: string, notificationId: string) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications/${notificationId}/acknowledge`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  async markAllAsRead(userId: string) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications/read-all`,
      {
        method: "POST",
      },
    );
    return response.data;
  },

  async emitEvent(userId: string, input: EmitNotificationEventInput) {
    const response = await apiRequest<Envelope<PartnerNotification[]>>(
      `/partners/${userId}/notifications/events`,
      {
        method: "POST",
        body: input,
      },
    );
    return response.data;
  },
};
