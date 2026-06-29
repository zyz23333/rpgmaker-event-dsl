import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cloneWorkspace,
  compileWorkspace,
  decompileWorkspace,
  diffWorkspace,
  pullWorkspace,
  pushWorkspace,
} from "../src/workflow.js";

describe("workspace workflow placeholders", () => {
  it("fails new workflow commands with clear unimplemented errors", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rmmv-event-dsl-workflow-"));

    await expect(cloneWorkspace({ workspaceRoot })).rejects.toThrow(
      "clone workflow is not implemented yet",
    );
    await expect(pullWorkspace({ workspaceRoot })).rejects.toThrow(
      "pull workflow is not implemented yet",
    );
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toThrow(
      "decompile workflow is not implemented yet",
    );
    await expect(compileWorkspace({ workspaceRoot, check: true })).rejects.toThrow(
      "compile --check workflow is not implemented yet",
    );
    await expect(diffWorkspace({ workspaceRoot })).rejects.toThrow(
      "diff workflow is not implemented yet",
    );
    await expect(pushWorkspace({ workspaceRoot, allowDestructive: true })).rejects.toThrow(
      "push --allow-destructive workflow is not implemented yet",
    );
  });
});
