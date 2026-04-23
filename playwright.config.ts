import { defineConfig, devices } from "@playwright/test";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true";
const useRealAuthApi = process.env.NEXT_PUBLIC_USE_REAL_AUTH_API ?? "true";
const useRealProfileApi = process.env.NEXT_PUBLIC_USE_REAL_PROFILE_API ?? "false";
const useRealVerificationApi = process.env.NEXT_PUBLIC_USE_REAL_VERIFICATION_API ?? "false";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      `/bin/zsh -lc 'NEXT_PUBLIC_USE_MOCK_API=${useMockApi} NEXT_PUBLIC_USE_REAL_AUTH_API=${useRealAuthApi} NEXT_PUBLIC_USE_REAL_PROFILE_API=${useRealProfileApi} NEXT_PUBLIC_USE_REAL_VERIFICATION_API=${useRealVerificationApi} NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl} npm run build && NEXT_PUBLIC_USE_MOCK_API=${useMockApi} NEXT_PUBLIC_USE_REAL_AUTH_API=${useRealAuthApi} NEXT_PUBLIC_USE_REAL_PROFILE_API=${useRealProfileApi} NEXT_PUBLIC_USE_REAL_VERIFICATION_API=${useRealVerificationApi} NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl} npm run start -- --port 3000'`,
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
