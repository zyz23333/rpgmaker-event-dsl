import { fileURLToPath } from "node:url";
import base from "../../../../../packages/rpgmaker-event-dsl/vitest.config.js";

export const selectedFiles = [
  "test/pictures-workspace.test.ts",
  "test/control-input-workspace.test.ts",
  "test/audio-commands-workspace.test.ts",
  "test/movement-instructions-workspace.test.ts",
  "test/screen-effects-workspace.test.ts",
  "test/final-review-workspace.test.ts",
];

export default {
  ...base,
  root: fileURLToPath(new URL("../../../../../packages/rpgmaker-event-dsl/", import.meta.url)),
  test: { ...base.test, include: selectedFiles },
};
