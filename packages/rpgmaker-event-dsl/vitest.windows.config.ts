import { defineConfig } from "vitest/config";

import baseConfig from "./vitest.config.js";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [
      "test/windows-baseline.test.ts",
      "test/cli-entry.test.ts",
      "test/workspace-locking.test.ts",
      "test/snapshot-binding.test.ts",
    ],
    env: { MV_CLI_ENTRY: "built" },
  },
});
