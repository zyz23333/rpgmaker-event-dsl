import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectCommonEventCalls } from "../src/validation/asset-common-calls.js";
import { collectEventAssetUses, nativeAssetEvents } from "../src/validation/asset-uses.js";
import { verifyForcedActionGraph } from "./support/asset-action-scenarios.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "10", testSource: import.meta.url });
const diagnosticIt = createAssetTest({ ownerTicket: "10,12", testSource: import.meta.url });
const graphIt = createAssetTest({ ownerTicket: "10,11", testSource: import.meta.url });
const imports =
  'import {commonEvent,mapEvent,troopEvent,callCommonEvent,commonEventRef,showPicture,imageAsset,rawDslCommand,loop} from "rpgmaker-event-dsl";\n';
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"CalledPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
const rawPicture =
  'rawDslCommand({code:231,indent:0,parameters:[1,"CalledPoster",0,0,0,0,100,100,255,0]})';
const call = (id: number) => `callCommonEvent({commonEvent:commonEventRef({id:${id}})})`;
const rawCall = (id: number) => `rawDslCommand({code:117,indent:0,parameters:[${id}]})`;
const common = (id: number, commands: string) =>
  `export const event${id}=commonEvent({id:${id},name:"Event ${id}",trigger:"none",commands:[${commands}]});\n`;

async function prepare(root: string, source: string, project: Record<string, unknown> = {}) {
  recordAssetInput({
    workspaceRoot: root,
    source,
    project,
    target: "Game/img/pictures/CalledPoster.png",
  });
  await createMinimalProject(root);
  for (const [file, data] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src/calls.events.ts"), imports + source);
  await mkdir(join(root, "Game/img/pictures"), { recursive: true });
}

async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.name === "operation.lock") continue;
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = bytes;
    } else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  }
  return result;
}

async function state(root: string) {
  return {
    source: await tree(join(root, "src")),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    project: await tree(join(root, "Game")),
    workspace: await tree(join(root, ".rpgmaker-event-dsl")),
  };
}

async function published(root: string) {
  const directory = getWorkspaceStatePaths(root).generatedProjectDataDirectory;
  const files = new Map<string, string>();
  for (const file of await readdir(directory))
    files.set(file, await readFile(join(directory, file), "utf8"));
  return files;
}

const expectedCalledUse = {
  category: "image",
  folder: "pictures",
  name: "CalledPoster",
  identity: "commonEvent:11",
  nativePath: "CommonEvents.json[11].list[0].parameters[1]",
  relatedNativePaths: [],
  dependencyChain: [],
  conditions: [],
};
const expectedCall = {
  caller: "commonEvent:10",
  nativePath: "CommonEvents.json[10].list[0].parameters[0]",
  target: "commonEvent:11",
  targetId: 11,
  dependencyChain: [],
};
const mapProject = {
  "MapInfos.json": [null, { id: 1, name: "Calling map" }],
  "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
  "Tilesets.json": [null, { id: 1, name: "Calling tiles" }],
};
const troopProject = {
  "Troops.json": [null, { id: 1, name: "Calling troop", members: [], pages: [] }],
};

for (const [representation, outcome] of [
  ["formal", "present"],
  ["raw", "present"],
  ["raw", "missing"],
] as const)
  it(`AV.B15.call-common.${representation}.called-picture.${outcome}: current definitions and direct calls retain independent literal origins`, async () => {
    await withWindowsSandbox(`asset-common-${representation}-${outcome}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(
        root,
        common(10, representation === "formal" ? call(11) : rawCall(11)) +
          common(11, representation === "formal" ? picture : rawPicture),
      );
      if (outcome === "present")
        await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
      const before = await state(root);
      if (outcome === "missing") {
        for (const check of [true, false]) {
          const failure = await api
            .compileWorkspace({ workspaceRoot: root, check })
            .then(() => "", String);
          expect(failure).toContain("MV-ASSET-MISSING-FILE");
          expect(failure).toContain("commonEvent:11 CommonEvents.json[11].list[0].parameters[1]");
          expect(failure).toContain("1 use(s)");
          expect(failure).toContain(
            "commonEvent:10 CommonEvents.json[10].list[0].parameters[0] -> commonEvent:11",
          );
          expect(await state(root)).toEqual(before);
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(1);
        expect(cli.stderr).toContain("-> commonEvent:11");
        expect(await state(root)).toEqual(before);
      } else {
        await api.compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toEqual(before);
        await runCli(sandbox, ["compile", "--check"]);
        expect(await state(root)).toEqual(before);
        await api.compileWorkspace({ workspaceRoot: root, check: false });
        const files = await published(root);
        expect(collectEventAssetUses(files)).toEqual([expectedCalledUse]);
        expect(collectCommonEventCalls(files)).toEqual([expectedCall]);
        expect((await state(root)).project).toEqual(before.project);
        expect((await state(root)).source).toEqual(before.source);
      }
    });
  });

it("AV.B15.call-common.formal.called-picture.missing: reports the defining use and its direct caller through actual CLI", async () => {
  await withWindowsSandbox("asset-common-formal-missing", async (sandbox) => {
    await prepare(sandbox.workspaceRoot, common(10, call(11)) + common(11, picture));
    const before = await state(sandbox.workspaceRoot);
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
    expect(result.stderr).toContain("commonEvent:11 CommonEvents.json[11].list[0].parameters[1]");
    expect(result.stderr).toContain("1 use(s)");
    expect(result.stderr).toContain(
      "commonEvent:10 CommonEvents.json[10].list[0].parameters[0] -> commonEvent:11",
    );
    expect(await state(sandbox.workspaceRoot)).toEqual(before);
  });
});

const graphs = [
  {
    branch: "self-cycle",
    source: common(10, `${call(10)},${picture}`),
    identities: ["commonEvent:10"],
    useIdentity: "commonEvent:10",
    usePath: "CommonEvents.json[10].list[1].parameters[1]",
    edges: [
      ["commonEvent:10", "CommonEvents.json[10].list[0].parameters[0]", "commonEvent:10", 10],
    ],
  },
  {
    branch: "mutual-cycle",
    source: common(10, call(11)) + common(11, `${call(10)},${picture}`),
    identities: ["commonEvent:10", "commonEvent:11"],
    useIdentity: "commonEvent:11",
    usePath: "CommonEvents.json[11].list[1].parameters[1]",
    edges: [
      ["commonEvent:10", "CommonEvents.json[10].list[0].parameters[0]", "commonEvent:11", 11],
      ["commonEvent:11", "CommonEvents.json[11].list[0].parameters[0]", "commonEvent:10", 10],
    ],
  },
  {
    branch: "long-acyclic",
    source:
      [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
        .map((id) => common(id, call(id + 1)))
        .join("") + common(22, picture),
    identities: [
      "commonEvent:10",
      "commonEvent:11",
      "commonEvent:12",
      "commonEvent:13",
      "commonEvent:14",
      "commonEvent:15",
      "commonEvent:16",
      "commonEvent:17",
      "commonEvent:18",
      "commonEvent:19",
      "commonEvent:20",
      "commonEvent:21",
      "commonEvent:22",
    ],
    useIdentity: "commonEvent:22",
    usePath: "CommonEvents.json[22].list[0].parameters[1]",
    edges: [
      ["commonEvent:10", "CommonEvents.json[10].list[0].parameters[0]", "commonEvent:11", 11],
      ["commonEvent:11", "CommonEvents.json[11].list[0].parameters[0]", "commonEvent:12", 12],
      ["commonEvent:12", "CommonEvents.json[12].list[0].parameters[0]", "commonEvent:13", 13],
      ["commonEvent:13", "CommonEvents.json[13].list[0].parameters[0]", "commonEvent:14", 14],
      ["commonEvent:14", "CommonEvents.json[14].list[0].parameters[0]", "commonEvent:15", 15],
      ["commonEvent:15", "CommonEvents.json[15].list[0].parameters[0]", "commonEvent:16", 16],
      ["commonEvent:16", "CommonEvents.json[16].list[0].parameters[0]", "commonEvent:17", 17],
      ["commonEvent:17", "CommonEvents.json[17].list[0].parameters[0]", "commonEvent:18", 18],
      ["commonEvent:18", "CommonEvents.json[18].list[0].parameters[0]", "commonEvent:19", 19],
      ["commonEvent:19", "CommonEvents.json[19].list[0].parameters[0]", "commonEvent:20", 20],
      ["commonEvent:20", "CommonEvents.json[20].list[0].parameters[0]", "commonEvent:21", 21],
      ["commonEvent:21", "CommonEvents.json[21].list[0].parameters[0]", "commonEvent:22", 22],
    ],
  },
  {
    branch: "shared-dag",
    source:
      common(10, `${call(11)},${call(12)}`) +
      common(11, `${call(13)},${call(14)}`) +
      common(12, `${call(13)},${call(14)}`) +
      common(13, call(15)) +
      common(14, call(15)) +
      common(15, picture),
    identities: [
      "commonEvent:10",
      "commonEvent:11",
      "commonEvent:12",
      "commonEvent:13",
      "commonEvent:14",
      "commonEvent:15",
    ],
    useIdentity: "commonEvent:15",
    usePath: "CommonEvents.json[15].list[0].parameters[1]",
    edges: [
      ["commonEvent:10", "CommonEvents.json[10].list[0].parameters[0]", "commonEvent:11", 11],
      ["commonEvent:10", "CommonEvents.json[10].list[1].parameters[0]", "commonEvent:12", 12],
      ["commonEvent:11", "CommonEvents.json[11].list[0].parameters[0]", "commonEvent:13", 13],
      ["commonEvent:11", "CommonEvents.json[11].list[1].parameters[0]", "commonEvent:14", 14],
      ["commonEvent:12", "CommonEvents.json[12].list[0].parameters[0]", "commonEvent:13", 13],
      ["commonEvent:12", "CommonEvents.json[12].list[1].parameters[0]", "commonEvent:14", 14],
      ["commonEvent:13", "CommonEvents.json[13].list[0].parameters[0]", "commonEvent:15", 15],
      ["commonEvent:14", "CommonEvents.json[14].list[0].parameters[0]", "commonEvent:15", 15],
    ],
  },
] as const;

for (const graph of graphs)
  graphIt(
    `AV.C05.${graph.branch}.formal.case.expected: retains every finite direct edge without multiplying defining asset uses`,
    async () => {
      await withWindowsSandbox(`asset-common-${graph.branch}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        recordAssetInput({
          graph,
          expectedUseCount: 1,
          recursion: "none; definitions independent",
        });
        await prepare(root, graph.source);
        await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
        const before = await state(root);
        await api.compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toEqual(before);
        await api.compileWorkspace({ workspaceRoot: root, check: false });
        const files = await published(root);
        expect(nativeAssetEvents(files).map(({ identity }) => identity)).toEqual(graph.identities);
        expect(collectCommonEventCalls(files)).toEqual(
          graph.edges.map(([caller, nativePath, target, targetId]) => ({
            caller,
            nativePath,
            target,
            targetId,
            dependencyChain: [],
          })),
        );
        expect(collectEventAssetUses(files)).toEqual([
          { ...expectedCalledUse, identity: graph.useIdentity, nativePath: graph.usePath },
        ]);
        await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "same name new bytes");
        await runCli(sandbox, ["compile", "--check"]);
        const source = join(root, "src/calls.events.ts");
        expect(await readFile(source, "utf8")).toBe(imports + graph.source);
        expect((await state(root)).project!["img/pictures/CalledPoster.png"]).toBe(
          Buffer.from("same name new bytes").toString("base64"),
        );
      });
      await verifyForcedActionGraph(graph.branch);
    },
  );

for (const branch of ["two-callers", "common-independent-root"] as const)
  it(`AV.C04.${branch}.formal.case.expected: keeps all caller positions and each actual defining picture once`, async () => {
    await withWindowsSandbox(`asset-common-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const source =
        common(10, `${call(11)},${call(11)}`) +
        common(11, picture) +
        (branch === "common-independent-root" ? common(12, picture) : "") +
        `export const map=mapEvent({mapId:1,id:1,name:"Map caller",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[loop({body:{commands:[${call(11)}]}})]}]});` +
        `export const troop=troopEvent({troopId:1,pages:[{commands:[${call(11)}]}]});`;
      await prepare(root, source, { ...mapProject, ...troopProject });
      await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const files = await published(root);
      expect(collectCommonEventCalls(files)).toEqual([
        expectedCall,
        { ...expectedCall, nativePath: "CommonEvents.json[10].list[1].parameters[0]" },
        {
          caller: "map:1/event:1",
          nativePath: "Map001.json.events[1].pages[0].list[1].parameters[0]",
          target: "commonEvent:11",
          targetId: 11,
          dependencyChain: [],
        },
        {
          caller: "troop:1",
          nativePath: "Troops.json[1].pages[0].list[0].parameters[0]",
          target: "commonEvent:11",
          targetId: 11,
          dependencyChain: [],
        },
      ]);
      expect(collectEventAssetUses(files)).toEqual(
        branch === "two-callers"
          ? [expectedCalledUse]
          : [
              expectedCalledUse,
              {
                ...expectedCalledUse,
                identity: "commonEvent:12",
                nativePath: "CommonEvents.json[12].list[0].parameters[1]",
              },
            ],
      );
      const before = await state(root);
      await runCli(sandbox, ["compile", "--check"]);
      expect(await state(root)).toEqual(before);
    });
  });

it("AV.C06.none-indirect.formal.B15-call-common-called-picture.expected: legal None keeps the direct call and saved numeric values without querying an asset", async () => {
  await withWindowsSandbox("asset-common-none", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(
      root,
      common(10, call(11)) +
        common(
          11,
          'showPicture({pictureId:1,image:null,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:-73,scaleY:117,opacity:41,blendMode:"normal"})',
        ),
      { "System.json": { switches: [""], variables: [""], hasEncryptedImages: "unrelated" } },
    );
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const files = await published(root);
    expect(collectEventAssetUses(files)).toEqual([]);
    expect(collectCommonEventCalls(files)).toEqual([expectedCall]);
    expect(JSON.parse(files.get("CommonEvents.json")!)[11].list[0].parameters).toEqual([
      1,
      "",
      0,
      0,
      0,
      0,
      -73,
      117,
      41,
      0,
    ]);
    const before = await state(root);
    await runCli(sandbox, ["compile", "--check"]);
    expect(await state(root)).toEqual(before);
  });
});

const nonePicture =
  'showPicture({pictureId:1,image:null,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
const badPicture = (image: string) =>
  `showPicture({pictureId:1,image:${image} as never,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})`;

for (const [branch, command, failureCode] of [
  [
    "field-missing",
    badPicture('{kind:"asset",category:"image",folder:"pictures"}'),
    "MV-E231-INPUT",
  ],
  [
    "field-wrong-type",
    badPicture('{kind:"asset",category:"image",folder:"pictures",name:7}'),
    "MV-E231-INPUT",
  ],
  ["field-empty", nonePicture, undefined],
  ["file-missing", picture, "MV-ASSET-MISSING-FILE"],
] as const)
  it(`AV.C07.${branch}.formal.B15-call-common-called-picture.expected: distinguishes necessary saved fields, legal absence and a missing file`, async () => {
    await withWindowsSandbox(`asset-common-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, common(10, call(11)) + common(11, command));
      const before = await state(root);
      if (failureCode === undefined) {
        await api.compileWorkspace({ workspaceRoot: root, check: false });
        const files = await published(root);
        expect(collectEventAssetUses(files)).toEqual([]);
        expect(collectCommonEventCalls(files)).toEqual([expectedCall]);
      } else {
        for (const check of [true, false]) {
          const failure = await api
            .compileWorkspace({ workspaceRoot: root, check })
            .then(() => "", String);
          expect(failure).toContain(failureCode);
          if (failureCode !== "MV-ASSET-MISSING-FILE")
            expect(failure).not.toContain("MV-ASSET-MISSING");
          else expect(failure).toContain("-> commonEvent:11");
          expect(await state(root)).toEqual(before);
        }
        const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
        expect(cli.exitCode).toBe(1);
        expect(cli.stderr).toContain(failureCode);
        expect(await state(root)).toEqual(before);
      }
    });
  });

it("AV.C07.target-missing.formal.B15-call-common-called-picture.expected: a Snapshot-only Common Event cannot satisfy a current call or masquerade as a missing file", async () => {
  await withWindowsSandbox("asset-common-target-missing", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const snapshotCommon = Array.from({ length: 13 }, () => null as unknown);
    snapshotCommon[12] = {
      id: 12,
      name: "Snapshot only",
      trigger: 0,
      switchId: 1,
      list: [
        { code: 231, indent: 0, parameters: [1, "OldPoster", 0, 0, 0, 0, 100, 100, 255, 0] },
        { code: 0, indent: 0, parameters: [] },
      ],
    };
    await prepare(root, common(10, call(12)), { "CommonEvents.json": snapshotCommon });
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await api
        .compileWorkspace({ workspaceRoot: root, check })
        .then(() => "", String);
      expect(failure).toContain("MV-E117-REFERENCE");
      expect(failure).not.toContain("MV-ASSET-MISSING");
      expect(await state(root)).toEqual(before);
    }
    const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("MV-E117-REFERENCE");
    expect(await state(root)).toEqual(before);
  });
});

for (const branch of ["removed-common-call", "replaced-common-call"] as const)
  it(`AV.C02.${branch}.formal.case.expected: obsolete Snapshot definitions and caller positions cannot reenter the current graph`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const oldCommon = Array.from({ length: 13 }, () => null as unknown);
      oldCommon[10] = {
        id: 10,
        name: "Old caller",
        trigger: 0,
        switchId: 1,
        list: [
          { code: 117, indent: 0, parameters: [12] },
          { code: 0, indent: 0, parameters: [] },
        ],
      };
      for (const id of [11, 12])
        oldCommon[id] = {
          id,
          name: "Obsolete picture",
          trigger: 0,
          switchId: 1,
          list: [
            { code: 231, indent: 0, parameters: [1, "OldPoster", 0, 0, 0, 0, 100, 100, 255, 0] },
            { code: 0, indent: 0, parameters: [] },
          ],
        };
      await prepare(
        root,
        branch === "removed-common-call"
          ? common(10, "")
          : common(10, call(11)) + common(11, picture),
        { "CommonEvents.json": oldCommon },
      );
      if (branch === "replaced-common-call")
        await writeFile(join(root, "Game/img/pictures/CalledPoster.png"), "");
      const before = await state(root);
      await api.compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toEqual(before);
      await api.compileWorkspace({ workspaceRoot: root, check: false });
      const files = await published(root);
      expect(collectCommonEventCalls(files)).toEqual(
        branch === "removed-common-call" ? [] : [expectedCall],
      );
      expect(collectEventAssetUses(files)).toEqual(
        branch === "removed-common-call" ? [] : [expectedCalledUse],
      );
      expect(JSON.parse(files.get("CommonEvents.json")!)[12]).toBeNull();
      expect((await state(root)).project).toEqual(before.project);
      await runCli(sandbox, ["compile", "--check"]);
    });
  });

for (const branch of ["common-definition", "shared-callers", "unknown-source"] as const)
  diagnosticIt(
    `AV.D09.${branch}.native.case.expected: CLI exposes defining asset fields and finite direct callers without fabricated source coordinates`,
    async () => {
      await withWindowsSandbox(`asset-call-location-${branch}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        await prepare(
          root,
          common(10, branch === "shared-callers" ? `${call(11)},${call(11)}` : call(11)) +
            common(11, picture),
        );
        const before = await state(root);
        const result = await runCli(sandbox, ["compile"], { allowFailure: true });
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("compile asset check failed");
        expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
        expect(result.stderr).toContain('image/pictures "CalledPoster"; 1 use(s)');
        expect(result.stderr).toContain(
          "commonEvent:11 CommonEvents.json[11].list[0].parameters[1]",
        );
        expect(result.stderr).toContain(
          "commonEvent:10 CommonEvents.json[10].list[0].parameters[0] -> commonEvent:11",
        );
        expect(result.stderr).toContain("Project Root:");
        expect(result.stderr).toContain("required extension: .png");
        if (branch === "shared-callers")
          expect(result.stderr).toContain(
            "commonEvent:10 CommonEvents.json[10].list[1].parameters[0] -> commonEvent:11",
          );
        expect(result.stderr).not.toMatch(/calls\.events\.ts:\d+:\d+/u);
        expect(result.stderr).not.toContain("MV-ASSET-DYNAMIC-STOP");
        expect(result.stderr).toContain("1 problem group(s), 1 problem file(s), 1 affected use(s)");
        expect(result.stderr).toContain("DSL: commands[0]");
        expect(result.stderr).toContain("calls.events.ts (line");
        const apiFailure = await api
          .compileWorkspace({ workspaceRoot: root, check: true })
          .then(() => "", String);
        expect(apiFailure).toContain("1 affected use(s)");
        expect(apiFailure).toContain("commonEvent:11 CommonEvents.json[11].list[0].parameters[1]");
        expect(await state(root)).toEqual(before);
        recordAssetInput({
          currentCanonicalRepresentation: "native",
          migratedFromHistoricalFormalId: true,
          actualCli: result,
          actualApiFailure: apiFailure,
        });
        if (branch === "unknown-source") {
          const rawSource = imports + common(10, rawCall(11)) + common(11, rawPicture);
          await writeFile(join(root, "src/calls.events.ts"), rawSource);
          const rawBefore = await state(root);
          const rawResult = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
          expect(rawResult.exitCode).toBe(1);
          expect(rawResult.stderr).toContain("CommonEvents.json[11].list[0].parameters[1]");
          expect(rawResult.stderr).toContain("DSL: commands[0]");
          expect(rawResult.stderr).not.toContain("; source:");
          expect(rawResult.stderr).toContain("1 affected use(s)");
          expect(await state(root)).toEqual(rawBefore);
          recordAssetInput({
            rawSource,
            actualRawCli: rawResult,
            sourceFallback:
              "Native and authored command paths retained; raw payload coordinates deliberately not guessed.",
          });
        }
      });
    },
  );
