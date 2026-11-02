import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectEventAssetUses } from "../src/validation/asset-uses.js";

const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "05", testSource: import.meta.url });
const imports =
  'import {mapEvent,audioAsset,movieAsset,rawDslCommand,changeBattleBgm,changeVictoryMe,changeDefeatMe,changeVehicleBgm,playBgm,playBgs,playMe,playSe,playMovie,setMovementRoute} from "rpgmaker-event-dsl";\n';
const source = (command: string, pageFields = "") =>
  `${imports}export const event=mapEvent({mapId:1,id:1,name:"Media",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]${pageFields}}]});`;
async function prepare(root: string, authored: string, overrides: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  const project = {
    "MapInfos.json": [null, { id: 1, name: "Media" }],
    "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
    "Tilesets.json": [null, { id: 1, name: "Tiles" }],
    ...overrides,
  };
  recordAssetInput({
    baseFixture: "packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json",
    source: authored,
    projectOverrides: project,
  });
  for (const [file, value] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await writeFile(join(root, "src/media.events.ts"), authored);
}
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries)
    if (entry.isDirectory())
      for (const [name, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = bytes;
    else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  return result;
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    source: await tree(join(root, "src")),
    project: await tree(join(root, "Game")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
  };
}
async function published(root: string) {
  const path = getWorkspaceStatePaths(root).generatedProjectDataDirectory,
    files = new Map<string, string>();
  for (const name of await readdir(path)) files.set(name, await readFile(join(path, name), "utf8"));
  return {
    uses: collectEventAssetUses(files),
    page: JSON.parse(files.get("Map001.json")!).events[1].pages[0],
  };
}
type MediaVector = {
  family: string;
  code: number;
  folder: string;
  parameter: number;
  helper: string;
  vehicle?: boolean;
  movie?: boolean;
};
const vectors: MediaVector[] = [];
const audio = (folder: string, name: string | null) =>
  `{asset:${name === null ? "null" : `audioAsset({folder:${JSON.stringify(folder)},name:${JSON.stringify(name)}})`},volume:17,pitch:73,pan:-41}`;
const expression = (vector: MediaVector, name: string | null) =>
  vector.movie
    ? `playMovie({movie:${name === null ? "null" : `movieAsset({name:${JSON.stringify(name)}})`}})`
    : `${vector.helper}({${vector.vehicle ? 'vehicle:"ship",' : ""}audio:${audio(vector.folder, name)}})`;
const parameters = (vector: MediaVector, name: string) =>
  vector.movie
    ? [name]
    : [...(vector.vehicle ? [1] : []), { name, volume: 17, pitch: 73, pan: -41 }];
const expectedUse = (vector: MediaVector, name: string) => ({
  category: vector.movie ? "movie" : "audio",
  folder: vector.folder,
  name,
  identity: "map:1/event:1",
  nativePath: `Map001.json.events[1].pages[0].list[0].parameters[${vector.parameter}]${vector.movie ? "" : ".name"}`,
  relatedNativePaths: [],
  dependencyChain: [],
  conditions: [],
});
async function mediaFile(
  root: string,
  folder: string,
  name: string,
  extension = folder === "movies" ? ".webm" : ".ogg",
) {
  const path = join(
    root,
    "Game",
    ...(folder === "movies" ? [] : ["audio"]),
    folder,
    `${name}${extension}`,
  );
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, "");
  recordAssetInput({ ordinaryZeroByteFile: path, extension, timing: "before the asset gate" });
  return path;
}
function matrix(vector: MediaVector) {
  vectors.push(vector);
  for (const representation of ["formal", "raw"] as const)
    for (const outcome of ["present", "missing"] as const)
      it(`AV.${vector.family}.base.${representation}.p${vector.parameter}${vector.movie ? "" : "-name"}.${outcome}: direct media fields retain exact independent native values and origins`, async () => {
        await withWindowsSandbox(
          `asset-${vector.family}-${representation}-${outcome}`,
          async ({ workspaceRoot: root }) => {
            const name = `${vector.family}-${representation}-${outcome}`;
            await prepare(
              root,
              source(
                representation === "formal"
                  ? expression(vector, name)
                  : `rawDslCommand({code:${vector.code},parameters:${JSON.stringify(parameters(vector, name))}})`,
              ),
            );
            if (outcome === "missing") {
              await mkdir(join(root, "Game", ...(vector.movie ? [] : ["audio"]), vector.folder), {
                recursive: true,
              });
              const before = await state(root);
              for (const check of [true, false]) {
                const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
                  () => "",
                  String,
                );
                expect(failure).toContain("MV-ASSET-MISSING-FILE");
                expect(failure).toContain(expectedUse(vector, name).nativePath);
                expect(failure).toContain(JSON.stringify(name));
                expect(await state(root)).toEqual(before);
              }
              await mediaFile(root, vector.folder, name);
              await compileWorkspace({ workspaceRoot: root, check: false });
              const repaired = await published(root);
              expect(repaired.uses).toEqual([expectedUse(vector, name)]);
              expect(repaired.page.list[0].parameters).toEqual(parameters(vector, name));
            } else {
              await mediaFile(root, vector.folder, name);
              const before = await state(root);
              await compileWorkspace({ workspaceRoot: root, check: true });
              expect(await state(root)).toEqual(before);
              await compileWorkspace({ workspaceRoot: root, check: false });
              const actual = await published(root);
              expect(actual.uses).toEqual([expectedUse(vector, name)]);
              expect(actual.page.list[0].parameters).toEqual(parameters(vector, name));
            }
          },
        );
      });
}
matrix({ family: "A03", code: 132, folder: "bgm", parameter: 0, helper: "changeBattleBgm" });

matrix({ family: "A04", code: 133, folder: "me", parameter: 0, helper: "changeVictoryMe" });

matrix({ family: "A05", code: 139, folder: "me", parameter: 0, helper: "changeDefeatMe" });

matrix({
  family: "A06",
  code: 140,
  folder: "bgm",
  parameter: 1,
  helper: "changeVehicleBgm",
  vehicle: true,
});

matrix({ family: "A08", code: 241, folder: "bgm", parameter: 0, helper: "playBgm" });

matrix({ family: "A09", code: 245, folder: "bgs", parameter: 0, helper: "playBgs" });

matrix({ family: "A10", code: 249, folder: "me", parameter: 0, helper: "playMe" });

matrix({ family: "A11", code: 250, folder: "se", parameter: 0, helper: "playSe" });
matrix({
  family: "A12",
  code: 261,
  folder: "movies",
  parameter: 0,
  helper: "playMovie",
  movie: true,
});

const routeSe = { code: 44, parameters: [{ name: "RouteSE", volume: 17, pitch: 73, pan: -41 }] };
const nativeRoute = { list: [routeSe, { code: 0 }], repeat: false, skippable: false, wait: false };
const formalRoute = `setMovementRoute({target:{kind:"runtimeSelector",scope:"character",target:"player"},route:{commands:[{kind:"playSe",audio:${audio("se", "RouteSE")}}]}})`;
const rawRoute = [
  { code: 205, parameters: [-1, nativeRoute] },
  { code: 505, parameters: [routeSe] },
]
  .map((value) => `rawDslCommand(${JSON.stringify(value)})`)
  .join(",");
const routeUse = {
  category: "audio",
  folder: "se",
  name: "RouteSE",
  identity: "map:1/event:1",
  nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1].list[0].parameters[0].name",
  relatedNativePaths: ["Map001.json.events[1].pages[0].list[1].parameters[0].parameters[0].name"],
  dependencyChain: [],
  conditions: [],
};
const autonomousUse = {
  ...routeUse,
  nativePath: "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0].name",
  relatedNativePaths: [],
};
for (const [branch, representation, command, pageFields] of [
  [
    "autonomous",
    "page",
    "",
    `,movement:{type:"custom",route:{commands:[{kind:"playSe",audio:${audio("se", "RouteSE")}}]}}`,
  ],
  ["set-route", "formal", formalRoute, ""],
  ["set-route", "raw", rawRoute, ""],
] as const)
  for (const outcome of ["present", "missing"] as const)
    it(`AV.A18.${branch}.${representation}.p0-name.${outcome}: route SE has one defining use and exact mirror positions`, async () => {
      await withWindowsSandbox(
        `asset-se-${branch}-${representation}-${outcome}`,
        async ({ workspaceRoot: root }) => {
          await prepare(root, source(command, pageFields));
          await mkdir(join(root, "Game/audio/se"), { recursive: true });
          if (outcome === "missing") {
            const before = await state(root);
            for (const check of [true, false]) {
              const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
                () => "",
                String,
              );
              expect(failure).toContain("MV-ASSET-MISSING-FILE");
              expect(failure).toContain(
                (branch === "autonomous" ? autonomousUse : routeUse).nativePath,
              );
              if (branch === "set-route") expect(failure).toContain(routeUse.relatedNativePaths[0]);
              expect(failure).toContain("1 use(s)");
              expect(await state(root)).toEqual(before);
            }
            await mediaFile(root, "se", "RouteSE");
            await compileWorkspace({ workspaceRoot: root, check: false });
            const repaired = await published(root);
            expect(repaired.uses).toEqual([branch === "autonomous" ? autonomousUse : routeUse]);
            const repairedRoute =
              branch === "autonomous"
                ? repaired.page.moveRoute
                : repaired.page.list[0].parameters[1];
            expect(repairedRoute).toEqual(
              representation === "raw"
                ? nativeRoute
                : {
                    list: [routeSe, { code: 0, parameters: [] }],
                    repeat: true,
                    skippable: false,
                    wait: false,
                  },
            );
          } else {
            await mediaFile(root, "se", "RouteSE");
            const before = await state(root);
            await compileWorkspace({ workspaceRoot: root, check: true });
            expect(await state(root)).toEqual(before);
            await compileWorkspace({ workspaceRoot: root, check: false });
            const actual = await published(root);
            expect(actual.uses).toEqual([branch === "autonomous" ? autonomousUse : routeUse]);
            const route =
              branch === "autonomous" ? actual.page.moveRoute : actual.page.list[0].parameters[1];
            expect(route).toEqual(
              representation === "raw"
                ? nativeRoute
                : {
                    list: [routeSe, { code: 0, parameters: [] }],
                    repeat: true,
                    skippable: false,
                    wait: false,
                  },
            );
            if (branch === "set-route")
              expect(actual.page.list[1]).toEqual({ code: 505, indent: 0, parameters: [routeSe] });
          }
        },
      );
    });

for (const vector of vectors)
  it(`AV.C06.none-direct.formal.${vector.family}-base-p${vector.parameter}${vector.movie ? "" : "-name"}.expected: None retains all independent media controls without querying a folder`, async () => {
    await withWindowsSandbox(
      `asset-media-none-${vector.family}`,
      async ({ workspaceRoot: root }) => {
        await prepare(root, source(expression(vector, null)));
        const before = await state(root);
        await compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        const actual = await published(root);
        expect(actual.uses).toEqual([]);
        expect(actual.page.list[0].parameters).toEqual(parameters(vector, ""));
      },
    );
  });

for (const branch of ["autonomous", "set-route"] as const)
  it(`AV.C06.none-direct.formal.A18-${branch}-p0-name.expected: route None keeps volume pitch and pan in both saved containers`, async () => {
    await withWindowsSandbox(`asset-route-se-none-${branch}`, async ({ workspaceRoot: root }) => {
      const command =
        branch === "set-route"
          ? formalRoute.replace(audio("se", "RouteSE"), audio("se", null))
          : "";
      await prepare(
        root,
        source(
          command,
          branch === "autonomous"
            ? `,movement:{type:"custom",route:{commands:[{kind:"playSe",audio:${audio("se", null)}}]}}`
            : "",
        ),
      );
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await published(root);
      expect(actual.uses).toEqual([]);
      const saved = { code: 44, parameters: [{ name: "", volume: 17, pitch: 73, pan: -41 }] };
      expect(
        (branch === "autonomous" ? actual.page.moveRoute : actual.page.list[0].parameters[1]).list,
      ).toEqual([saved, { code: 0, parameters: [] }]);
      if (branch === "set-route") expect(actual.page.list[1].parameters).toEqual([saved]);
    });
  });

it("AV.C06.saved-audio-controls.formal.case.expected: None preserves signed zero and nondefault pitch independently", async () => {
  await withWindowsSandbox("asset-audio-signed-controls", async ({ workspaceRoot: root }) => {
    await prepare(root, source("playSe({audio:{asset:null,volume:-0,pitch:73,pan:-0}})"));
    await compileWorkspace({ workspaceRoot: root, check: false });
    const actual = await published(root);
    expect(actual.uses).toEqual([]);
    expect(actual.page.list[0].parameters[0]).toEqual({ name: "", volume: -0, pitch: 73, pan: -0 });
    expect(Object.is(actual.page.list[0].parameters[0].volume, -0)).toBe(true);
    expect(Object.is(actual.page.list[0].parameters[0].pan, -0)).toBe(true);
  });
});

for (const branch of ["route-mirror", "independent-command"] as const)
  it(`AV.C03.${branch}.formal.se.expected: SE mirrors do not create uses and independent saved commands do`, async () => {
    await withWindowsSandbox(`asset-se-count-${branch}`, async ({ workspaceRoot: root }) => {
      await prepare(
        root,
        source(
          formalRoute +
            (branch === "independent-command" ? `,playSe({audio:${audio("se", "RouteSE")}})` : ""),
        ),
      );
      const path = await mediaFile(root, "se", "RouteSE");
      await compileWorkspace({ workspaceRoot: root, check: false });
      const actual = await published(root);
      const expected = [routeUse];
      if (branch === "independent-command")
        expected.push({
          ...routeUse,
          nativePath: "Map001.json.events[1].pages[0].list[2].parameters[0].name",
          relatedNativePaths: [],
        });
      expect(actual.uses).toEqual(expected);
      await rm(path);
      recordAssetInput({ removedFile: path, timing: "before repeated Check and Compile commands" });
      const before = await state(root);
      for (const check of [true, false, true]) {
        const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
          () => "",
          String,
        );
        expect(failure).toContain(`${expected.length} use(s)`);
        for (const use of expected) expect(failure).toContain(use.nativePath);
        expect(failure).toContain(routeUse.relatedNativePaths[0]);
        expect(await state(root)).toEqual(before);
      }
    });
  });

const namespaces = [
  { family: "F01", code: 241, folder: "bgm", parameter: 0, helper: "playBgm" },
  { family: "F01", code: 245, folder: "bgs", parameter: 0, helper: "playBgs" },
  { family: "F01", code: 249, folder: "me", parameter: 0, helper: "playMe" },
  { family: "F01", code: 250, folder: "se", parameter: 0, helper: "playSe" },
  { family: "F01", code: 261, folder: "movies", parameter: 0, helper: "playMovie", movie: true },
] satisfies MediaVector[];
for (const vector of namespaces)
  it(`AV.F01.${vector.movie ? "movie" : vector.folder}.filesystem.case.expected: exact zero-byte media files pass in their native namespace`, async () => {
    await withWindowsSandbox(
      `asset-media-exact-${vector.folder}`,
      async ({ workspaceRoot: root }) => {
        const name = `Exact-${vector.folder}`;
        await prepare(root, source(expression(vector, name)));
        const path = await mediaFile(root, vector.folder, name);
        await compileWorkspace({ workspaceRoot: root, check: false });
        expect((await published(root)).uses).toEqual([expectedUse(vector, name)]);
        expect(await readFile(path)).toHaveLength(0);
      },
    );
  });

for (const [branch, folder, extension, movie] of [
  ["audio-m4a-only", "se", ".m4a", false],
  ["audio-encrypted-only", "se", ".rpgmvo", false],
  ["movie-mp4-only", "movies", ".mp4", true],
] as const)
  it(`AV.F02.${branch}.filesystem.case.expected: alternative formats do not satisfy the fixed editing extension`, async () => {
    await withWindowsSandbox(`asset-media-format-${branch}`, async ({ workspaceRoot: root }) => {
      const vector: MediaVector = {
        family: "F02",
        code: movie ? 261 : 250,
        folder,
        parameter: 0,
        helper: movie ? "playMovie" : "playSe",
        movie,
      };
      await prepare(root, source(expression(vector, "Alternative")));
      await mediaFile(root, folder, "Alternative", extension);
      const before = await state(root);
      for (const check of [true, false]) {
        const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
          () => "",
          String,
        );
        expect(failure).toContain("MV-ASSET-MISSING-FILE");
        expect(failure).toContain(`required extension: ${movie ? ".webm" : ".ogg"}`);
        expect(await state(root)).toEqual(before);
      }
      await mediaFile(root, folder, "Alternative");
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect((await published(root)).uses).toEqual([expectedUse(vector, "Alternative")]);
    });
  });

for (const [branch, name] of [
  ["audio-percent", "Audio%20Literal"],
  ["audio-hash", "Audio#Literal"],
] as const)
  it(`AV.F06.${branch}.filesystem.case.expected: audio keeps literal encoded-looking characters`, async () => {
    await withWindowsSandbox(`asset-media-name-${branch}`, async ({ workspaceRoot: root }) => {
      const vector: MediaVector = {
        family: "F06",
        code: 250,
        folder: "se",
        parameter: 0,
        helper: "playSe",
      };
      await prepare(root, source(expression(vector, name)));
      await mediaFile(root, "se", name);
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect((await published(root)).uses).toEqual([expectedUse(vector, name)]);
    });
  });
for (const [branch, name] of [
  ["movie-percent", "Movie%20Literal"],
  ["movie-hash", "Movie#Literal"],
] as const)
  it(`AV.F06.${branch}.input.case.expected: unsupported movie names are explicit and never traverse a media target`, async () => {
    await withWindowsSandbox(`asset-media-name-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot,
        vector: MediaVector = {
          family: "F06",
          code: 261,
          folder: "movies",
          parameter: 0,
          helper: "playMovie",
          movie: true,
        };
      await prepare(root, source(expression(vector, name)));
      const before = await state(root);
      const child = startWorkspaceOperation(sandbox, {
        operation: "check",
        mode: "cli",
        boundary: "asset-link-guard",
        assetPath: "movies",
      });
      try {
        expect((await child.ended).exitCode).toBe(1);
        const result = sandbox.processes.at(-1)!;
        recordAssetInput({
          queryGuard: "test process refuses OS traversal of Game/movies",
          result,
        });
        expect(result.stderr).toContain("MV-ASSET-UNSUPPORTED-NAME");
        expect(result.stderr).toContain(JSON.stringify(name));
        expect(result.stderr).not.toContain("; target:");
        expect(child.messages.some((message) => message.kind === "asset-link-follow-attempt")).toBe(
          false,
        );
      } finally {
        await child.stop();
      }
      expect(await state(root)).toEqual(before);
    });
  });

for (const [branch, flag, expected] of [
  ["audio-absent", undefined, undefined],
  ["audio-false", false, undefined],
  ["audio-true", true, "MV-ASSET-UNSUPPORTED-ENCRYPTION"],
  ["audio-null", null, "MV-ASSET-INVALID-DATA"],
  ["audio-number", 1, "MV-ASSET-INVALID-DATA"],
  ["audio-string", "false", "MV-ASSET-INVALID-DATA"],
] as const)
  it(`AV.F13.${branch}.input.case.expected: only the used audio encryption mode is interpreted`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async ({ workspaceRoot: root }) => {
      const vector: MediaVector = {
        family: "F13",
        code: 241,
        folder: "bgm",
        parameter: 0,
        helper: "playBgm",
      };
      await prepare(root, source(expression(vector, "Flag")), {
        "System.json": {
          switches: [""],
          variables: [""],
          hasEncryptedImages: null,
          ...(flag === undefined ? {} : { hasEncryptedAudio: flag }),
        },
      });
      await mediaFile(root, "bgm", "Flag");
      const before = await state(root);
      if (expected)
        for (const check of [true, false]) {
          await expect(compileWorkspace({ workspaceRoot: root, check })).rejects.toThrow(expected);
          expect(await state(root)).toEqual(before);
        }
      else {
        await compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        expect((await published(root)).uses).toEqual([expectedUse(vector, "Flag")]);
      }
    });
  });

for (const branch of ["no-audio-use", "movie-only"] as const)
  it(`AV.F14.${branch}.input.case.expected: unrelated encryption flags do not affect absent audio or movies`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async ({ workspaceRoot: root }) => {
      const vector: MediaVector = {
        family: "F14",
        code: 261,
        folder: "movies",
        parameter: 0,
        helper: "playMovie",
        movie: true,
      };
      await prepare(root, source(branch === "movie-only" ? expression(vector, "MovieOnly") : ""), {
        "System.json": {
          switches: [""],
          variables: [""],
          hasEncryptedImages: null,
          hasEncryptedAudio: "broken",
        },
      });
      if (branch === "movie-only") await mediaFile(root, "movies", "MovieOnly");
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect((await published(root)).uses).toEqual(
        branch === "movie-only" ? [expectedUse(vector, "MovieOnly")] : [],
      );
    });
  });

for (const vector of namespaces)
  it(`AV.A${vector.movie ? "12" : ({ bgm: "08", bgs: "09", me: "10", se: "11" } as Record<string, string>)[vector.folder]}.cli.native.case.expected: actual CLI reports each media namespace and accepts its repaired exact file`, async () => {
    await withWindowsSandbox(`asset-media-cli-${vector.folder}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, source(expression(vector, "CliMedia")));
      await mkdir(join(root, "Game", ...(vector.movie ? [] : ["audio"]), vector.folder), {
        recursive: true,
      });
      const before = await state(root);
      for (const args of [["compile", "--check"], ["compile"]]) {
        const result = await runCli(sandbox, args, { allowFailure: true });
        recordAssetInput({ cliResult: result });
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
        expect(result.stderr).toContain(expectedUse(vector, "CliMedia").nativePath);
        expect(result.stderr).toContain(`${vector.movie ? "movie" : "audio"}/${vector.folder}`);
        expect(await state(root)).toEqual(before);
      }
      await mediaFile(root, vector.folder, "CliMedia");
      const repaired = await state(root);
      const check = await runCli(sandbox, ["compile", "--check"]);
      recordAssetInput({ cliResult: check });
      expect(await state(root)).toEqual(repaired);
      recordAssetInput({ cliResult: await runCli(sandbox, ["compile"]) });
      expect((await published(root)).uses).toEqual([expectedUse(vector, "CliMedia")]);
    });
  });
