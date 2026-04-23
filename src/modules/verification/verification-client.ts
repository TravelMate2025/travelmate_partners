import { appConfig } from "@/lib/config";
import type { VerificationApi } from "@/modules/verification/contracts";
import { mockVerificationApi } from "@/modules/verification/mock-verification-api";
import { realVerificationApi } from "@/modules/verification/real-verification-api";

export const verificationClient: VerificationApi = appConfig.useMockApi
  ? appConfig.useRealVerificationApi
    ? realVerificationApi
    : mockVerificationApi
  : realVerificationApi;
