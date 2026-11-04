import {
  mkdir,
  readFile,
  readdir,
  lstat,
  readlink,
  rm,
  writeFile,
  rename,
  symlink,
  utimes,
  stat,
  cp,
  realpath,
} from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  createMinimalProject,
  withWindowsSandbox,
  type WindowsSandbox,
} from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const configName = "rpgmaker-event-dsl.config.json";
const media = "Game/img/pictures/Poster.png";
const sourceName = "src/workflow.events.ts";
const imports =
  'import {commonEvent,mapEvent,showPicture,imageAsset,callCommonEvent,commonEventRef,showAnimation,animationRef,changeTileset,tilesetRef} from "rpgmaker-event-dsl";\n';
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"Poster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
const directSource =
  imports +
  `export const event=commonEvent({id:10,name:"Workflow",trigger:"none",commands:[${picture}]});`;
const warningSource =
  imports +
  'export const event=mapEvent({mapId:1,id:1,name:"Workflow",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[],movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:imageAsset({folder:"pictures",name:"Poster"}),characterIndex:0}]}}}]});';
// The saved change-image route needs its native characters namespace.
const inactiveSource = warningSource.replace('folder:"pictures"', 'folder:"characters"');
async function tree(root: string): Promise<Record<string, string> | null> {
  const result: Record<string, string> = {};
  async function visit(path: string, prefix: string) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const absolute = join(path, entry.name);
      const key = prefix + entry.name;
      if (key === "operation.lock") continue;
      if ((await lstat(absolute)).isSymbolicLink())
        result[key] = `link:${await readlink(absolute)}`;
      else if (entry.isDirectory()) {
        result[key + "/"] = "directory";
        await visit(absolute, key + "/");
      } else result[key] = (await readFile(absolute)).toString("base64");
    }
  }
  try {
    await visit(root, "");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  return result;
}
async function observe(root: string) {
  return {
    config: await readFile(join(root, configName), "utf8"),
    source: await tree(join(root, "src")),
    dependencies: await readFile(
      join(root, "node_modules/rpgmaker-event-dsl/package.json"),
      "utf8",
    ),
    authoredTypes: await tree(join(root, "types")),
    publicTypes: await readFile(
      join(
        root,
        "node_modules/rpgmaker-event-dsl",
        process.env.MV_CLI_ENTRY === "built" ? "dist/index.d.mts" : "src/index.ts",
      ),
      "utf8",
    ),
    package: await readFile(join(root, "package.json"), "utf8"),
    project: await tree(join(root, "Game")),
    state: await tree(join(root, ".rpgmaker-event-dsl")),
  };
}
function fixedState(state: Record<string, string> | null) {
  return Object.fromEntries(
    Object.entries(state ?? {}).filter(
      ([key]) => key !== "sync-manifest.json" && !key.startsWith("generated-project-data/"),
    ),
  );
}
async function expectPublished(root: string, before: Awaited<ReturnType<typeof observe>>) {
  const after = await observe(root);
  expect({ ...after, state: before.state }).toEqual(before);
  expect(fixedState(after.state)).toEqual(fixedState(before.state));
  expect(after.state?.["generated-project-data/CommonEvents.json"]).toBeDefined();
  expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
}
async function put(root: string, path = media, content = "") {
  await mkdir(join(root, path, ".."), { recursive: true });
  await writeFile(join(root, path), content);
}
async function prepare(
  sandbox: WindowsSandbox,
  options: {
    source?: string;
    project?: Record<string, unknown>;
    clone?: boolean;
  } = {},
) {
  const root = sandbox.workspaceRoot;
  await createMinimalProject(root);
  const project = {
    "MapInfos.json": [null, { id: 1, name: "Map" }],
    "Map001.json": {
      id: 1,
      width: 1,
      height: 1,
      tilesetId: 1,
      events: [null],
      custom: { keep: ["opaque", null] },
    },
    ...options.project,
  };
  for (const [file, value] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  if (options.clone !== false) await api.cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "types"), { recursive: true });
  await writeFile(
    join(root, "types/workflow-input.ts"),
    'export type WorkflowInput = { readonly workflow: "asset validation" };\n',
  );
  const source =
    'import type { WorkflowInput } from "../types/workflow-input.js";\n' +
    (options.source ?? directSource);
  await writeFile(join(root, sourceName), source);
  await mkdir(join(root, "Game/img/pictures"), { recursive: true });
  await mkdir(join(root, "Game/img/characters"), { recursive: true });
  await mkdir(join(root, "Game/audio/se"), { recursive: true });
  await mkdir(join(root, "Game/movies"), { recursive: true });
}
type OperationInput = Parameters<typeof startWorkspaceOperation>[1];
async function operation(
  sandbox: WindowsSandbox,
  input: OperationInput,
  mutation?: () => Promise<void>,
) {
  const child = startWorkspaceOperation(sandbox, { ...input, observeAssets: true });
  try {
    if (mutation) {
      await child.waitFor("checkpoint");
      if (input.boundary === "asset-before-pass")
        expect(child.messages.filter((m) => m.kind === "asset-query")).toEqual([]);
      await mutation();
      child.send("release");
    }
    const result = input.mode === "cli" ? undefined : await child.waitFor("result");
    const exit = await child.ended;
    const process = sandbox.processes.at(-1)!;
    const text = [result?.message, process.stdout, process.stderr].filter(Boolean).join("\n");
    const actual = { exit, result, text, messages: child.messages, process };
    if (input.operation === "check" || input.operation === "compile")
      expect(child.messages.some((message) => message.kind === "asset-query")).toBe(true);
    expect(child.messages.filter((m) => m.kind === "asset-content-read-attempt")).toEqual([]);
    return actual;
  } finally {
    await child.stop();
  }
}
it("Check judges a deletion before its sole query and preserves all authority", async () => {
  await withWindowsSandbox("asset-workflow-before", async (sandbox) => {
    await prepare(sandbox);
    await put(sandbox.workspaceRoot);
    let before: Awaited<ReturnType<typeof observe>>;
    const result = await operation(
      sandbox,
      { operation: "check", boundary: "asset-before-pass" },
      async () => {
        await rm(join(sandbox.workspaceRoot, media));
        before = await observe(sandbox.workspaceRoot);
      },
    );
    expect(result.exit.exitCode).toBe(1);
    expect(result.text).toContain("error MV-ASSET-MISSING-FILE");
    expect(result.text).toContain("CommonEvents.json[10].list[0].parameters[1]");
    const after = await observe(sandbox.workspaceRoot);
    expect(after).toEqual(before!);
    expect(
      await readFile(join(sandbox.workspaceRoot, ".rpgmaker-event-dsl/operation.lock"), "utf8"),
    ).toBe("");
    expect(after.state?.["generated-project-data/"]).toBeUndefined();
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
  });
});
for (const phase of ["initial", "fresh", "stale"] as const)
  for (const outcome of ["success", "error", "warning"] as const)
    for (const mode of ["api", "cli"] as const)
      it(`Check retains the exact prepared output authority and every persistent carrier (${phase}, ${outcome}, ${mode})`, async () => {
        await withWindowsSandbox(`asset-workflow-${phase}-${outcome}-${mode}`, async (sandbox) => {
          const root = sandbox.workspaceRoot;
          await prepare(sandbox, { source: outcome === "warning" ? inactiveSource : directSource });
          if (outcome !== "warning") await put(root);
          if (phase !== "initial") await api.compileWorkspace({ ...sandbox, check: false });
          if (phase === "stale")
            await writeFile(
              join(root, sourceName),
              (await readFile(join(root, sourceName), "utf8")) + "\n// changed compilation input\n",
            );
          if (outcome === "error") await rm(join(root, media));
          const before = await observe(root);
          expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(phase === "fresh");
          const result = await operation(sandbox, { operation: "check", mode });
          expect(result.exit.exitCode).toBe(outcome === "error" ? 1 : 0);
          if (outcome !== "success") {
            expect(result.text).toContain(`${outcome} MV-ASSET-MISSING-FILE`);
            expect(result.text).toContain(
              outcome === "warning"
                ? "Autonomous Movement is fixed"
                : "CommonEvents.json[10].list[0].parameters[1]",
            );
            expect(result.text).toContain("1 use(s)");
          } else expect(result.text).not.toContain("MV-ASSET-");
          expect(await observe(root)).toEqual(before);
          expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(phase === "fresh");
        });
      });
for (const [branch, mode] of [
  ["delete-before-gate", "cli"],
  ["repair-before-gate", "api"],
  ["stable-warning", "api"],
] as const)
  it(`the only Check gate uses current facts and remains read only (${branch}, ${mode})`, async () => {
    await withWindowsSandbox(`asset-workflow-check-${branch}-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox, {
        source: branch === "stable-warning" ? inactiveSource : directSource,
      });
      if (branch === "delete-before-gate") await put(root);
      let before: Awaited<ReturnType<typeof observe>>;
      const result = await operation(
        sandbox,
        { operation: "check", mode, boundary: "asset-before-pass" },
        async () => {
          if (branch === "delete-before-gate") await rm(join(root, media));
          if (branch === "repair-before-gate") await put(root);
          before = await observe(root);
        },
      );
      expect(result.exit.exitCode).toBe(branch === "delete-before-gate" ? 1 : 0);
      if (branch !== "repair-before-gate")
        expect(result.text).toContain(
          `${branch === "stable-warning" ? "warning" : "error"} MV-ASSET-MISSING-FILE`,
        );
      else expect(result.text).not.toContain("MV-ASSET-");
      expect(await observe(root)).toEqual(before!);
    });
  });
for (const [branch, mode] of [
  ["error-at-gate", "api"],
  ["error-at-gate", "cli"],
  ["repair-before-gate", "api"],
] as const)
  it(`Compile validates the current asset facts before any publication (${branch}, ${mode})`, async () => {
    await withWindowsSandbox(`asset-workflow-compile-${branch}-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox);
      if (branch === "error-at-gate") await put(root);
      let before: Awaited<ReturnType<typeof observe>>;
      const result = await operation(
        sandbox,
        { operation: "compile", mode, boundary: "asset-before-pass" },
        async () => {
          if (branch === "error-at-gate") await rm(join(root, media));
          else await put(root);
          before = await observe(root);
          expect(before.state?.["generated-project-data/"]).toBeUndefined();
        },
      );
      expect(result.exit.exitCode).toBe(branch === "error-at-gate" ? 1 : 0);
      if (branch === "error-at-gate") {
        expect(result.text).toContain("error MV-ASSET-MISSING-FILE");
        expect(await observe(root)).toEqual(before!);
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      } else await expectPublished(root, before!);
    });
  });
for (const mode of ["api", "cli"] as const)
  it(`completed media validation is not repeated at Manifest publication (${mode})`, async () => {
    await withWindowsSandbox(`asset-workflow-manifest-${mode}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox);
      await put(root);
      const before = await observe(root);
      const result = await operation(
        sandbox,
        { operation: "compile", mode, boundary: "compile-manifest" },
        async () => {
          await rm(join(root, media));
        },
      );
      expect(result.exit.exitCode).toBe(0);
      const checkpoint = result.messages.findIndex((m) => m.kind === "checkpoint");
      expect(result.messages.slice(checkpoint + 1).filter((m) => m.kind === "asset-query")).toEqual(
        [],
      );
      delete before.project!["img/pictures/Poster.png"];
      await expectPublished(root, before);
      const complete = await observe(root);
      const next = await operation(sandbox, { operation: "check" });
      expect(next.exit.exitCode).toBe(1);
      expect(next.text).toContain("MV-ASSET-MISSING-FILE");
      expect(await observe(root)).toEqual(complete);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
    });
  });
it("failed Manifest I/O after installation leaves unusable output until a successful Compile", async () => {
  await withWindowsSandbox("asset-workflow-io", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(sandbox);
    await put(root);
    await api.compileWorkspace({ ...sandbox, check: false });
    await writeFile(
      join(root, sourceName),
      directSource.replace('name:"Workflow"', 'name:"New candidate"'),
    );
    const before = await observe(root);
    const result = await operation(sandbox, {
      operation: "compile",
      boundary: "snapshot-manifest-failure",
    });
    expect(result.exit.exitCode).toBe(1);
    expect(result.text).toContain("Controlled Snapshot manifest publication failure");
    const after = await observe(root);
    expect({ ...after, state: before.state }).toEqual(before);
    expect(fixedState(after.state)).toEqual(fixedState(before.state));
    expect(after.state?.["sync-manifest.json"]).toEqual(before.state?.["sync-manifest.json"]);
    expect(after.state?.["generated-project-data/CommonEvents.json"]).not.toEqual(
      before.state?.["generated-project-data/CommonEvents.json"],
    );
    expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
    await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale|integrity/iu);
    expect(await observe(root)).toEqual(after);
    await api.compileWorkspace({ ...sandbox, check: false });
    await expectPublished(root, after);
    expect(await api.diffWorkspace(sandbox)).toContain("[generated-only] commonEventId 10");
  });
});
for (const branch of [
  "content",
  "size",
  "mtime",
  "file-identity",
  "unrelated-directory-entry",
] as const)
  it(`irrelevant media changes do not affect an otherwise valid current existence query (${branch})`, async () => {
    await withWindowsSandbox(`asset-workflow-irrelevant-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox);
      await put(root, media, "AB");
      const original = await stat(join(root, media));
      let before: Awaited<ReturnType<typeof observe>>;
      const result = await operation(
        sandbox,
        { operation: "check", boundary: "asset-before-pass" },
        async () => {
          if (branch === "content") await writeFile(join(root, media), "CD");
          if (branch === "size") await writeFile(join(root, media), "ABCDE");
          if (branch === "mtime")
            await utimes(
              join(root, media),
              new Date("2001-01-01T00:00:00Z"),
              new Date("2001-01-01T00:00:00Z"),
            );
          if (branch === "file-identity") {
            await rename(join(root, media), join(sandbox.root, "retained-original.png"));
            await put(root, media, "AB");
          }
          if (branch === "unrelated-directory-entry")
            await put(root, "Game/img/pictures/Unrelated.png", "unrelated");
          const current = await stat(join(root, media));
          if (branch === "content") {
            expect(current.size).toBe(2);
            expect(await readFile(join(root, media), "utf8")).toBe("CD");
          }
          if (branch === "size") expect(current.size).toBe(5);
          if (branch === "mtime")
            expect(current.mtime.toISOString()).toBe("2001-01-01T00:00:00.000Z");
          if (branch === "file-identity") expect(current.ino).not.toBe(original.ino);
          before = await observe(root);
        },
      );
      expect(result.exit.exitCode).toBe(0);
      expect(result.text).not.toContain("MV-ASSET-");
      expect(await observe(root)).toEqual(before!);
    });
  });
const relationProject = (kind: "animation" | "tileset", name: string) =>
  kind === "animation"
    ? {
        "Animations.json": [
          null,
          {
            id: 1,
            name: "External Animation",
            animation1Name: name,
            animation2Name: "",
            timings: [],
            custom: { keep: ["animation", null, 7] },
          },
        ],
      }
    : {
        "Tilesets.json": [
          null,
          {
            id: 1,
            name: "External Tileset",
            tilesetNames: [name, "", "", "", "", "", "", "", ""],
            custom: { keep: ["tileset", null, 9] },
          },
        ],
      };
const relationSource = (kind: "animation" | "tileset") =>
  imports +
  `export const event=mapEvent({mapId:1,id:1,name:"Workflow",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${kind === "animation" ? 'showAnimation({target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:animationRef({id:1}),wait:false})' : "changeTileset({tileset:tilesetRef({id:1})})"}]}]});`;
const relationMedia = (kind: "animation" | "tileset", name: string) =>
  `Game/img/${kind === "animation" ? "animations" : "tilesets"}/${name}.png`;
async function renameLiveRelation(root: string, kind: "animation" | "tileset", name: string) {
  const values = relationProject(kind, name);
  for (const [file, value] of Object.entries(values))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
}
for (const kind of ["animation", "tileset"] as const)
  it(`Compile uses captured external names while Push still rejects unpulled standard-data drift (${kind})`, async () => {
    await withWindowsSandbox(`asset-workflow-unpulled-${kind}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox, {
        source: relationSource(kind),
        project: { "CommonEvents.json": [null], ...relationProject(kind, "CapturedOld") },
      });
      await put(root, relationMedia(kind, "CapturedOld"));
      await api.compileWorkspace({ ...sandbox, check: false });
      const snapshot = await tree(join(root, ".rpgmaker-event-dsl/project-data-snapshot"));
      await renameLiveRelation(root, kind, "LiveNew");
      await rm(join(root, relationMedia(kind, "CapturedOld")));
      await put(root, relationMedia(kind, "LiveNew"));
      const before = await observe(root);
      const result = await operation(sandbox, { operation: "compile" });
      expect(result.exit.exitCode).toBe(1);
      expect(result.text).toContain('"CapturedOld"');
      expect(result.text).not.toContain('"LiveNew"');
      expect(result.text).toContain(
        kind === "animation"
          ? "Animations.json[1].animation1Name"
          : "Tilesets.json[1].tilesetNames[0]",
      );
      expect(await observe(root)).toEqual(before);
      await put(root, relationMedia(kind, "CapturedOld"));
      await api.compileWorkspace({ ...sandbox, check: false });
      const compiled = await observe(root);
      await expect(api.pushWorkspace({ ...sandbox, allowDestructive: true })).rejects.toThrow(
        /drift/iu,
      );
      expect(await observe(root)).toEqual(compiled);
      expect(await tree(join(root, ".rpgmaker-event-dsl/project-data-snapshot"))).toEqual(snapshot);
    });
  });
it("Pull invalidates output and a new Compile uses newly captured Animation and Tileset names", async () => {
  for (const kind of ["animation", "tileset"] as const)
    await withWindowsSandbox(`asset-workflow-pulled-${kind}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox, {
        source: relationSource(kind),
        project: { "CommonEvents.json": [null], ...relationProject(kind, "CapturedOld") },
      });
      await put(root, relationMedia(kind, "CapturedOld"));
      await api.compileWorkspace({ ...sandbox, check: false });
      await renameLiveRelation(root, kind, "PulledNew");
      await rm(join(root, relationMedia(kind, "CapturedOld")));
      await put(root, relationMedia(kind, "PulledNew"));
      await api.pullWorkspace(sandbox);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      const before = await observe(root);
      const checked = await operation(sandbox, { operation: "check" });
      expect(checked.exit.exitCode).toBe(0);
      expect(await observe(root)).toEqual(before);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      await api.compileWorkspace({ ...sandbox, check: false });
      await expectPublished(root, before);
      const captured = JSON.parse(
        await readFile(
          join(
            root,
            ".rpgmaker-event-dsl/project-data-snapshot",
            kind === "animation" ? "Animations.json" : "Tilesets.json",
          ),
          "utf8",
        ),
      );
      expect(captured[1]).toEqual(Object.values(relationProject(kind, "PulledNew"))[0][1]);
    });
});
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Event ${id}",trigger:"none",commands:[${commands}]});\n`;
const call = (id: number) => `callCommonEvent({commonEvent:commonEventRef({id:${id}})})`;
const graphSource =
  imports +
  common(10, `${picture},${call(11)},${call(11)}`) +
  common(11, `${picture},${call(12)}`) +
  common(12, call(10));
const graphUses = [
  "commonEvent:10 CommonEvents.json[10].list[0].parameters[1]",
  "commonEvent:11 CommonEvents.json[11].list[0].parameters[1]",
];
function expectGraphFailure(text: string) {
  expect(text).toContain('image/pictures "Poster"; 2 use(s)');
  const uses = text.split("\n").filter((line) => line.startsWith("  - error commonEvent:"));
  expect(uses).toHaveLength(2);
  for (const line of uses) {
    expect(line).not.toContain("; chain:");
    expect(line).not.toContain("; conditions:");
    expect(line).not.toContain("; related:");
    expect(line).not.toContain("; inactive:");
  }
  for (const use of graphUses) expect(uses.filter((line) => line.includes(use))).toHaveLength(1);
  expect(text).not.toContain(" -> commonEvent:");
  expect(text).not.toContain("CommonEvents.json[12].list[0].parameters[0]");
}
for (const branch of ["same-pass-reuse", "next-command-fresh"] as const)
  it(`cyclic Common Events report independent asset uses and each command checks current file facts (${branch})`, async () => {
    await withWindowsSandbox(`asset-workflow-graph-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox, { source: graphSource });
      if (branch === "next-command-fresh") {
        await put(root);
        await api.compileWorkspace({ ...sandbox, check: false });
        await rm(join(root, media));
      }
      const before = await observe(root);
      for (const operationName of (branch === "same-pass-reuse"
        ? ["check", "compile", "check"]
        : ["check"]) as ("check" | "compile")[]) {
        const result = await operation(sandbox, { operation: operationName });
        expect(result.exit.exitCode).toBe(1);
        expectGraphFailure(result.text);
        expect(result.messages.some((m) => m.kind === "asset-query")).toBe(true);
        expect(await observe(root)).toEqual(before);
      }
      if (branch === "next-command-fresh") {
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
        await put(root);
        const repaired = await observe(root);
        const result = await operation(sandbox, { operation: "check" });
        expect(result.exit.exitCode).toBe(0);
        expect(result.messages.some((m) => m.kind === "asset-query")).toBe(true);
        expect(await observe(root)).toEqual(repaired);
      }
    });
  });
for (const operationName of ["check", "compile"] as const)
  for (const branch of [
    "presence",
    "case-match",
    "path-type",
    "path-link",
    "queryability",
    "failure-location",
    "improvement",
  ] as const)
    it(`only current facts at the single ${operationName} query decide the outcome (${branch}, ${operationName})`, async () => {
      await withWindowsSandbox(
        `asset-workflow-current-${operationName}-${branch}`,
        async (sandbox) => {
          const root = sandbox.workspaceRoot;
          const warning = branch === "failure-location";
          await prepare(sandbox, { source: warning ? inactiveSource : directSource });
          if (branch !== "improvement" && !warning) await put(root);
          if (warning) await rm(join(root, "Game/img/characters"), { recursive: true });
          let before: Awaited<ReturnType<typeof observe>>;
          const result = await operation(
            sandbox,
            {
              operation: operationName,
              boundary: "asset-before-pass",
              ...(branch === "queryability" ? { assetFault: "enumeration" as const } : {}),
            },
            async () => {
              if (branch === "presence") await rm(join(root, media));
              if (branch === "case-match") {
                await rename(join(root, media), join(root, "Game/img/pictures/temporary.png"));
                await rename(
                  join(root, "Game/img/pictures/temporary.png"),
                  join(root, "Game/img/pictures/poster.png"),
                );
              }
              if (branch === "path-type") {
                await rm(join(root, media));
                await mkdir(join(root, media));
              }
              if (branch === "path-link") {
                await rm(join(root, media));
                const target = join(sandbox.root, "linked directory");
                await mkdir(target);
                await symlink(target, join(root, media), "junction");
              }
              if (branch === "failure-location") await mkdir(join(root, "Game/img/characters"));
              if (branch === "improvement") await put(root);
              before = await observe(root);
            },
          );
          const succeeds = warning || branch === "improvement";
          expect(result.exit.exitCode).toBe(succeeds ? 0 : 1);
          const codes = {
            presence: "MISSING-FILE",
            "case-match": "NAME-MISMATCH",
            "path-type": "PATH-TYPE",
            "path-link": "UNSUPPORTED-LINK",
            queryability: "QUERY-FAILED",
            "failure-location": "MISSING-FILE",
            improvement: null,
          };
          if (codes[branch])
            expect(result.text).toContain(
              `${warning ? "warning" : "error"} MV-ASSET-${codes[branch]}`,
            );
          else expect(result.text).not.toContain("MV-ASSET-");
          if (warning) {
            expect(result.text).not.toContain("MV-ASSET-MISSING-DIRECTORY");
            expect(result.text).toContain("Autonomous Movement is fixed");
          }
          if (branch === "queryability")
            expect(result.text).toContain("Controlled asset workflow enumeration denied");
          if (operationName === "compile" && succeeds) await expectPublished(root, before!);
          else expect(await observe(root)).toEqual(before!);
        },
      );
    });
it("a completed Check pass is not repeated before return and a new command observes missing media", async () => {
  await withWindowsSandbox("asset-workflow-after-check", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(sandbox);
    await put(root);
    let atBoundary: Awaited<ReturnType<typeof observe>>;
    const result = await operation(
      sandbox,
      { operation: "check", boundary: "asset-after-check-pass" },
      async () => {
        await rm(join(root, media));
        atBoundary = await observe(root);
      },
    );
    expect(result.exit.exitCode).toBe(0);
    expect(result.messages.some((m) => m.kind === "asset-pass-entered")).toBe(true);
    const completedIndex = result.messages.findIndex((m) => m.kind === "checkpoint");
    expect(
      result.messages.slice(completedIndex + 1).filter((m) => m.kind === "asset-query"),
    ).toEqual([]);
    expect(await observe(root)).toEqual(atBoundary!);
    const next = await operation(sandbox, { operation: "check" });
    expect(next.exit.exitCode).toBe(1);
    expect(next.text).toContain("error MV-ASSET-MISSING-FILE");
    expect(await observe(root)).toEqual(atBoundary!);
  });
});
const manifestFile = (root: string) => join(root, ".rpgmaker-event-dsl/sync-manifest.json");
async function manifest(root: string) {
  return JSON.parse(await readFile(manifestFile(root), "utf8"));
}
for (const branch of ["pull", "rebind", "contract-change", "check-does-not-refresh"] as const)
  it(`a stale compile basis requires explicit successful Compile and Check preserves it (${branch})`, async () => {
    await withWindowsSandbox(`asset-workflow-basis-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox);
      await put(root);
      await api.compileWorkspace({ ...sandbox, check: false });
      const original = await manifest(root);
      let otherTree: Record<string, string> | null = null;
      if (branch === "contract-change") {
        const old = await manifest(root);
        old.compileBaseline.compileContractVersion = "mv-1.6.1/36";
        await writeFile(manifestFile(root), JSON.stringify(old));
      }
      if (branch === "check-does-not-refresh")
        await writeFile(
          join(root, sourceName),
          (await readFile(join(root, sourceName), "utf8")) + "\n// stale source basis\n",
        );
      if (branch === "pull") {
        const path = join(root, "Game/data/Map001.json");
        const map = JSON.parse(await readFile(path, "utf8"));
        map.custom.keep.push("pulled");
        await writeFile(path, JSON.stringify(map));
        await api.pullWorkspace(sandbox);
        expect(await manifest(root)).not.toHaveProperty("compileBaseline");
      }
      if (branch === "rebind") {
        await cp(join(root, "Game"), join(root, "Other Game"), { recursive: true });
        otherTree = await tree(join(root, "Other Game"));
        const config = JSON.parse(await readFile(join(root, configName), "utf8"));
        config.projectRoot = "./Other Game";
        await writeFile(join(root, configName), JSON.stringify(config));
        const before = await observe(root);
        await expect(api.compileWorkspace({ ...sandbox, check: true })).rejects.toThrow(
          "Project Root Binding",
        );
        expect(await observe(root)).toEqual(before);
        await api.pullWorkspace(sandbox);
        expect((await manifest(root)).projectRootBinding).toBe(
          (await realpath(join(root, "Other Game"))).toLowerCase(),
        );
        expect(await manifest(root)).not.toHaveProperty("compileBaseline");
      }
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      const stale = await observe(root);
      await api.compileWorkspace({ ...sandbox, check: true });
      expect(await observe(root)).toEqual(stale);
      expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale|compile/iu);
      expect(await observe(root)).toEqual(stale);
      await api.compileWorkspace({ ...sandbox, check: false });
      await expectPublished(root, stale);
      if (branch === "contract-change")
        expect((await manifest(root)).compileBaseline.compileContractVersion).toBe(
          original.compileBaseline.compileContractVersion,
        );
      if (branch === "rebind") {
        expect(await tree(join(root, "Other Game"))).toEqual(otherTree);
        const config = JSON.parse(await readFile(join(root, configName), "utf8"));
        await symlink(join(root, "Other Game"), join(root, "Project alias"), "junction");
        config.projectRoot = "./Project alias";
        await writeFile(join(root, configName), JSON.stringify(config));
        const aliased = await observe(root);
        await api.compileWorkspace({ ...sandbox, check: true });
        expect(await observe(root)).toEqual(aliased);
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(true);
      }
    });
  });
const projectPicture = {
  id: 10,
  name: "External original name",
  trigger: 0,
  switchId: 1,
  list: [
    { code: 231, indent: 0, parameters: [1, "Poster", 0, 0, 0, 0, 100, 100, 255, 0] },
    { code: 0, indent: 0, parameters: [] },
  ],
};
for (const name of ["clone", "pull", "decompile", "diff"] as const)
  it(`missing selected media adds no gate to ${name} and ordinary state rules remain (${name})`, async () => {
    await withWindowsSandbox(`asset-workflow-no-gate-${name}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(sandbox, {
        clone: name !== "clone",
        project: { "CommonEvents.json": [null, ...Array(9).fill(null), projectPicture] },
      });
      if (name === "decompile") await rm(join(root, sourceName));
      if (name === "diff" || name === "pull") {
        await put(root);
        await api.compileWorkspace({ ...sandbox, check: false });
        await rm(join(root, media));
      }
      if (name === "pull") {
        const live = JSON.parse(await readFile(join(root, "Game/data/CommonEvents.json"), "utf8"));
        live[10].name = "Pulled original name";
        await writeFile(join(root, "Game/data/CommonEvents.json"), JSON.stringify(live));
      }
      const before = await observe(root);
      const result = await operation(sandbox, {
        operation: name,
        boundary: "asset-no-media-query",
      });
      expect(result.exit.exitCode).toBe(0);
      expect(result.messages.filter((m) => m.kind === "asset-query")).toEqual([]);
      expect(result.text).not.toContain("MV-ASSET-");
      const after = await observe(root);
      expect({ ...after, state: before.state, source: before.source }).toEqual(before);
      if (name === "diff") expect(after).toEqual(before);
      if (name === "decompile") {
        expect(after.state).toEqual({ ...before.state, "decompile-candidates/": "directory" });
        expect(Object.keys(after.source ?? {})).toContain("decompiled/common-events.events.ts");
        const decompiled = await readFile(
          join(root, "src/decompiled/common-events.events.ts"),
          "utf8",
        );
        expect(decompiled).toContain("External original name");
        expect(decompiled).toContain("Poster");
      }
      if (name === "clone" || name === "pull") {
        expect(after.source).toEqual(before.source);
        expect(await manifest(root)).not.toHaveProperty("compileBaseline");
        expect(
          await readFile(
            join(root, ".rpgmaker-event-dsl/project-data-snapshot/CommonEvents.json"),
            "utf8",
          ),
        ).toBe(await readFile(join(root, "Game/data/CommonEvents.json"), "utf8"));
        expect(
          Object.keys(after.state ?? {}).filter((key) => /\.(png|ogg|webm)$/u.test(key)),
        ).toEqual([]);
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
      }
    });
  });
const externalProject = {
  ...relationProject("animation", "OriginalFirst"),
  ...relationProject("tileset", "OriginalTile"),
  "Actors.json": [
    null,
    {
      id: 1,
      name: "Unrelated Actor Original",
      characterName: "UnselectedCharacter",
      battlerName: "UnselectedBattler",
      custom: { unknown: [null, "kept"] },
    },
  ],
};
const ownershipSource = relationSource("animation").replace(
  "wait:false})",
  "wait:false}),changeTileset({tileset:tilesetRef({id:1})})",
);
async function prepareOwnership(sandbox: WindowsSandbox) {
  await prepare(sandbox, { source: ownershipSource, project: externalProject });
  await put(sandbox.workspaceRoot, relationMedia("animation", "OriginalFirst"), "image bytes");
  await put(sandbox.workspaceRoot, relationMedia("tileset", "OriginalTile"), "tileset bytes");
}
for (const outcome of ["success", "failure"] as const)
  it(`Check preserves external necessary fields original names unknown fields and media bytes without copies or backups (${outcome})`, async () => {
    await withWindowsSandbox(`asset-workflow-readonly-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepareOwnership(sandbox);
      if (outcome === "failure") await rm(join(root, relationMedia("animation", "OriginalFirst")));
      const before = await observe(root);
      const result = await operation(sandbox, { operation: "check" });
      expect(result.exit.exitCode).toBe(outcome === "success" ? 0 : 1);
      if (outcome === "failure") {
        expect(result.text).toContain('"OriginalFirst"');
        expect(result.text).toContain("Animations.json[1].animation1Name");
      }
      expect(await observe(root)).toEqual(before);
      for (const [file, value] of Object.entries(externalProject)) {
        expect(JSON.parse(await readFile(join(root, "Game/data", file), "utf8"))).toEqual(value);
        expect(
          JSON.parse(
            await readFile(join(root, ".rpgmaker-event-dsl/project-data-snapshot", file), "utf8"),
          ),
        ).toEqual(value);
      }
      expect(before.state?.["generated-project-data/"]).toBeUndefined();
      expect(
        Object.keys(before.state ?? {}).filter(
          (key) => /\.(png|ogg|webm)$/u.test(key) || key.includes("backup"),
        ),
      ).toEqual([]);
    });
  });
for (const outcome of ["success", "failure"] as const)
  it(`Compile changes only permitted output metadata and never writes media or captured external fields (${outcome})`, async () => {
    await withWindowsSandbox(`asset-workflow-ownership-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepareOwnership(sandbox);
      if (outcome === "failure") await rm(join(root, relationMedia("animation", "OriginalFirst")));
      const before = await observe(root);
      const result = await operation(sandbox, { operation: "compile" });
      expect(result.exit.exitCode).toBe(outcome === "success" ? 0 : 1);
      if (outcome === "success") await expectPublished(root, before);
      else {
        expect(result.text).toContain("error MV-ASSET-MISSING-FILE");
        expect(await observe(root)).toEqual(before);
        await put(root, relationMedia("animation", "OriginalFirst"), "image bytes");
        await api.compileWorkspace({ ...sandbox, check: false });
        await writeFile(
          join(root, sourceName),
          (await readFile(join(root, sourceName), "utf8")).replace(
            'name:"Workflow"',
            'name:"Candidate after publication starts"',
          ),
        );
        const beforeIO = await observe(root);
        const failed = await operation(sandbox, {
          operation: "compile",
          boundary: "snapshot-manifest-failure",
        });
        expect(failed.exit.exitCode).toBe(1);
        expect(failed.text).toContain("Controlled Snapshot manifest publication failure");
        const invalid = await observe(root);
        expect({ ...invalid, state: beforeIO.state }).toEqual(beforeIO);
        expect(fixedState(invalid.state)).toEqual(fixedState(beforeIO.state));
        expect(invalid.state?.["sync-manifest.json"]).toEqual(
          beforeIO.state?.["sync-manifest.json"],
        );
        expect(invalid.state?.["generated-project-data/Map001.json"]).not.toEqual(
          beforeIO.state?.["generated-project-data/Map001.json"],
        );
        expect(await api.isGeneratedProjectDataFresh(sandbox)).toBe(false);
        await expect(api.diffWorkspace(sandbox)).rejects.toThrow(/stale|integrity/iu);
        await api.compileWorkspace({ ...sandbox, check: false });
        await expectPublished(root, invalid);
      }
      for (const [file, value] of Object.entries(externalProject))
        expect(JSON.parse(await readFile(join(root, "Game/data", file), "utf8"))).toEqual(value);
      const compiled = await manifest(root);
      expect(Object.keys(compiled.compileBaseline).sort()).toEqual([
        "compileContractVersion",
        "config",
        "hash",
        "projectRootBinding",
        "snapshotFiles",
        "sourceFiles",
        "typeInputs",
      ]);
      expect(compiled.compileBaseline.config.assetCheckExceptions).toEqual([]);
      expect(
        compiled.compileBaseline.typeInputs.some((input: { path: string }) =>
          input.path?.replaceAll("\\", "/").endsWith("/types/workflow-input.ts"),
        ),
      ).toBe(true);
      const outputMap = JSON.parse(
        await readFile(
          join(root, ".rpgmaker-event-dsl/generated-project-data/Map001.json"),
          "utf8",
        ),
      );
      expect(outputMap.custom).toEqual({ keep: ["opaque", null] });
      expect(
        Object.keys((await observe(root)).state ?? {}).filter(
          (key) =>
            /\.(png|ogg|webm)$/u.test(key) ||
            key.includes("backup") ||
            key.includes("pending-push"),
        ),
      ).toEqual([]);
    });
  });
