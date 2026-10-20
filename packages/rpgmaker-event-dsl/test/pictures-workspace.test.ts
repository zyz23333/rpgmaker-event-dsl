import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, it } from "vitest";
import { discoverDefinitionFiles, loadDefinitionFile } from "../src/workspace/definitions.js";
import { getWorkspaceStatePaths } from "../src/workspace/state.js";
import { createMinimalProject, withWindowsSandbox } from "./support/windows-sandbox.js";
import { workspaceApiEntry } from "./support/workspace-operation-process.js";
import { recordEvidence } from "./support/mv-evidence.js";

const {
  initWorkspace,
  cloneWorkspace,
  decompileWorkspace,
  compileWorkspace,
  diffWorkspace,
  pushWorkspace,
}: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/mv-evidence/picture-parameters.json", import.meta.url),
    "utf8",
  ),
);
const discovery = {
  sourceRoot: "src",
  sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"],
  sourceExclude: [],
};
const imports =
  'import { commonEvent, showPicture, movePicture, rotatePicture, tintPicture, erasePicture, imageAsset, variableRef, rawDslCommand } from "rpgmaker-event-dsl";\n';
const declaration =
  'export const event=commonEvent({id:1,name:"Picture matrix",trigger:"none",commands:[command]});\n';
const display =
  'pictureId:1,origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"';
const sourcePath = (root: string) => join(root, "src/decompiled/common-events.events.ts");

function evidenceIt(id: string, name: string, verify: () => Promise<void>) {
  it(`${id}: ${name}`, async () => {
    const startedAt = new Date().toISOString();
    let failure: unknown;
    try {
      await verify();
    } catch (error) {
      failure = error;
      throw error;
    } finally {
      await recordEvidence({
        requirementId: id,
        startedAt,
        stages: [
          "Independent native literals and source",
          "Actual Discovery, public package evaluation, Workspace Check/Compile/Diff/Push",
          "Complete source/Discovery/Project Root/Snapshot/generated/config/descriptor/manifest comparisons",
        ],
        expected: name,
        actual: { assertionsCompleted: failure === undefined, entry: workspaceApiEntry },
        ...(failure === undefined ? {} : { error: failure }),
      });
    }
  });
}

function commonText(records: string[] = fixture.commonRecords): string {
  return `[null,{"id":1,"name":"Picture matrix","trigger":0,"switchId":1,"list":[${records.join(",")}]}]`;
}
async function prepare(
  root: string,
  nativeText = commonText(),
  overrides: Record<string, unknown> = {},
) {
  await createMinimalProject(root);
  for (const [name, value] of Object.entries({ ...fixture.projectFiles, ...overrides }))
    await writeFile(
      join(root, "Game/data", name),
      name === "CommonEvents.json" ? nativeText : JSON.stringify(value),
    );
  await initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await cloneWorkspace({ workspaceRoot: root });
}
async function directory(path: string): Promise<Record<string, string> | null> {
  try {
    const output: Record<string, string> = {};
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (entry.isDirectory())
        for (const [name, bytes] of Object.entries((await directory(join(path, entry.name)))!))
          output[`${entry.name}/${name}`] = bytes;
      else output[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
    }
    return output;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
async function state(root: string) {
  const paths = getWorkspaceStatePaths(root);
  return {
    sources: await directory(join(root, "src")),
    discovery: await discoverDefinitionFiles(root, discovery),
    project: await directory(join(root, "Game/data")),
    snapshot: await directory(paths.projectDataSnapshotDirectory),
    generated: await directory(paths.generatedProjectDataDirectory),
    manifest: await readFile(paths.syncManifestPath, "utf8"),
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    descriptor: await readFile(join(root, "Game/Game.rpgproject"), "utf8"),
  };
}
async function assertFiles(root: string, common: unknown, overrides: Record<string, unknown> = {}) {
  const paths = getWorkspaceStatePaths(root);
  const generated = ["CommonEvents.json", "Map001.json", "System.json", "Troops.json"];
  expect(Object.keys((await directory(join(root, "Game/data")))!)).toHaveLength(15);
  expect(Object.keys((await directory(paths.projectDataSnapshotDirectory))!)).toHaveLength(15);
  expect(Object.keys((await directory(paths.generatedProjectDataDirectory))!).sort()).toStrictEqual(
    generated,
  );
  for (const [name, value] of Object.entries({
    ...fixture.projectFiles,
    ...overrides,
    "CommonEvents.json": common,
  })) {
    for (const base of [
      join(root, "Game/data"),
      paths.projectDataSnapshotDirectory,
      ...(generated.includes(name) ? [paths.generatedProjectDataDirectory] : []),
    ])
      expect(JSON.parse(await readFile(join(base, name), "utf8"))).toStrictEqual(value);
  }
}
async function rejectSource(root: string, source: string, diagnostic: string, path: string) {
  await writeFile(sourcePath(root), source);
  const before = await state(root);
  expect(before.discovery).toContain(sourcePath(root));
  for (const check of [true, false]) {
    let message = "";
    try {
      await compileWorkspace({ workspaceRoot: root, check });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain(diagnostic);
    expect(message).toContain(path);
    expect(await state(root)).toStrictEqual(before);
  }
  await expect(diffWorkspace({ workspaceRoot: root })).rejects.toThrow(
    "Generated Project Data is stale",
  );
  expect(await state(root)).toStrictEqual(before);
  await expect(pushWorkspace({ workspaceRoot: root, allowDestructive: false })).rejects.toThrow(
    "Generated Project Data is stale",
  );
  expect(await state(root)).toStrictEqual(before);
}

evidenceIt(
  "MV-S6-PICTURE-002",
  "preserves complete independent Picture matrix through discovered source and real Push",
  async () => {
    await withWindowsSandbox("picture-complete-matrix", async ({ workspaceRoot: root }) => {
      await prepare(root);
      await decompileWorkspace({ workspaceRoot: root });
      const original = await readFile(sourcePath(root), "utf8");
      for (const text of [
        "image: null",
        'origin: "upperLeft"',
        'origin: "center"',
        'blendMode: "normal"',
        'blendMode: "additive"',
        'blendMode: "multiply"',
        'blendMode: "screen"',
        "wait: false",
        "wait: true",
        "speed: -0",
      ])
        expect(original).toContain(text);
      const files = await discoverDefinitionFiles(root, discovery);
      expect(files).toContain(sourcePath(root));
      const declarations = await loadDefinitionFile(sourcePath(root));
      expect(declarations).toContainEqual(expect.objectContaining({ kind: "commonEvent", id: 1 }));
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toStrictEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      await assertFiles(root, JSON.parse(commonText()));
      expect(await diffWorkspace({ workspaceRoot: root })).toContain("- none");
      await writeFile(
        sourcePath(root),
        original.replace('name: "Picture matrix"', 'name: "Installed Picture matrix"'),
      );
      await compileWorkspace({ workspaceRoot: root, check: false });
      expect(await diffWorkspace({ workspaceRoot: root })).toContain("CommonEvents.json");
      await pushWorkspace({ workspaceRoot: root, allowDestructive: false });
      const expected = JSON.parse(commonText());
      expected[1].name = "Installed Picture matrix";
      await assertFiles(root, expected);
    });
  },
);

const helpers = [
  ["showPicture", `{${display},image:null}`],
  ["movePicture", `{${display},duration:1,wait:false}`],
  ["rotatePicture", "{pictureId:100,speed:0}"],
  ["tintPicture", "{pictureId:100,tone:{red:0,green:0,blue:0,gray:0},duration:1,wait:false}"],
  ["erasePicture", "{pictureId:100}"],
] as const;
const imageAssetSourceForms = [
  ["local", 'const input={folder:"pictures" as const,name:"No scan",unexpected:true};', "input"],
  ["const", 'const input={folder:"pictures",name:"No scan",unexpected:true} as const;', "input"],
  [
    "spread",
    'const input={folder:"pictures",name:"No scan",unexpected:true} as const;',
    "{...input}",
  ],
  [
    "cast",
    'const input={folder:"pictures",name:"No scan",unexpected:true} as const;',
    "input as never",
  ],
] as const;
for (const [form, setup, expression] of imageAssetSourceForms)
  evidenceIt(
    "MV-S6-PICTURE-008",
    `rejects imageAsset input fields before projection via actual ${form} source`,
    async () => {
      await withWindowsSandbox(`picture-asset-input-${form}`, async ({ workspaceRoot: root }) => {
        await prepare(root);
        await decompileWorkspace({ workspaceRoot: root });
        await compileWorkspace({ workspaceRoot: root, check: false });
        await rejectSource(
          root,
          `${imports}${setup}\nconst image=imageAsset(${expression});\nconst command=showPicture({${display},image});\n${declaration}`,
          "MV-DSL-SHAPE",
          "imageAsset",
        );
      });
    },
  );
evidenceIt(
  "MV-S6-PICTURE-007",
  "preserves Picture commands in Map and Battle pages with inactive saved values and real Push",
  async () => {
    const carriers = JSON.parse(
      await readFile(
        new URL("./fixtures/mv-evidence/picture-carriers.json", import.meta.url),
        "utf8",
      ),
    ).projectFiles;
    await withWindowsSandbox("picture-map-troop-carriers", async ({ workspaceRoot: root }) => {
      await prepare(root, commonText(), carriers);
      await decompileWorkspace({ workspaceRoot: root });
      const files = await discoverDefinitionFiles(root, discovery);
      expect(files).toHaveLength(4);
      const declarations = (
        await Promise.all(files.map((file) => loadDefinitionFile(file)))
      ).flat();
      for (const kind of ["mapEvent", "troopEvent", "commonEvent"])
        expect(declarations).toContainEqual(expect.objectContaining({ kind }));
      const before = await state(root);
      await compileWorkspace({ workspaceRoot: root, check: true });
      expect(await state(root)).toStrictEqual(before);
      await compileWorkspace({ workspaceRoot: root, check: false });
      await assertFiles(root, JSON.parse(commonText()), carriers);
      expect(await diffWorkspace({ workspaceRoot: root })).toContain("- none");
      const source = await readFile(sourcePath(root), "utf8");
      await writeFile(
        sourcePath(root),
        source.replace('name: "Picture matrix"', 'name: "All carrier pictures installed"'),
      );
      await compileWorkspace({ workspaceRoot: root, check: false });
      await pushWorkspace({ workspaceRoot: root, allowDestructive: false });
      const expected = JSON.parse(commonText());
      expected[1].name = "All carrier pictures installed";
      await assertFiles(root, expected, carriers);
    });
  },
);
for (const [helper, valid] of helpers)
  for (const form of ["input", "{...input}", "input as never", "direct"])
    evidenceIt(
      "MV-S6-PICTURE-003",
      `rejects evaluated ${helper} excess fields via ${form}`,
      async () => {
        await withWindowsSandbox(
          `picture-shape-${helper}-${form === "direct" ? "direct" : form.length}`,
          async ({ workspaceRoot: root }) => {
            await prepare(root);
            await decompileWorkspace({ workspaceRoot: root });
            await compileWorkspace({ workspaceRoot: root, check: false });
            const input = `{${valid.slice(1, -1)},unexpected:"refuse"}`;
            const command =
              form === "direct" ? `({kind:"${helper}",...input} as const)` : `${helper}(${form})`;
            await rejectSource(
              root,
              `${imports}const input=${input} as const;\nconst command=${command};\n${declaration}`,
              "MV-DSL-SHAPE",
              form === "direct" ? "commands[0]" : helper,
            );
          },
        );
      },
    );

const nested = [
  [
    "showPicture",
    `{${display},image:{kind:"asset",category:"image",folder:"pictures",name:"No scan",unexpected:true}}`,
    ".image",
    "MV-DSL-SHAPE",
  ],
  [
    "showPicture",
    `{${display.replace("x:0,y:0", 'x:0,y:0,origin:"center"')},image:null}`,
    ".position",
    "MV-DSL-SHAPE",
  ],
  [
    "movePicture",
    `{${display.replace('kind:"direct",x:0,y:0', 'kind:"variables",x:{kind:"variable",id:1,unexpected:true},y:{kind:"variable",id:2}')},duration:1,wait:false}`,
    ".position.x",
    "MV-DSL-SHAPE",
  ],
  [
    "movePicture",
    `{${display.replace('kind:"direct",x:0,y:0', 'kind:"variables",x:{kind:"variable",id:1,name:"ambiguous"},y:{kind:"variable",id:2}')},duration:1,wait:false}`,
    ".position.x",
    "MV-E232-INPUT",
  ],
  [
    "tintPicture",
    "{pictureId:1,tone:{red:0,green:0,blue:0,gray:0,unexpected:true},duration:1,wait:false}",
    ".tone",
    "MV-DSL-SHAPE",
  ],
] as const;
for (const [index, [helper, input, suffix, diagnostic]] of nested.entries())
  for (const direct of [false, true])
    evidenceIt(
      "MV-S6-PICTURE-003",
      `rejects evaluated nested Picture shape ${index} via ${direct ? "direct" : "helper"}`,
      async () => {
        await withWindowsSandbox(
          `picture-nested-${index}-${direct}`,
          async ({ workspaceRoot: root }) => {
            await prepare(root);
            await decompileWorkspace({ workspaceRoot: root });
            await compileWorkspace({ workspaceRoot: root, check: false });
            const command = direct
              ? `({kind:"${helper}",...input} as never)`
              : `${helper}(input as never)`;
            await rejectSource(
              root,
              `${imports}const input=${input};\nconst command=${command};\n${declaration}`,
              diagnostic,
              `${direct ? "commands[0]" : helper}${suffix}`,
            );
          },
        );
      },
    );

for (const [index, invalid] of (
  fixture.negativeNative as {
    code: number;
    parameters: string;
    suffix: string;
    diagnostic: string;
  }[]
).entries())
  for (const origin of ["native", "raw"] as const)
    evidenceIt(
      "MV-S6-PICTURE-004",
      `refuses ${origin} Picture shape ${index} with complete state preserved`,
      async () => {
        await withWindowsSandbox(
          `picture-reject-${origin}-${index}`,
          async ({ workspaceRoot: root }) => {
            const diagnostic = `MV-E${invalid.code}-${invalid.diagnostic}`;
            if (origin === "native") {
              await prepare(
                root,
                commonText([
                  `{"code":${invalid.code},"indent":0,"parameters":${invalid.parameters}}`,
                  '{"code":0,"indent":0,"parameters":[]}',
                ]),
              );
              await writeFile(join(root, "src/user.events.ts"), "export {};\n");
              const before = await state(root);
              let message = "";
              try {
                await decompileWorkspace({ workspaceRoot: root });
              } catch (error) {
                message = error instanceof Error ? error.message : String(error);
              }
              expect(message).toContain(diagnostic);
              expect(message).toContain(`list[0].parameters${invalid.suffix}`);
              expect(message).toContain(
                invalid.diagnostic === "REFERENCE" ? "common event 1.list[0]" : "commonEvent:1",
              );
              expect(await state(root)).toStrictEqual(before);
            } else {
              await prepare(root);
              await decompileWorkspace({ workspaceRoot: root });
              await compileWorkspace({ workspaceRoot: root, check: false });
              await rejectSource(
                root,
                `${imports}const command=rawDslCommand({code:${invalid.code},parameters:${invalid.parameters}});\n${declaration}`,
                diagnostic,
                `commands[0].parameters${invalid.suffix}`,
              );
            }
          },
        );
      },
    );

for (const origin of ["formal", "direct", "raw"] as const)
  evidenceIt(
    "MV-S6-PICTURE-005",
    `preserves signed Picture values from actual ${origin} source through real Push`,
    async () => {
      await withWindowsSandbox(`picture-signed-${origin}`, async ({ workspaceRoot: root }) => {
        const expressions = [
          'showPicture({pictureId:1,image:null,origin:"center",position:{kind:"direct",x:-0,y:0},scaleX:-0,scaleY:0,opacity:-0,blendMode:"normal"})',
          'movePicture({pictureId:100,origin:"upperLeft",position:{kind:"direct",x:0,y:-0},scaleX:0,scaleY:-0,opacity:0,blendMode:"screen",duration:1,wait:false})',
          "rotatePicture({pictureId:100,speed:-0})",
          "tintPicture({pictureId:100,tone:{red:-0,green:0,blue:-0,gray:-0},duration:999,wait:true})",
        ];
        const records = [
          '{"code":231,"indent":0,"parameters":[1,"",1,0,-0,0,-0,0,-0,0]}',
          '{"code":232,"indent":0,"parameters":[100,0,0,0,0,-0,0,-0,0,3,1,false]}',
          '{"code":233,"indent":0,"parameters":[100,-0]}',
          '{"code":234,"indent":0,"parameters":[100,[-0,0,-0,-0],999,true]}',
          '{"code":0,"indent":0,"parameters":[]}',
        ];
        const expected = JSON.parse(commonText(records));
        await prepare(root, commonText(records));
        await decompileWorkspace({ workspaceRoot: root });
        const commands =
          origin === "raw"
            ? records.slice(0, -1).map((record) => {
                const raw = JSON.parse(record);
                return `rawDslCommand({code:${raw.code},parameters:${record.slice(record.indexOf('"parameters":') + 13, -1)}})`;
              })
            : origin === "direct"
              ? expressions.map((expression) =>
                  expression.replace(/^(\w+)\(\{/u, '{kind:"$1",').slice(0, -1),
                )
              : expressions;
        await writeFile(
          sourcePath(root),
          `${imports}export const event=commonEvent({id:1,name:"Picture matrix",trigger:"none",commands:[${commands.join(",")}]});\n`,
        );
        await loadDefinitionFile(sourcePath(root));
        const before = await state(root);
        await compileWorkspace({ workspaceRoot: root, check: true });
        expect(await state(root)).toStrictEqual(before);
        await compileWorkspace({ workspaceRoot: root, check: false });
        await assertFiles(root, expected);
        expect(await diffWorkspace({ workspaceRoot: root })).toContain("- none");
        const source = await readFile(sourcePath(root), "utf8");
        await writeFile(
          sourcePath(root),
          source.replace('name:"Picture matrix"', 'name:"Signed Picture installed"'),
        );
        await compileWorkspace({ workspaceRoot: root, check: false });
        await pushWorkspace({ workspaceRoot: root, allowDestructive: false });
        expected[1].name = "Signed Picture installed";
        await assertFiles(root, expected);
      });
    },
  );

const invalidTypes = [
  'showPicture({pictureId:1,image:null,position:{kind:"direct",x:0,y:0}})',
  `showPicture({${display.replace('blendMode:"normal"', "blendMode:0")},image:null})`,
  `showPicture({${display.replace("x:0,y:0", 'x:0,y:0,origin:"center"')},image:null})`,
  `movePicture({${display},duration:1})`,
  "tintPicture({pictureId:1,tone:[0,0,0,0],duration:1,wait:false})",
  "tintPicture({pictureId:1,tone:{red:0,green:0,blue:0,gray:0},duration:1})",
] as const;
for (const [index, command] of invalidTypes.entries())
  evidenceIt(
    "MV-S6-PICTURE-006",
    `public types reject incomplete or legacy Picture form ${index}`,
    async () => {
      await withWindowsSandbox(`picture-types-${index}`, async ({ workspaceRoot: root }) => {
        await prepare(root);
        await decompileWorkspace({ workspaceRoot: root });
        const file = sourcePath(root);
        await writeFile(file, `${imports}const command=${command};\n${declaration}`);
        await expect(loadDefinitionFile(file)).rejects.toThrow("TypeScript diagnostics");
      });
    },
  );
