import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { collectEventAssetUses } from "../src/validation/asset-uses.js";
import { blankEvent } from "./support/map-event-fixtures.js";
const {
  initWorkspace,
  cloneWorkspace,
  compileWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const picture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"Poster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
const rawPicture =
  'rawDslCommand({code:231,indent:0,parameters:[1,"Poster",0,0,0,0,100,100,255,0]})';
const imports =
  'import { mapEvent,commonEvent,troopEvent,showPicture,imageAsset,rawDslCommand,loop,showChoices,conditional,script,pluginCommand } from "rpgmaker-event-dsl";\n';
const commonSource = (command: string) =>
  `${imports}export const event=commonEvent({id:10,name:"Uncalled",trigger:"none",commands:[${command}]});\n`;
const mapProject = {
  "MapInfos.json": [null, { id: 1, name: "Asset map" }],
  "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
  "Tilesets.json": [null, { id: 1, name: "Asset tiles" }],
};
const emptyBattlePage = {
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
  list: [{ code: 0, indent: 0, parameters: [] }],
};
const troopProject = {
  "Troops.json": [null, { id: 1, name: "Asset troop", members: [], pages: [emptyBattlePage] }],
};
async function prepare(
  root: string,
  options: {
    source?: string;
    project?: Record<string, unknown>;
  } = {},
) {
  await createMinimalProject(root);
  for (const [file, data] of Object.entries(options.project ?? {}))
    await writeFile(join(root, "Game/data", file), JSON.stringify(data));
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src/assets.events.ts"), options.source ?? commonSource(picture));
}
async function materialize(root: string) {
  await mkdir(join(root, "Game/img/pictures"), { recursive: true });
  await writeFile(join(root, "Game/img/pictures/Poster.png"), "");
}
async function publishedUses(root: string) {
  const path = getWorkspaceStatePaths(root).generatedProjectDataDirectory;
  const files = new Map<string, string>();
  for (const file of await readdir(path)) files.set(file, await readFile(join(path, file), "utf8"));
  return collectEventAssetUses(files);
}
async function tree(path: string): Promise<Record<string, string> | null> {
  const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (entries === null) return null;
  const result: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const [name, bytes] of Object.entries((await tree(join(path, entry.name)))!))
        result[`${entry.name}/${name}`] = bytes;
    } else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
  }
  return result;
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    source: await tree(join(root, "src")),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    project: await tree(join(root, "Game")),
    snapshot: await tree(paths.projectDataSnapshotDirectory),
    generated: await tree(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
  };
}
it("missing picture blocks Compile and Check before publication", async () => {
  await withWindowsSandbox("asset-picture-missing", async ({ workspaceRoot: root }) => {
    await prepare(root);
    const paths = getWorkspaceStatePaths(root);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    const before = await state(root);
    for (const check of [true, false]) {
      await expect(compileWorkspace({ workspaceRoot: root, check })).rejects.toThrow(
        "MV-ASSET-MISSING-FILE",
      );
      expect(await state(root)).toEqual(before);
      expect(await readdir(paths.generatedProjectDataDirectory).catch(() => [])).toEqual([]);
    }
  });
});
for (const [representation, command] of [
  ["formal", picture],
  ["raw", rawPicture],
] as const)
  for (const outcome of ["present", "missing"] as const)
    it(`checks the exact native picture field and preserves all origins (${representation}, ${outcome})`, async () => {
      await withWindowsSandbox(
        `asset-picture-${representation}-${outcome}`,
        async ({ workspaceRoot: root }) => {
          const source = `${imports}export const event=mapEvent({mapId:1,id:1,name:"Asset map",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${command}]}]});\n`;
          await prepare(root, {
            source,
            project: {
              "MapInfos.json": [null, { id: 1, name: "Asset map" }],
              "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
              "Tilesets.json": [null, { id: 1, name: "Asset tiles" }],
            },
          });
          await mkdir(join(root, "Game/img/pictures"), { recursive: true });
          if (outcome === "present") await materialize(root);
          const before = await state(root);
          if (outcome === "missing") {
            for (const check of [true, false]) {
              const failure = await compileWorkspace({ workspaceRoot: root, check }).then(
                () => "",
                String,
              );
              expect(failure).toContain("MV-ASSET-MISSING-FILE");
              expect(failure).toContain("map:1/event:1");
              expect(failure).toContain("Map001.json.events[1].pages[0].list[0].parameters[1]");
              expect(await state(root)).toEqual(before);
            }
          } else {
            await compileWorkspace({ workspaceRoot: root, check: true });
            expect(await state(root)).toEqual(before);
            await compileWorkspace({ workspaceRoot: root, check: false });
            expect(await publishedUses(root)).toEqual([
              {
                category: "image",
                folder: "pictures",
                name: "Poster",
                identity: "map:1/event:1",
                nativePath: "Map001.json.events[1].pages[0].list[0].parameters[1]",
                relatedNativePaths: [],
                dependencyChain: [],
                conditions: [],
              },
            ]);
          }
        },
      );
    });
it("reports the missing category at its actual path", async () => {
  await withWindowsSandbox("asset-missing-category", async ({ workspaceRoot: root }) => {
    await prepare(root);
    await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
      "MV-ASSET-MISSING-DIRECTORY",
    );
  });
});
for (const [branch, kind] of [
  ["directory-is-file", "directory"],
  ["file-is-directory", "file"],
] as const)
  it(`wrong path types block publication (${branch})`, async () => {
    await withWindowsSandbox(`asset-type-${kind}`, async ({ workspaceRoot: root }) => {
      await prepare(root);
      if (kind === "directory") {
        await mkdir(join(root, "Game/img"));
        await writeFile(join(root, "Game/img/pictures"), "");
      } else {
        await mkdir(join(root, "Game/img/pictures/Poster.png"), { recursive: true });
      }
      await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
        "MV-ASSET-PATH-TYPE",
      );
    });
  });
for (const [branch, flag, expected] of [
  ["images-absent", undefined, undefined],
  ["images-false", false, undefined],
  ["images-true", true, "MV-ASSET-UNSUPPORTED-ENCRYPTION"],
  ["images-null", null, "MV-ASSET-INVALID-DATA"],
  ["images-number", 1, "MV-ASSET-INVALID-DATA"],
  ["images-string", "false", "MV-ASSET-INVALID-DATA"],
] as const)
  it(`checks only the used image mode (${branch})`, async () => {
    await withWindowsSandbox(`asset-${branch}`, async ({ workspaceRoot: root }) => {
      await prepare(root, {
        project: {
          "System.json": {
            switches: [""],
            variables: [""],
            ...(flag === undefined ? {} : { hasEncryptedImages: flag }),
          },
        },
      });
      await materialize(root);
      if (expected)
        await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
          expected,
        );
      else await compileWorkspace({ workspaceRoot: root, check: true });
    });
  });
it("unrelated encryption fields remain uninterpreted", async () => {
  await withWindowsSandbox("asset-unused-encryption", async ({ workspaceRoot: root }) => {
    await prepare(root, {
      source: commonSource(""),
      project: { "System.json": { switches: [""], variables: [""], hasEncryptedImages: null } },
    });
    await compileWorkspace({ workspaceRoot: root, check: true });
  });
});
it("None needs no file and retains independent saved values", async () => {
  await withWindowsSandbox("asset-none", async ({ workspaceRoot: root }) => {
    await prepare(root, {
      source: commonSource(
        picture
          .replace('imageAsset({folder:"pictures",name:"Poster"})', "null")
          .replace("scaleX:100", "scaleX:-7"),
      ),
    });
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await publishedUses(root)).toEqual([]);
    const common = JSON.parse(
      await readFile(
        join(getWorkspaceStatePaths(root).generatedProjectDataDirectory, "CommonEvents.json"),
        "utf8",
      ),
    );
    expect(common[10].list[0].parameters).toEqual([1, "", 0, 0, 0, 0, -7, 100, 255, 0]);
  });
});
it("an exact empty PNG is enough for the metadata existence gate", async () => {
  await withWindowsSandbox("asset-empty-png", async ({ workspaceRoot: root }) => {
    await prepare(root);
    await materialize(root);
    const before = await state(root);
    await compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    expect(await readFile(join(root, "Game/img/pictures/Poster.png"))).toHaveLength(0);
  });
});
it("raw picture and route SE records cannot bypass the file policy", async () => {
  await withWindowsSandbox("asset-recognized-raw", async ({ workspaceRoot: root }) => {
    await prepare(root, { source: commonSource(rawPicture) });
    const before = await state(root);
    await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
      "MV-ASSET-MISSING-DIRECTORY",
    );
    expect(await state(root)).toEqual(before);
  });
  await withWindowsSandbox("asset-recognized-route-se", async ({ workspaceRoot: root }) => {
    const record = {
      code: 44,
      parameters: [{ name: "RawRouteSE", volume: 17, pitch: 73, pan: -41 }],
    };
    const route = { list: [record, { code: 0 }], repeat: false, skippable: false, wait: false };
    const command = [
      { code: 205, parameters: [-1, route] },
      { code: 505, parameters: [record] },
    ]
      .map((value) => `rawDslCommand(${JSON.stringify(value)})`)
      .join(",");
    await prepare(root, { source: commonSource(command) });
    await mkdir(join(root, "Game/audio/se"), { recursive: true });
    const before = await state(root);
    for (const check of [true, false]) {
      const failure = await compileWorkspace({ workspaceRoot: root, check }).then(() => "", String);
      expect(failure).toContain("MV-ASSET-MISSING-FILE");
      expect(failure).toContain(
        "CommonEvents.json[10].list[0].parameters[1].list[0].parameters[0].name",
      );
      expect(failure).toContain("CommonEvents.json[10].list[1].parameters[0].parameters[0].name");
      expect(failure).toContain("1 use(s)");
      expect(await state(root)).toEqual(before);
    }
    await writeFile(join(root, "Game/audio/se/RawRouteSE.ogg"), "");
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await publishedUses(root)).toEqual([
      {
        category: "audio",
        folder: "se",
        name: "RawRouteSE",
        identity: "commonEvent:10",
        nativePath: "CommonEvents.json[10].list[0].parameters[1].list[0].parameters[0].name",
        relatedNativePaths: ["CommonEvents.json[10].list[1].parameters[0].parameters[0].name"],
        dependencyChain: [],
        conditions: [],
      },
    ]);
  });
});
it("actual CLI exposes error origins and accepts a repaired exact file", async () => {
  await withWindowsSandbox("asset-cli", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    for (const args of [["compile", "--check"], ["compile"]]) {
      const result = await runCli(sandbox, args, { allowFailure: true });
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("MV-ASSET-MISSING-FILE");
      expect(result.stderr).toContain("commonEvent:10");
      expect(result.stderr).toContain("CommonEvents.json[10].list[0].parameters[1]");
    }
    await materialize(root);
    expect((await runCli(sandbox, ["compile", "--check"])).exitCode).toBe(0);
    expect((await runCli(sandbox, ["compile"])).exitCode).toBe(0);
  });
});
for (const [branch, source, project, positions] of [
  [
    "map-pages",
    `${imports}export const event=mapEvent({mapId:1,id:1,name:"Two pages",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[${picture}]},{conditions:{},trigger:"action",commands:[${picture}]}]});`,
    mapProject,
    [
      "Map001.json.events[1].pages[0].list[0].parameters[1]",
      "Map001.json.events[1].pages[1].list[0].parameters[1]",
    ],
  ],
  ["common-uncalled", commonSource(picture), {}, ["CommonEvents.json[10].list[0].parameters[1]"]],
  [
    "troop-pages",
    `${imports}export const event=troopEvent({troopId:1,pages:[{commands:[${picture}]},{commands:[${picture}]}]});`,
    troopProject,
    [
      "Troops.json[1].pages[0].list[0].parameters[1]",
      "Troops.json[1].pages[1].list[0].parameters[1]",
    ],
  ],
  [
    "nested-choice",
    commonSource(`showChoices({choices:[{text:"A",commands:[${picture}]}]})`),
    {},
    ["CommonEvents.json[10].list[2].parameters[1]"],
  ],
  [
    "nested-loop",
    commonSource(`loop({body:{commands:[${picture}]}})`),
    {},
    ["CommonEvents.json[10].list[1].parameters[1]"],
  ],
] as const)
  it(`every saved occurrence remains an independent root-local use (${branch})`, async () => {
    await withWindowsSandbox(`asset-root-${branch}`, async ({ workspaceRoot: root }) => {
      await prepare(root, { source, project });
      await mkdir(join(root, "Game/img/pictures"), { recursive: true });
      const failure = await compileWorkspace({ workspaceRoot: root, check: true }).then(
        () => "",
        String,
      );
      expect(failure).toContain("MV-ASSET-MISSING-FILE");
      expect(failure).toContain(`${positions.length} use(s)`);
      for (const position of positions) expect(failure).toContain(position);
      await materialize(root);
      await compileWorkspace({ workspaceRoot: root, check: false });
      const identity =
        branch === "map-pages"
          ? "map:1/event:1"
          : branch === "troop-pages"
            ? "troop:1"
            : "commonEvent:10";
      expect(await publishedUses(root)).toEqual(
        positions.map((nativePath) => ({
          category: "image",
          folder: "pictures",
          name: "Poster",
          identity,
          nativePath,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        })),
      );
    });
  });
it("old snapshot events cannot restore removed asset roots", async () => {
  await withWindowsSandbox("asset-removed-common", async ({ workspaceRoot: root }) => {
    await prepare(root, {
      source: commonSource(""),
      project: {
        "CommonEvents.json": [
          null,
          {
            id: 1,
            name: "Removed",
            trigger: 0,
            switchId: 1,
            list: [
              {
                code: 231,
                indent: 0,
                parameters: [1, "Missing old image", 0, 0, 0, 0, 100, 100, 255, 0],
              },
              { code: 0, indent: 0, parameters: [] },
            ],
          },
        ],
      },
    });
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await publishedUses(root)).toEqual([]);
  });
});
it("generated blank Troop Reset has no uses from old pages", async () => {
  await withWindowsSandbox("asset-reset-troop", async ({ workspaceRoot: root }) => {
    const oldPage = {
      ...emptyBattlePage,
      list: [
        { code: 231, indent: 0, parameters: [1, "Old troop image", 0, 0, 0, 0, 100, 100, 255, 0] },
        { code: 0, indent: 0, parameters: [] },
      ],
    };
    await prepare(root, {
      source: commonSource(""),
      project: { "Troops.json": [null, { id: 1, name: "Reset", members: [], pages: [oldPage] }] },
    });
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await publishedUses(root)).toEqual([]);
    const troops = JSON.parse(
      await readFile(
        join(getWorkspaceStatePaths(root).generatedProjectDataDirectory, "Troops.json"),
        "utf8",
      ),
    );
    expect(troops[1].pages).toEqual([emptyBattlePage]);
  });
});
it("old map pages cannot restore removed asset roots", async () => {
  await withWindowsSandbox("asset-removed-map", async ({ workspaceRoot: root }) => {
    const oldEvent = structuredClone(blankEvent);
    oldEvent.pages[0]!.list = [
      {
        code: 231,
        indent: 0,
        parameters: [1, "Old map image", 0, 0, 0, 0, 100, 100, 255, 0] as never[],
      },
      { code: 0, indent: 0, parameters: [] },
    ];
    await prepare(root, {
      source: commonSource(""),
      project: {
        ...mapProject,
        "Map001.json": { ...mapProject["Map001.json"], events: [null, oldEvent] },
      },
    });
    await compileWorkspace({ workspaceRoot: root, check: false });
    expect(await publishedUses(root)).toEqual([]);
    const map = JSON.parse(
      await readFile(
        join(getWorkspaceStatePaths(root).generatedProjectDataDirectory, "Map001.json"),
        "utf8",
      ),
    );
    expect(map.events).toEqual([null, null]);
  });
});
it("saved page activation never downgrades ordinary picture errors", async () => {
  await withWindowsSandbox("asset-false-condition", async ({ workspaceRoot: root }) => {
    await prepare(root, {
      source: `${imports}export const event=mapEvent({mapId:1,id:1,name:"Disabled",x:0,y:0,pages:[{conditions:{selfSwitch:{enabled:true,value:"A"}},trigger:"action",commands:[${picture}]}]});`,
      project: mapProject,
    });
    await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
      "MV-ASSET-MISSING-DIRECTORY",
    );
  });
});
it("literal false branch still checks saved picture", async () => {
  await withWindowsSandbox("asset-unreached-branch", async ({ workspaceRoot: root }) => {
    await prepare(root, {
      source: commonSource(
        `conditional({condition:{kind:"script",script:{kind:"scriptInput",code:"false"}},then:{commands:[${picture}]}})`,
      ),
    });
    const config = join(root, "rpgmaker-event-dsl.config.json");
    const data = JSON.parse(await readFile(config, "utf8"));
    await writeFile(config, JSON.stringify({ ...data, scriptEnabled: true }));
    const failure = await compileWorkspace({ workspaceRoot: root, check: true }).then(
      () => "",
      String,
    );
    expect(failure).toContain("MV-ASSET-MISSING-DIRECTORY");
    expect(failure).toContain("CommonEvents.json[10].list[1].parameters[1]");
  });
});
it("plugin asset declarations do not expand roots", async () => {
  await withWindowsSandbox("asset-plugin-declaration", async ({ workspaceRoot: root }) => {
    await prepare(root, { source: commonSource("") });
    await mkdir(join(root, "Game/js"));
    await writeFile(
      join(root, "Game/js/plugins.js"),
      'var $plugins=[{name:"Missing",status:true,parameters:{image:"img/pictures/NotFound"}}];',
    );
    await compileWorkspace({ workspaceRoot: root, check: true });
    expect(await readFile(join(root, "Game/js/plugins.js"), "utf8")).toContain("NotFound");
  });
});
for (const [branch, command] of [
  ["script-command", 'script({code:"const asset = \\\"Not a picture\\\";"})'],
  ["plugin-command", 'pluginCommand({line:"LoadPicture Missing"})'],
  [
    "unknown-raw",
    'rawDslCommand({code:9999,indent:0,parameters:["Missing","pictures","img/pictures/Missing.png"]})',
  ],
] as const)
  it(`uninterpreted payload strings never become asset targets (${branch})`, async () => {
    await withWindowsSandbox(`asset-scope-${branch}`, async ({ workspaceRoot: root }) => {
      await prepare(root, { source: commonSource(command) });
      const config = join(root, "rpgmaker-event-dsl.config.json");
      const data = JSON.parse(await readFile(config, "utf8"));
      await writeFile(config, JSON.stringify({ ...data, scriptEnabled: true }));
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await publishedUses(root)).toEqual([]);
      if (branch === "script-command") {
        await writeFile(
          config,
          JSON.stringify({
            ...data,
            scriptEnabled: false,
            assetCheckExceptions: [
              {
                category: "image",
                folder: "pictures",
                name: "Not a picture",
                reason: "Cannot waive Script Command Gate",
              },
            ],
          }),
        );
        const before = await state(root);
        await expect(compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
          /script/iu,
        );
        expect(await state(root)).toEqual(before);
      }
    });
  });
