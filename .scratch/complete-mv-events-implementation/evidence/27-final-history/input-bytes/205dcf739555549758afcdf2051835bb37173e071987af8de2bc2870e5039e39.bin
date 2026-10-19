import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
    globals: true,
    maxWorkers: 2,
    include: ["test/**/*.test.ts"],
    testTimeout: 10_000,
  },
});
