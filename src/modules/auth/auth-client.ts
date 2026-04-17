import { appConfig } from "@/lib/config";
import type { AuthApi } from "@/modules/auth/contracts";
import { mockAuthApi } from "@/modules/auth/mock-auth-api";
import { realAuthApi } from "@/modules/auth/real-auth-api";

export const authClient: AuthApi = appConfig.useMockApi ? mockAuthApi : realAuthApi;
