import { cp, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { expect, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";

it("compiles the shared authoring sample, rejects stale transitive input, and pushes recompiled rewards", async () => {
  await withWindowsSandbox("shared-authoring-cli", async (sandbox) => {
    const { workspaceRoot } = sandbox;
    await createMinimalProject(workspaceRoot);
    await cp(
      new URL("../../../example/shared-authoring/src", import.meta.url),
      join(workspaceRoot, "src"),
      { recursive: true },
    );
    for (const args of [
      ["init", workspaceRoot, "--project-root", "./Game"],
      ["clone"],
      ["decompile"],
    ])
      expect((await runCli(sandbox, args)).exitCode).toBe(0);
    const generated = join(
      workspaceRoot,
      ".rpgmaker-event-dsl/generated-project-data/CommonEvents.json",
    );
    const manifest = join(workspaceRoot, ".rpgmaker-event-dsl/sync-manifest.json");
    const entry = join(workspaceRoot, "src/rewards.events.ts");
    const dependency = join(workspaceRoot, "src/shared/introduction.ts");
    const project = join(workspaceRoot, "Game/data/CommonEvents.json");
    const dataRoot = join(workspaceRoot, "Game/data");
    const projectState = async () =>
      Promise.all(
        (await readdir(dataRoot))
          .sort()
          .map(async (name) => [name, await readFile(join(dataRoot, name), "utf8")]),
      );
    const projectBefore = await projectState();
    const manifestBefore = await readFile(manifest, "utf8");
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    expect(await readFile(manifest, "utf8")).toBe(manifestBefore);
    await expect(readFile(generated)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await projectState()).toEqual(projectBefore);
    expect((await runCli(sandbox, ["compile"])).exitCode).toBe(0);
    const events = JSON.parse(await readFile(generated, "utf8"));
    const expected = [
      {
        id: 2,
        name: "Copper reward",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 108, indent: 0, parameters: ["Reward rules v1"] },
          { code: 108, indent: 0, parameters: ["Copper chest"] },
          { code: 125, indent: 0, parameters: [0, 0, 25] },
          { code: 108, indent: 0, parameters: ["Reward complete"] },
          { code: 0, indent: 0, parameters: [] },
        ],
      },
      {
        id: 3,
        name: "Silver reward",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 108, indent: 0, parameters: ["Reward rules v1"] },
          { code: 108, indent: 0, parameters: ["Silver chest"] },
          { code: 125, indent: 0, parameters: [0, 0, 90] },
          { code: 108, indent: 0, parameters: ["Reward complete"] },
          { code: 0, indent: 0, parameters: [] },
        ],
      },
    ];
    expect(events.slice(2)).toEqual(expected);
    expect((await runCli(sandbox, ["diff"])).exitCode).toBe(0);
    expect((await runCli(sandbox, ["push"])).exitCode).toBe(0);
    expect(JSON.parse(await readFile(project, "utf8"))).toEqual(events);

    const originalEntry = await readFile(entry, "utf8");
    await writeFile(
      dependency,
      (await readFile(dependency, "utf8")).replace("Reward rules v1", "Reward rules v2"),
    );
    const staleProject = await projectState();
    const staleLocal = await Promise.all(
      [generated, manifest].map((file) => readFile(file, "utf8")),
    );
    for (const command of ["diff", "push"]) {
      const result = await runCli(sandbox, [command], { allowFailure: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/stale.*compile|compile.*stale/isu);
      expect(await projectState()).toEqual(staleProject);
      expect(
        await Promise.all([generated, manifest].map((file) => readFile(file, "utf8"))),
      ).toEqual(staleLocal);
    }
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    expect(await Promise.all([generated, manifest].map((file) => readFile(file, "utf8")))).toEqual(
      staleLocal,
    );
    expect((await runCli(sandbox, ["diff"], { allowFailure: true })).exitCode).toBe(1);
    expect((await runCli(sandbox, ["compile"])).exitCode).toBe(0);
    const updated = JSON.parse(await readFile(generated, "utf8"));
    for (const [index, event] of expected.entries()) {
      expect(updated[index + 2]).toEqual({
        ...event,
        list: [{ code: 108, indent: 0, parameters: ["Reward rules v2"] }, ...event.list.slice(1)],
      });
    }
    expect((await runCli(sandbox, ["diff"])).exitCode).toBe(0);
    expect((await runCli(sandbox, ["push"])).exitCode).toBe(0);
    expect(JSON.parse(await readFile(project, "utf8"))).toEqual(updated);
    expect(await readFile(entry, "utf8")).toBe(originalEntry);

    const finalProject = await projectState();
    const finalLocal = await Promise.all(
      [generated, manifest].map((file) => readFile(file, "utf8")),
    );
    await writeFile(entry, originalEntry.replace("gold: 25", 'gold: "25"'));
    const typeFailure = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(typeFailure.exitCode).toBe(1);
    expect(typeFailure.stderr).toMatch(/rewards\.events\.ts:\d+:\d+/u);
    expect(typeFailure.stderr).toMatch(/string.*not assignable.*number/isu);
    await writeFile(entry, originalEntry.replace("gold: 25", "gold: 0"));
    const constructorFailure = await runCli(sandbox, ["compile", "--check"], {
      allowFailure: true,
    });
    expect(constructorFailure.exitCode).toBe(1);
    expect(constructorFailure.stderr).toMatch(/rewards\.ts:\d+:\d+/u);
    expect(constructorFailure.stderr).toContain("Author function reward");
    expect(constructorFailure.stderr).toContain("Author function completedReward");
    expect(constructorFailure.stderr).toContain("rewards.events.ts");
    expect(await projectState()).toEqual(finalProject);
    expect(await Promise.all([generated, manifest].map((file) => readFile(file, "utf8")))).toEqual(
      finalLocal,
    );
    await writeFile(entry, originalEntry);
  });
}, 90_000);
