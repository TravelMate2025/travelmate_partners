import { appConfig } from "@/lib/config";
import type { ProfileApi } from "@/modules/profile/contracts";
import { mockProfileApi } from "@/modules/profile/mock-profile-api";
import { realProfileApi } from "@/modules/profile/real-profile-api";

export const profileClient: ProfileApi =
  appConfig.useRealProfileApi || !appConfig.useMockApi ? realProfileApi : mockProfileApi;
