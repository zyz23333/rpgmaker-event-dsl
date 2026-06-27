import { describe, expect, it } from "vitest";

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
});
