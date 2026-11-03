import windows from "../../../../../packages/rpgmaker-event-dsl/vitest.windows.config.js";
import source, { selectedFiles } from "./source.config.js";

export default {
  ...windows,
  root: source.root,
  test: { ...windows.test, include: selectedFiles },
};
