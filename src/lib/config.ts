export const appConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
  useMockApi: (process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true") === "true",
};
