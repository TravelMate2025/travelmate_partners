import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Integration test config — used by `npm run test:integration`.
 *
 * These tests call a live backend at http://localhost:8000/api/v1.
 * The backend server must be running before executing this suite.
 *
 * Usage:
 *   npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/modules/integration/**/*.test.ts", "src/modules/integration/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    clearMocks: true,
  },
});
