import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Integration tests call a live API at http://localhost:8000 and must not
    // run as part of the default suite. Run them separately with:
    //   npm run test:integration
    // (requires the backend server to be running)
    exclude: ["**/node_modules/**", "**/integration/**"],
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    clearMocks: true,
  },
});
