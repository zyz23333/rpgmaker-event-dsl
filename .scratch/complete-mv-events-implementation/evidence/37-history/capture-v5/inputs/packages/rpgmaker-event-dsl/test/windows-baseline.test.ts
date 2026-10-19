import { deepStrictEqual } from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";

import { recordEvidence } from "./support/mv-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";

it("MV-S0-WIN-CLI-001: runs the minimal Workspace through actual Windows CLI processes", async () => {
  await withWindowsSandbox("workspace-cli", async (sandbox) => {
    const startedAt = new Date().toISOString();
    const stages: string[] = [];
    const actual: Record<string, unknown> = {};
    const fixture = await createMinimalProject(sandbox.workspaceRoot);
    const stateRoot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");
    let failure: unknown;
    try {
      await runCli(sandbox, ["init", sandbox.workspaceRoot, "--project-root", "./Game"]);
      await runCli(sandbox, ["clone"]);
      await runCli(sandbox, ["decompile"]);
      stages.push("Separate CLI processes initialize, clone and decompile the independent fixture");
      const sourceDirectory = join(sandbox.workspaceRoot, "src", "decompiled");
      const sourceFiles = (await readdir(sourceDirectory)).sort();
      expect(sourceFiles).toContain("common-events.events.ts");
      actual.sourceFiles = sourceFiles;
      const beforeCheck = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
      await runCli(sandbox, ["compile", "--check"]);
      expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(beforeCheck);
      await expect(readdir(join(stateRoot, "generated-project-data"))).rejects.toThrow();
      stages.push(
        "Check discovers and evaluates actual source without publishing output or manifest",
      );
      await runCli(sandbox, ["compile"]);
      const generatedCommonEvents = JSON.parse(
        await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
      );
      deepStrictEqual(generatedCommonEvents, fixture.projectFiles["CommonEvents.json"]);
      actual.generatedCommonEvents = generatedCommonEvents;
      const manifest = JSON.parse(await readFile(join(stateRoot, "sync-manifest.json"), "utf8"));
      deepStrictEqual(
        manifest.compileBaseline.sourceFiles
          .map((entry: { relativePath: string }) => entry.relativePath)
          .sort(),
        sourceFiles.map((file) => `src/decompiled/${file}`),
      );
      actual.discoveredSourceFiles = manifest.compileBaseline.sourceFiles;
      expect((await runCli(sandbox, ["diff", "--short"])).stdout).toContain("No changes.");
      await runCli(sandbox, ["push"]);
      stages.push("Compile, Diff and no-op Push preserve complete parsed saved data");

      const sourcePath = join(sourceDirectory, "common-events.events.ts");
      const source = await readFile(sourcePath, "utf8");
      await writeFile(
        sourcePath,
        source.replace("Evidence Common Event", "CLI evaluation observed"),
      );
      await runCli(sandbox, ["compile"]);
      await runCli(sandbox, ["push"]);
      const changedExpected = structuredClone(fixture.projectFiles["CommonEvents.json"]);
      changedExpected[1].name = "CLI evaluation observed";
      for (const [name, original] of Object.entries(fixture.projectFiles)) {
        const expected = name === "CommonEvents.json" ? changedExpected : original;
        deepStrictEqual(
          JSON.parse(await readFile(join(sandbox.workspaceRoot, "Game", "data", name), "utf8")),
          expected,
        );
        deepStrictEqual(
          JSON.parse(await readFile(join(stateRoot, "project-data-snapshot", name), "utf8")),
          expected,
        );
      }
      const manifestBeforeFailure = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
      const diagnostic = await runCli(sandbox, ["compile", "--unknown"], { allowFailure: true });
      expect(diagnostic.exitCode).toBe(1);
      expect(diagnostic.stderr).toContain("unknown option '--unknown'");
      expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(
        manifestBeforeFailure,
      );
      expect(await readFile(sourcePath, "utf8")).toBe(
        source.replace("Evidence Common Event", "CLI evaluation observed"),
      );
      for (const directory of [
        join(sandbox.workspaceRoot, "Game", "data"),
        join(stateRoot, "project-data-snapshot"),
        join(stateRoot, "generated-project-data"),
      ]) {
        for (const name of await readdir(directory)) {
          const expected =
            name === "CommonEvents.json" ? changedExpected : fixture.projectFiles[name];
          deepStrictEqual(JSON.parse(await readFile(join(directory, name), "utf8")), expected);
        }
      }
      actual.changedCommonEvents = changedExpected;
      actual.diagnostic = diagnostic;
      stages.push(
        "Edited source is evaluated; real file replacement refreshes Project Root and Snapshot; invalid option reports stderr/exit 1 without changing source or manifest",
      );
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: "MV-S0-WIN-CLI-001",
        startedAt,
        stages: stages.length === 0 ? ["Windows CLI setup"] : stages,
        expected: fixture.projectFiles,
        actual: { ...actual, cliEntry: sandbox.cliEntry, processes: sandbox.processes },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}, 60_000);
