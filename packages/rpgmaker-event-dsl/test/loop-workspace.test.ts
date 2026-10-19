import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { initWorkspace } from "../src/workspace/config.js";
import { cloneWorkspace, compileWorkspace, decompileWorkspace, diffWorkspace } from "../src/workspace/operations.js";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { pushWorkspace } from "../src/workspace/push.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";

const fixture = JSON.parse(await readFile(new URL("./fixtures/mv-evidence/loop-cases.json", import.meta.url), "utf8"));

async function prepare(workspaceRoot: string) {
  await createMinimalProject(workspaceRoot);
  await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(fixture.events));
  await writeFile(join(workspaceRoot, "Game/data/System.json"), JSON.stringify({ switches: ["", ...Array.from({ length: 10 }, (_, i) => `Switch ${i + 1}`)], variables: [""] }));
  await initWorkspace({ workspaceRoot, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot });
}

it("round trips complete Loop saved lists through actual Discovery, Check, Compile, Diff and Push", async () => {
  await withWindowsSandbox("loop-roundtrip", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    await decompileWorkspace({ workspaceRoot });
    const files = await discoverDefinitionFiles(workspaceRoot, { sourceRoot: "src", sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"], sourceExclude: [] });
    const declarations = (await Promise.all(files.map((file) => loadDefinitionFile(file)))).flat();
    expect(declarations.filter((value) => value.kind === "commonEvent")).toHaveLength(5);
    const source = await readFile(join(workspaceRoot, "src/decompiled/common-events.events.ts"), "utf8");
    expect(source).not.toContain("rawDslCommand");
    expect(source).toContain('endMarker: "absent"');
    expect(source).toContain("exitEventProcessing()");
    await compileWorkspace({ workspaceRoot, check: true });
    await compileWorkspace({ workspaceRoot });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    expect(JSON.parse(await readFile(join(paths.generatedProjectDataDirectory, "CommonEvents.json"), "utf8"))).toEqual(fixture.events);
    await expect(diffWorkspace({ workspaceRoot })).resolves.toBeDefined();
    await pushWorkspace({ workspaceRoot });
    expect(JSON.parse(await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8"))).toEqual(fixture.events);
  });
});

it("rejects malformed known native flow before publishing any source and preserves project and snapshot", async () => {
  await withWindowsSandbox("loop-rejection", async ({ workspaceRoot }) => {
    await prepare(workspaceRoot);
    const invalid = structuredClone(fixture.events);
    invalid[5].list[2] = { code: 115, indent: 0 };
    await writeFile(join(workspaceRoot, "Game/data/CommonEvents.json"), JSON.stringify(invalid));
    await cloneWorkspace({ workspaceRoot });
    const paths = getWorkspaceStatePaths(workspaceRoot);
    const projectBefore = await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8");
    const snapshotBefore = await readFile(join(paths.projectDataSnapshotDirectory, "CommonEvents.json"), "utf8");
    const manifestBefore = await readFile(paths.syncManifestPath, "utf8");
    await expect(decompileWorkspace({ workspaceRoot })).rejects.toMatchObject({
      code: "MV-COMMAND-ENVELOPE", identity: "commonEvent:5", stage: "decompile", location: { nativePath: "list[2]" },
    });
    expect(await discoverDefinitionFiles(workspaceRoot, { sourceRoot: "src", sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"], sourceExclude: [] })).toEqual([]);
    expect(await readFile(join(workspaceRoot, "Game/data/CommonEvents.json"), "utf8")).toBe(projectBefore);
    expect(await readFile(join(paths.projectDataSnapshotDirectory, "CommonEvents.json"), "utf8")).toBe(snapshotBefore);
    expect(await readFile(paths.syncManifestPath, "utf8")).toBe(manifestBefore);
  });
});
