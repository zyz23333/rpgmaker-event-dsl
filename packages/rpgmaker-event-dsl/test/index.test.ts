import { describe, expect, it } from "vitest";

import * as packageExports from "../src/index.js";
import { runtimeBaseline } from "../src/index.js";

describe("runtime baseline", () => {
  it("records the architecture choices required by the first slice", () => {
    expect(runtimeBaseline).toEqual({
      language: "typescript-strict",
      moduleSystem: "esm-nodenext",
      packageManager: "pnpm",
      runtime: "node-22-lts",
    });
  });

  it("exports only the MV-aligned plural control helper names", () => {
    expect(packageExports).toHaveProperty("controlSwitches");
    expect(packageExports).toHaveProperty("controlVariables");
    expect(packageExports).not.toHaveProperty("controlSwitch");
    expect(packageExports).not.toHaveProperty("controlVariable");
  });
});
