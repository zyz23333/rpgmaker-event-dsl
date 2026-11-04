import { deepStrictEqual } from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
it("runs the minimal Workspace through actual Windows CLI processes", async () => {
  await withWindowsSandbox("workspace-cli", async (sandbox) => {
    const fixture = await createMinimalProject(sandbox.workspaceRoot);
    const stateRoot = join(sandbox.workspaceRoot, ".rpgmaker-event-dsl");

    await runCli(sandbox, ["init", sandbox.workspaceRoot, "--project-root", "./Game"]);
    await runCli(sandbox, ["clone"]);
    await runCli(sandbox, ["decompile"]);

    const sourceDirectory = join(sandbox.workspaceRoot, "src", "decompiled");
    const sourceFiles = (await readdir(sourceDirectory)).sort();
    expect(sourceFiles).toContain("common-events.events.ts");

    const beforeCheck = await readFile(join(stateRoot, "sync-manifest.json"), "utf8");
    await runCli(sandbox, ["compile", "--check"]);
    expect(await readFile(join(stateRoot, "sync-manifest.json"), "utf8")).toBe(beforeCheck);
    await expect(readdir(join(stateRoot, "generated-project-data"))).rejects.toThrow();

    await runCli(sandbox, ["compile"]);
    const generatedCommonEvents = JSON.parse(
      await readFile(join(stateRoot, "generated-project-data", "CommonEvents.json"), "utf8"),
    );
    deepStrictEqual(generatedCommonEvents, fixture.projectFiles["CommonEvents.json"]);

    const manifest = JSON.parse(await readFile(join(stateRoot, "sync-manifest.json"), "utf8"));
    deepStrictEqual(
      manifest.compileBaseline.sourceFiles
        .map((entry: { relativePath: string }) => entry.relativePath)
        .sort(),
      sourceFiles.map((file) => `src/decompiled/${file}`),
    );

    expect((await runCli(sandbox, ["diff", "--short"])).stdout).toContain("No changes.");
    await runCli(sandbox, ["push"]);

    const sourcePath = join(sourceDirectory, "common-events.events.ts");
    const source = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, source.replace("Evidence Common Event", "CLI evaluation observed"));
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
  });
}, 60000);
