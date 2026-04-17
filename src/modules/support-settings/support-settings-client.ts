import { appConfig } from "@/lib/config";
import type { SupportSettingsApi } from "@/modules/support-settings/contracts";
import { mockSupportSettingsApi } from "@/modules/support-settings/mock-support-settings-api";
import { realSupportSettingsApi } from "@/modules/support-settings/real-support-settings-api";

export const supportSettingsClient: SupportSettingsApi = appConfig.useMockApi
  ? mockSupportSettingsApi
  : realSupportSettingsApi;
