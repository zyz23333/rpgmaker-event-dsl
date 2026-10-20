import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { recordEvidence } from "./support/mv-evidence.js";
import { createCliJunction, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";

describe("CLI entrypoint", () => {
  it("prints help when executed directly", async () => {
    await withWindowsSandbox("cli-help", async (sandbox) => {
      const { stdout } = await runCli(sandbox, ["--help"]);

      expect(stdout).toContain("Usage: rpgmaker-event-dsl");
      expect(stdout).toContain("init");
      expect(stdout).toContain("clone");
      expect(stdout).toContain("pull");
      expect(stdout).toContain("decompile");
      expect(stdout).toContain("compile");
      expect(stdout).toContain("diff");
      expect(stdout).toContain("push");
      expect(stdout).not.toContain("lint");
      expect(stdout).not.toContain("create");
      expect(stdout).not.toContain("replace");
    });
  });

  it("MV-S0-WIN-JUNCTION-001: executes CLI through a mandatory Windows directory junction", async () => {
    await withWindowsSandbox("cli-junction", async (sandbox) => {
      const startedAt = new Date().toISOString();
      let failure: unknown;
      try {
        const entry = await createCliJunction(sandbox);
        const { stdout } = await runCli(sandbox, ["--help"], { entry });
        expect(stdout).toContain("Usage: rpgmaker-event-dsl");
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        await recordEvidence({
          requirementId: "MV-S0-WIN-JUNCTION-001",
          startedAt,
          stages: [
            "Create a real directory junction to the CLI directory; execute aliased CLI in a separate Node process",
          ],
          expected:
            "CLI help with exit 0 through the Windows junction; permission failures fail the case",
          actual: { cliEntry: sandbox.cliEntry, processes: sandbox.processes },
          ...(failure === undefined ? {} : { error: failure }),
        });
      }
    });
  });

  it("initializes a workspace from the init command", async () => {
    await withWindowsSandbox("cli-init", async (sandbox) => {
      const projectRoot = join(sandbox.workspaceRoot, "Game");

      await mkdir(projectRoot, { recursive: true });
      await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");
      await mkdir(join(projectRoot, "data"), { recursive: true });

      await runCli(sandbox, ["init", sandbox.workspaceRoot, "--project-root", "./Game"]);

      expect(
        JSON.parse(
          await readFile(join(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json"), "utf8"),
        ).projectRoot,
      ).toBe("./Game");
    });
  });
});
