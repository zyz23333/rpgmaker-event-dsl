import { defineConfig } from "vitest/config";

import baseConfig from "./vitest.config.js";

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: [
      "test/windows-baseline.test.ts",
      "test/map-event-workspace.test.ts",
      "test/cli-entry.test.ts",
      "test/workspace-locking.test.ts",
      "test/snapshot-binding.test.ts",
      "test/compile-inputs.test.ts",
      "test/compile-publication.test.ts",
      "test/decompile-publication.test.ts",
      "test/push-drift.test.ts",
      "test/push-recovery.test.ts",
      "test/troop-safety.test.ts",
      "test/troop-workflow.test.ts",
    ],
    env: { MV_CLI_ENTRY: "built" },
  },
});
