import { describe, expect, it } from "vitest";

import * as packageExports from "../src/index.js";
import { runtimeBaseline } from "../src/index.js";
import * as workspaceExports from "../src/workspace-api.js";

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
    expect(packageExports).toHaveProperty("changeItems");
    expect(packageExports).toHaveProperty("changeWeapons");
    expect(packageExports).toHaveProperty("changeArmors");
    expect(packageExports).toHaveProperty("changePartyMember");
    expect(packageExports).toHaveProperty("controlTimer");
    expect(packageExports).not.toHaveProperty("controlSwitch");
    expect(packageExports).not.toHaveProperty("controlVariable");
    expect(packageExports).not.toHaveProperty("changeItem");
  });

  it("keeps Workspace operations on the explicit Workspace entry point", () => {
    expect(packageExports).not.toHaveProperty("compileWorkspace");
    expect(packageExports).not.toHaveProperty("pushWorkspace");
    expect(workspaceExports).toHaveProperty("compileWorkspace");
    expect(workspaceExports).toHaveProperty("pushWorkspace");
  });
});
