import { appConfig } from "@/lib/config";
import type { NotificationsApi } from "@/modules/notifications/contracts";
import { mockNotificationsApi } from "@/modules/notifications/mock-notifications-api";
import { realNotificationsApi } from "@/modules/notifications/real-notifications-api";

export const notificationsClient: NotificationsApi = appConfig.useMockApi
  ? mockNotificationsApi
  : realNotificationsApi;
