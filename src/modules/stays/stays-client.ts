import { appConfig } from "@/lib/config";
import type { StaysApi } from "@/modules/stays/contracts";
import { mockStaysApi } from "@/modules/stays/mock-stays-api";
import { realStaysApi } from "@/modules/stays/real-stays-api";

export const staysClient: StaysApi = appConfig.useMockApi ? mockStaysApi : realStaysApi;
