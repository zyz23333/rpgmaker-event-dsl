import { verifyTroopEvidence } from "./support/troop-evidence.js";
import { expect, it } from "vitest";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import { discoverDefinitionFiles } from "../src/workspace/definitions.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const page = {
  conditions: {
    actorHp: 50,
    actorId: 1,
    actorValid: false,
    enemyHp: 50,
    enemyIndex: 0,
    enemyValid: false,
    switchId: 1,
    switchValid: false,
    turnA: 0,
    turnB: 0,
    turnEnding: false,
    turnValid: false,
  },
  span: 0,
  list: [
    { code: 108, indent: 0, parameters: ["original troop"] },
    { code: 0, indent: 0, parameters: [] },
  ],
};
async function tree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (entry.name === "operation.lock") continue;
    const path = join(root, entry.name);
    if (entry.isDirectory())
      for (const [name, bytes] of Object.entries(await tree(path)))
        result[entry.name + "/" + name] = bytes;
    else result[entry.name] = (await readFile(path)).toString("hex");
  }
  return result;
}
async function observe(root: string) {
  const config = await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8");
  return {
    source: await tree(join(root, "src")),
    project: await tree(join(root, "Game")),
    state: await tree(join(root, ".rpgmaker-event-dsl")),
    config,
    discovery: await discoverDefinitionFiles(root, JSON.parse(config)),
  };
}
async function prepare(root: string) {
  await createMinimalProject(root);
  const troops = [
    null,
    {
      id: 1,
      name: "",
      members: [{ enemyId: 999, hidden: true, x: 30, y: 60 }],
      carrier: [null, "retained"],
      pages: [page],
    },
  ];
  await writeFile(join(root, "Game/data/Troops.json"), JSON.stringify(troops));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await api.decompileWorkspace({ workspaceRoot: root });
  const source = join(root, "src/decompiled/troop-events.events.ts");
  await writeFile(
    source,
    (await readFile(source, "utf8")).replace("original troop", "changed troop"),
  );
  await api.compileWorkspace({ workspaceRoot: root, check: false });
  return troops;
}

it("Troops participates in late candidate write failure with no partial publication", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-SAFETY-001", async () => {
    let finalObservation: unknown;

    await withWindowsSandbox("mv25-troop-stage", async (s) => {
      await prepare(s.workspaceRoot);
      const source = join(s.workspaceRoot, "src/decompiled/troop-events.events.ts");
      await writeFile(
        source,
        (await readFile(source, "utf8")).replace("changed troop", "new candidate troop"),
      );
      const before = await observe(s.workspaceRoot);
      const child = startWorkspaceOperation(s, {
        operation: "compile",
        boundary: "generated-write-failure",
        captureFile: "Troops.json",
      });
      try {
        const result = await child.waitFor("result");
        expect(result.ok).toBe(false);
        expect(result.message).toContain("Controlled generated");
      } finally {
        await child.stop();
      }
      expect(await observe(s.workspaceRoot)).toEqual(before);
      await expect(api.diffWorkspace(s)).rejects.toThrow(/stale/i);
      await api.compileWorkspace({ ...s, check: false });
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);

      finalObservation = await observe(s.workspaceRoot);
    });

    return finalObservation;
  });
}, 30000);

it("recovers a real interrupted Troops replacement using the complete captured output and unchanged source basis", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-SAFETY-002", async () => {
    let finalObservation: unknown;

    await withWindowsSandbox("mv25-troop-recovery", async (s) => {
      const troops = await prepare(s.workspaceRoot);
      const state = join(s.workspaceRoot, ".rpgmaker-event-dsl");
      const generated = await readFile(join(state, "generated-project-data/Troops.json"));
      const before = await observe(s.workspaceRoot);
      const child = startWorkspaceOperation(s, {
        operation: "push",
        boundary: "push-after-install",
        captureFile: "Troops.json",
      });
      try {
        await child.waitFor("checkpoint");
        await child.stop();
      } finally {
        await child.stop();
      }
      expect(await readFile(join(s.workspaceRoot, "Game/data/Troops.json"))).toEqual(generated);
      expect(
        JSON.parse(await readFile(join(state, "project-data-snapshot/Troops.json"), "utf8")),
      ).toEqual(troops);
      await api.pushWorkspace({ ...s, allowDestructive: false });
      expect(await readFile(join(state, "project-data-snapshot/Troops.json"))).toEqual(generated);
      expect((await observe(s.workspaceRoot)).source).toEqual(before.source);
      await expect(readdir(join(state, "pending-push"))).rejects.toThrow();
      expect(await api.isGeneratedProjectDataFresh(s)).toBe(true);
      expect(await api.diffWorkspace(s)).toContain("Destructive Changes: no");

      finalObservation = await observe(s.workspaceRoot);
    });

    return finalObservation;
  });
}, 30000);

it("rejects Troops carrier drift before Project Root writes", async () => {
  return verifyTroopEvidence("MV-S5-TROOP-SAFETY-003", async () => {
    let finalObservation: unknown;

    await withWindowsSandbox("mv25-troop-drift", async (s) => {
      const troops = await prepare(s.workspaceRoot);
      await writeFile(
        join(s.workspaceRoot, "Game/data/Troops.json"),
        JSON.stringify([null, { ...troops[1], name: "external edit" }]),
      );
      const before = await observe(s.workspaceRoot);
      await expect(api.pushWorkspace({ ...s, allowDestructive: false })).rejects.toThrow(/drift/i);
      expect(await observe(s.workspaceRoot)).toEqual(before);

      finalObservation = await observe(s.workspaceRoot);
    });

    return finalObservation;
  });
}, 30000);
