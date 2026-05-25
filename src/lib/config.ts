export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  useMockApi:
    (process.env.NEXT_PUBLIC_USE_MOCK_API
      ?? (process.env.NODE_ENV === "test" ? "true" : "false")) === "true",
  useRealNotificationsApi:
    (process.env.NEXT_PUBLIC_USE_REAL_NOTIFICATIONS_API ?? "true") === "true",
  useRealSupportSettingsApi:
    (process.env.NEXT_PUBLIC_USE_REAL_SUPPORT_SETTINGS_API ?? "false") === "true",
  useRealAuthApi: (process.env.NEXT_PUBLIC_USE_REAL_AUTH_API ?? "false") === "true",
  useRealProfileApi:
    (process.env.NEXT_PUBLIC_USE_REAL_PROFILE_API ?? "false") === "true",
  useRealVerificationApi:
    (process.env.NEXT_PUBLIC_USE_REAL_VERIFICATION_API ?? "false") === "true",
};
