import { mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, vi } from "vitest";
import { createAssetTest, recordAssetInput } from "./support/asset-evidence.js";
import { createMinimalProject, runCli, withWindowsSandbox } from "./support/windows-sandbox.js";
import {
  startWorkspaceOperation,
  workspaceApiEntry,
} from "./support/workspace-operation-process.js";
import { buildAssetReport } from "../src/validation/asset-report.js";
import { pendingPushSchema, syncManifestSchema, hashUtf8Content } from "../src/workspace/state.js";
import { writeStableJson } from "../src/project-data/writer.js";

const api: typeof import("../src/workspace-api.js") = await import(workspaceApiEntry);
const it = createAssetTest({ ownerTicket: "12", testSource: import.meta.url });
const configName = "rpgmaker-event-dsl.config.json";
const exception = {
  category: "image",
  folder: "pictures",
  name: "Poster",
  reason: "Awaiting artwork",
};

async function configuration(root: string, exceptions: unknown) {
  const path = join(root, configName);
  const config = JSON.parse(await readFile(path, "utf8"));
  config.assetCheckExceptions = exceptions;
  await writeFile(path, JSON.stringify(config));
  recordAssetInput({ assetCheckExceptions: exceptions });
}

async function prepare(root: string, authored?: string, project: Record<string, unknown> = {}) {
  await createMinimalProject(root);
  for (const [file, value] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await api.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await api.cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "src"), { recursive: true });
  const source =
    authored ??
    'import {commonEvent,rawDslCommand} from "rpgmaker-event-dsl";export const event=commonEvent({id:10,name:"Diagnostics",trigger:"none",commands:[rawDslCommand({code:231,indent:0,parameters:[1,"Poster",0,0,0,0,100,100,255,0]})]});';
  await writeFile(join(root, "src/diagnostics.events.ts"), source);
  recordAssetInput({ source, project });
}

const imports =
  'import {commonEvent,mapEvent,showPicture,imageAsset,rawDslCommand,showAnimation,animationRef,changePartyMember,actorRef,transferPlayer,mapRef,loop,setMovementRoute,script,callCommonEvent,commonEventRef,variableDefinition,variableRef} from "rpgmaker-event-dsl";\n';
const common = (commands: string, id = 10) =>
  `export const event${id}=commonEvent({id:${id},name:"Diagnostics",trigger:"none",commands:[${commands}]});\n`;
const picture = (name = "Poster", raw = false) =>
  raw
    ? `rawDslCommand({code:231,indent:0,parameters:[1,${JSON.stringify(name)},0,0,0,0,100,100,255,0]})`
    : `showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:${JSON.stringify(name)}}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})`;
const animation = (raw = false) =>
  raw
    ? "rawDslCommand({code:212,parameters:[-1,1,false]})"
    : 'showAnimation({target:{kind:"runtimeSelector",scope:"character",target:"player"},animation:animationRef({id:1}),wait:false})';
const addActor = (raw = false) =>
  raw
    ? "rawDslCommand({code:129,parameters:[1,0,false]})"
    : 'changePartyMember({actor:actorRef({id:1}),operation:"add",initialize:false})';
const transfer = (raw = false) =>
  raw
    ? "rawDslCommand({code:201,parameters:[0,1,0,0,0,0]})"
    : 'transferPlayer({destination:{kind:"direct",map:mapRef({id:1}),x:0,y:0}})';
const mapProject = {
  "MapInfos.json": [null, { id: 1, name: "Diagnostics" }],
  "Map001.json": { width: 1, height: 1, tilesetId: 1, events: [] },
  "Tilesets.json": [
    null,
    { id: 1, name: "Tiles", tilesetNames: ["", "", "", "", "", "", "", "", ""] },
  ],
};
function fixture(role: string, representation = "direct-formal", name: unknown = "Poster") {
  const raw = representation.endsWith("raw");
  if (role === "candidate")
    return {
      source: imports + common(addActor(raw)),
      project: {
        "Actors.json": [null, { id: 1, name: "Actor", characterName: name, battlerName: "" }],
      },
      category: "image",
      folder: "characters",
      name: String(name),
      native: "CommonEvents.json[10].list[0].parameters[0]",
      chain: "Actors.json[1].characterName",
    };
  if (role === "inactive" && representation === "page")
    return {
      source:
        imports +
        `export const event=mapEvent({mapId:1,id:1,name:"Diagnostics",x:0,y:0,pages:[{conditions:{},trigger:"action",commands:[],movement:{type:"fixed",route:{commands:[{kind:"changeImage",character:imageAsset({folder:"characters",name:${JSON.stringify(name)}}),characterIndex:0}]}}}]});`,
      project: mapProject,
      category: "image",
      folder: "characters",
      name: String(name),
      native: "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0]",
      chain: "inactive: Autonomous Movement is fixed",
    };
  if (role === "inactive")
    return {
      source: imports + common(transfer(raw)),
      project: {
        ...mapProject,
        "Map001.json": {
          width: 1,
          height: 1,
          tilesetId: 1,
          parallaxName: "",
          autoplayBgm: false,
          autoplayBgs: false,
          bgm: { name, volume: 90, pitch: 100, pan: 0 },
          bgs: { name: "", volume: 90, pitch: 100, pan: 0 },
          events: [],
        },
      },
      category: "audio",
      folder: "bgm",
      name: String(name),
      native: "CommonEvents.json[10].list[0].parameters[1]",
      chain: "Map001.json[1].bgm.name",
    };
  if (representation.startsWith("indirect"))
    return {
      source: imports + common(animation(raw)),
      project: {
        "Animations.json": [
          null,
          { id: 1, name: "Animation", animation1Name: name, animation2Name: "", timings: [] },
        ],
      },
      category: "image",
      folder: "animations",
      name: String(name),
      native: "CommonEvents.json[10].list[0].parameters[1]",
      chain: "Animations.json[1].animation1Name",
    };
  return {
    source: imports + common(picture(String(name), raw)),
    project: {},
    category: "image",
    folder: "pictures",
    name: String(name),
    native: "CommonEvents.json[10].list[0].parameters[1]",
    chain: "",
  };
}
type Fixture = ReturnType<typeof fixture>;
const targetPath = (root: string, value: Fixture) =>
  join(
    root,
    "Game",
    value.category === "image" ? "img" : "audio",
    value.folder,
    `${value.name}${value.category === "image" ? ".png" : ".ogg"}`,
  );
async function fact(root: string, value: Fixture, kind: string) {
  const path = targetPath(root, value);
  await mkdir(join(path, ".."), { recursive: true });
  if (kind === "name-mismatch")
    await writeFile(
      join(
        path,
        "..",
        `${value.name.toLowerCase()}${value.category === "image" ? ".png" : ".ogg"}`,
      ),
      "",
    );
  if (kind === "wrong-type") await mkdir(path);
  if (kind === "present") await writeFile(path, "");
  recordAssetInput({ fact: kind, target: path });
}
async function state(root: string) {
  async function tree(path: string): Promise<Record<string, string> | null> {
    const entries = await readdir(path, { withFileTypes: true }).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (entries === null) return null;
    const result: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.name === "operation.lock") continue;
      if (entry.isSymbolicLink()) {
        result[entry.name] = "link";
        continue;
      }
      if (entry.isDirectory())
        for (const [key, bytes] of Object.entries((await tree(join(path, entry.name)))!))
          result[`${entry.name}/${key}`] = bytes;
      else result[entry.name] = (await readFile(join(path, entry.name))).toString("base64");
    }
    return result;
  }
  return {
    project: await tree(join(root, "Game")),
    state: await tree(join(root, ".rpgmaker-event-dsl")),
    source: await tree(join(root, "src")),
    config: await readFile(join(root, configName), "utf8"),
  };
}
async function check(root: string) {
  const output: string[] = [];
  const observer = vi.spyOn(console, "error").mockImplementation((...args) => {
    output.push(args.join(" "));
  });
  let failure = "";
  try {
    await api.compileWorkspace({ workspaceRoot: root, check: true });
  } catch (error) {
    failure = String(error);
  } finally {
    observer.mockRestore();
  }
  return { failure, output: [...output, failure].join("\n") };
}

it("AV.D04.invalid-category.native.case.expected: invalid exception identifies its config item and leaves asset checking unrun", async () => {
  await withWindowsSandbox("asset-invalid-category", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root);
    await configuration(root, [{ ...exception, category: "video" }]);
    await expect(api.compileWorkspace({ workspaceRoot: root, check: true })).rejects.toThrow(
      "MV-ASSET-INVALID-EXCEPTION",
    );
    const result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("assetCheckExceptions[0]");
    expect(result.stderr).toContain("asset check not run");
    expect(result.stderr).not.toContain("MV-ASSET-MISSING");
    recordAssetInput({ actualCli: result });
  });
});

it("AV.D03.eligible.native.missing.expected: an exact missing asset exception downgrades each ordinary use and preserves its original fact and reason", async () => {
  await withWindowsSandbox("asset-exception-missing", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    await configuration(root, [exception]);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    const result = await runCli(sandbox, ["compile", "--check"]);
    expect(result.stderr).toContain("warning MV-ASSET-MISSING-FILE");
    expect(result.stderr).toContain("base: error; effective: warning");
    expect(result.stderr).toContain("Awaiting artwork");
    expect(result.stderr).toContain("CommonEvents.json[10].list[0].parameters[1]");
    expect(result.stderr).toContain("1 problem group(s), 1 problem file(s), 1 affected use(s)");
    expect(result.stderr).not.toContain("MV-ASSET-INEFFECTIVE-EXCEPTION");
    recordAssetInput({ actualCli: result });
  });
  await eligibleSources("missing");
});

for (const [role, representations] of [
  ["ordinary", ["direct-formal", "direct-raw", "indirect-formal", "indirect-raw"]],
  ["candidate", ["indirect-formal", "indirect-raw"]],
  ["inactive", ["page", "indirect-formal", "indirect-raw"]],
] as const)
  for (const representation of representations)
    for (const problem of ["missing", "name-mismatch", "wrong-type"] as const)
      it(`AV.D01.${role}.${representation}.${problem}.expected: legal ${role} ${representation} uses retain the independently specified base and effective level`, async () => {
        await withWindowsSandbox(
          `asset-level-${role}-${representation}-${problem}`,
          async (sandbox) => {
            const root = sandbox.workspaceRoot;
            const value = fixture(role, representation);
            await prepare(root, value.source, value.project);
            await fact(root, value, problem);
            const before = await state(root);
            const result = await check(root);
            const code = {
              missing: "MV-ASSET-MISSING-FILE",
              "name-mismatch": "MV-ASSET-NAME-MISMATCH",
              "wrong-type": "MV-ASSET-PATH-TYPE",
            }[problem];
            const level = role === "ordinary" ? "error" : "warning";
            expect(Boolean(result.failure)).toBe(role === "ordinary");
            expect(result.output).toContain(`${level} ${code}`);
            expect(result.output).toContain(`base: ${level}; effective: ${level}`);
            expect(result.output).toContain(value.native);
            if (value.chain)
              expect(result.output).toContain(value.chain.replace("Map001.json[1]", "Map001.json"));
            expect(result.output).toContain(
              "1 problem group(s), 1 problem file(s), 1 affected use(s)",
            );
            expect(result.output).toContain("Coverage: complete");
            expect(await state(root)).toEqual(before);
            recordAssetInput({
              independentlyExpected: { code, level, native: value.native, chain: value.chain },
              actualApi: result,
            });
          },
        );
      });

for (const [branch, entry] of [
  ["invalid-folder", { ...exception, folder: "unknown" }],
  ["category-folder-mismatch", { ...exception, category: "audio" }],
  ["empty-name", { ...exception, name: "" }],
  ["missing-name", { category: "image", folder: "pictures", reason: "Pending" }],
  ["missing-reason", { category: "image", folder: "pictures", name: "Poster" }],
  ["blank-reason", { ...exception, reason: " \t\n" }],
  ["duplicate", exception],
  ["unknown-field", { ...exception, enabled: true }],
] as const)
  it(`AV.D04.${branch}.native.case.expected: invalid exact exception configuration fails before asset checking and identifies its item`, async () => {
    await withWindowsSandbox(`asset-config-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root);
      await configuration(root, branch === "duplicate" ? [entry, entry] : [entry]);
      const before = await state(root);
      const result = await check(root);
      expect(result.failure).toContain("MV-ASSET-INVALID-EXCEPTION");
      expect(result.failure).toContain(`assetCheckExceptions[${branch === "duplicate" ? 1 : 0}]`);
      expect(result.failure).toContain("asset check not run");
      expect(result.failure).not.toContain("MV-ASSET-MISSING");
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).toBe(1);
      expect(cli.stderr).toContain("MV-ASSET-INVALID-EXCEPTION");
      expect(cli.stderr).toContain("asset check not run");
      recordAssetInput({ actualApi: result, actualCli: cli });
    });
  });

for (const role of ["ordinary", "candidate", "inactive", "exception"] as const)
  for (const problem of [
    "unsupported-name",
    "unsupported-link",
    "encrypted",
    "required-field",
    "unqueryable",
    "inconsistent",
  ] as const)
    it(`AV.D02.${role}.native.${problem}.expected: ${problem} retains its non-waivable policy for ${role} without inventing a successful check`, async () => {
      await withWindowsSandbox(`asset-nonwaivable-${role}-${problem}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        const actualRole = role === "exception" ? "ordinary" : role;
        const representation =
          actualRole === "inactive"
            ? problem === "required-field"
              ? "indirect-formal"
              : "page"
            : problem === "required-field"
              ? "indirect-formal"
              : "direct-formal";
        const value = fixture(
          actualRole,
          representation,
          problem === "unsupported-name"
            ? "Unsafe#Image"
            : problem === "required-field"
              ? 42
              : "Poster",
        );
        await prepare(root, value.source, value.project);
        if (problem === "encrypted") {
          const systemPath = join(root, ".rpgmaker-event-dsl/project-data-snapshot/System.json");
          // Set captured standard data before Clone, preserving a real, self-consistent Snapshot.
          const system = JSON.parse(await readFile(join(root, "Game/data/System.json"), "utf8"));
          await writeFile(
            join(root, "Game/data/System.json"),
            JSON.stringify({ ...system, hasEncryptedImages: true }),
          );
          await api.pullWorkspace({ workspaceRoot: root });
          expect(JSON.parse(await readFile(systemPath, "utf8")).hasEncryptedImages).toBe(true);
        }
        if (role === "exception")
          await configuration(root, [
            {
              category: value.category,
              folder: value.folder,
              name: value.name,
              reason: "This cannot waive support or query failures",
            },
          ]);
        if (problem === "unsupported-link") {
          const path = targetPath(root, value);
          await mkdir(join(path, "../.."), { recursive: true });
          const destination = join(root, "unfollowed-link-target");
          await mkdir(destination);
          await writeFile(join(destination, "Poster.png"), "");
          await symlink(destination, join(path, ".."), "junction");
          recordAssetInput({
            filesystemLink: { categoryPath: join(path, ".."), target: destination },
          });
        } else if (problem !== "required-field" && problem !== "unsupported-name")
          await fact(root, value, "present");
        const before = await state(root);
        let result: { failure: string; output: string };
        if (problem === "unqueryable" || problem === "inconsistent") {
          const relative = `${value.category === "image" ? "img" : "audio"}/${value.folder}/${value.name}${value.category === "image" ? ".png" : ".ogg"}`;
          const child = startWorkspaceOperation(sandbox, {
            operation: "check",
            boundary:
              problem === "unqueryable" ? "asset-metadata-denied" : "asset-after-enumeration",
            assetPath: relative,
          });
          try {
            if (problem === "inconsistent") {
              await child.waitFor("checkpoint");
              await rm(targetPath(root, value));
              child.send("release");
            }
            expect((await child.ended).exitCode).toBe(1);
            const error = child.messages.find((message) => message.kind === "result")!;
            expect(error.ok).toBe(false);
            result = { failure: error.message!, output: error.message! };
            recordAssetInput({
              osBoundary: problem,
              actualProcess: sandbox.processes.at(-1),
              driverMutation:
                problem === "inconsistent"
                  ? "remove selected file after its native directory entry was captured"
                  : "none",
            });
          } finally {
            await child.stop();
          }
        } else result = await check(root);
        const code = {
          "unsupported-name": "MV-ASSET-UNSUPPORTED-NAME",
          "unsupported-link": "MV-ASSET-UNSUPPORTED-LINK",
          encrypted: "MV-ASSET-UNSUPPORTED-ENCRYPTION",
          "required-field": "MV-ASSET-INVALID-DATA",
          unqueryable: "MV-ASSET-QUERY-FAILED",
          inconsistent: "MV-ASSET-QUERY-FAILED",
        }[problem];
        const warning =
          (role === "candidate" || role === "inactive") &&
          ["unsupported-name", "unsupported-link", "encrypted"].includes(problem);
        expect(Boolean(result.failure)).toBe(!warning);
        expect(result.output).toContain(`${warning ? "warning" : "error"} ${code}`);
        if (problem === "encrypted") expect(result.output).toContain("required extension: .png");
        expect(result.output).toContain("Coverage: incomplete");
        expect(result.output).toContain(value.native);
        expect(result.output).not.toContain("exception reason:");
        expect(result.output).not.toContain("MV-ASSET-INEFFECTIVE-EXCEPTION");
        if (problem === "unsupported-name" || problem === "required-field") {
          expect(result.output).not.toContain("; target:");
          expect(result.output).toContain("0 problem file(s)");
        }
        const after = await state(root);
        expect(after.state).toEqual(before.state);
        expect(after.source).toEqual(before.source);
        expect(after.config).toEqual(before.config);
        if (problem !== "inconsistent") expect(after.project).toEqual(before.project);
        recordAssetInput({
          independentlyExpected: { code, level: warning ? "warning" : "error", canWaive: false },
          actualApi: result,
        });
      });
    });

it("AV.D09.reliable-source.native.case.expected: a captured formal command exposes its reliable authored object path and one-based source coordinate alongside native origin", async () => {
  await withWindowsSandbox("asset-reliable-source", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const authored = `${imports}export const event=commonEvent({id:10,name:"Source",trigger:"none",commands:[\n  ${picture()}\n]});\n`;
    await prepare(root, authored);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    const result = await check(root);
    expect(result.failure).toContain("CommonEvents.json[10].list[0].parameters[1]");
    expect(result.failure).toContain("DSL: commands[0]");
    expect(result.failure).toContain("diagnostics.events.ts (line 3, column 3)");
    recordAssetInput({
      authored,
      independentlyExpectedSource: { line: 3, column: 3, dslPath: "commands[0]" },
      actualApi: result,
    });
  });
});

async function eligibleSources(problem: string) {
  await withWindowsSandbox(`asset-eligible-${problem}`, async (sandbox) => {
    const root = sandbox.workspaceRoot;
    const authored =
      imports +
      'import {playSe,audioAsset} from "rpgmaker-event-dsl";\n' +
      common(
        `playSe({audio:{asset:audioAsset({folder:"se",name:"Shared"}),volume:90,pitch:100,pan:0}}),rawDslCommand({code:250,parameters:[{name:"Shared",volume:90,pitch:100,pan:0}]}),${animation()}`,
      );
    const project = {
      "Animations.json": [
        null,
        {
          id: 1,
          name: "Animation",
          animation1Name: "",
          animation2Name: "",
          timings: [{ frame: 7, se: { name: "Shared", volume: 90, pitch: 100, pan: 0 } }],
        },
      ],
    };
    await prepare(root, authored, project);
    const value = { ...fixture("ordinary"), category: "audio", folder: "se", name: "Shared" };
    await fact(root, value, problem);
    await configuration(root, [
      { category: "audio", folder: "se", name: "Shared", reason: "  Recording in progress  " },
    ]);
    const before = await state(root);
    const result = await check(root);
    expect(result.failure).toBe("");
    expect(result.output).toContain(
      `warning ${{ missing: "MV-ASSET-MISSING-FILE", "name-mismatch": "MV-ASSET-NAME-MISMATCH", "wrong-type": "MV-ASSET-PATH-TYPE" }[problem]}`,
    );
    expect(result.output).toContain('audio/se "Shared"; 3 use(s)');
    expect(result.output.match(/base: error; effective: warning/gu)).toHaveLength(3);
    expect(result.output.match(/exception reason:   Recording in progress  /gu)).toHaveLength(3);
    expect(result.output).toContain("CommonEvents.json[10].list[0].parameters[0].name");
    expect(result.output).toContain("CommonEvents.json[10].list[1].parameters[0].name");
    expect(result.output).toContain("CommonEvents.json[10].list[2].parameters[1]");
    expect(result.output).toContain("Animations.json[1].timings[0].se.name");
    expect(result.output).toContain("only when its frame is reached");
    expect(result.output).toContain("1 problem group(s), 1 problem file(s), 3 affected use(s)");
    expect(result.output).not.toContain("MV-ASSET-INEFFECTIVE-EXCEPTION");
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile", "--check"]);
    expect(cli.stderr).toContain('audio/se "Shared"; 3 use(s)');
    recordAssetInput({
      actualApi: result,
      actualCli: cli,
      independentlyExpected:
        "Three distinct formal/raw/Animation-timing uses of one exact SE; all three base errors downgrade, original spaced reason retained.",
    });
  });
}
for (const problem of ["name-mismatch", "wrong-type"] as const)
  it(`AV.D03.eligible.native.${problem}.expected: one exact exception downgrades formal raw and indirect uses while retaining each complete origin`, () =>
    eligibleSources(problem));

for (const [branch, changed] of [
  ["exact-namespace", { category: "audio", folder: "se", name: "Poster" }],
  ["case-distinct", { category: "image", folder: "pictures", name: "poster" }],
  ["space-distinct", { category: "image", folder: "pictures", name: "Poster " }],
  ["suffix-distinct", { category: "image", folder: "pictures", name: "Poster.png" }],
  ["encoding-distinct", { category: "image", folder: "pictures", name: "%50oster" }],
] as const)
  it(`AV.D03.${branch}.native.case.expected: exact exception keys preserve category folder case spaces suffix and encoding without broadening matching`, async () => {
    await withWindowsSandbox(`asset-exact-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root);
      await mkdir(join(root, "Game/img/pictures"), { recursive: true });
      await configuration(root, [{ ...changed, reason: "Exact saved value only" }]);
      const before = await state(root);
      const result = await check(root);
      expect(result.failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(result.failure).toContain("base: error; effective: error");
      expect(result.output).toContain(
        "warning MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[0]",
      );
      expect(result.failure).not.toContain("exception reason:");
      expect(await state(root)).toEqual(before);
      if (branch === "exact-namespace") {
        await configuration(root, [{ ...exception, folder: "faces" }]);
        expect((await check(root)).failure).toContain("error MV-ASSET-MISSING-FILE");
      }
      recordAssetInput({ exactNonmatchingKey: changed, actualApi: result });
    });
  });

for (const branch of ["repaired", "unused", "warning-only", "incomplete"] as const)
  it(
    `AV.D05.${branch}.native.case.expected: ineffective exceptions are located only when complete relevant checking establishes that no error was downgraded`,
    async () => {
      await withWindowsSandbox(`asset-ineffective-${branch}`, async (sandbox) => {
        const root = sandbox.workspaceRoot;
        const value = fixture(
          branch === "warning-only" ? "candidate" : "ordinary",
          branch === "incomplete" ? "indirect-formal" : "direct-formal",
          branch === "incomplete" ? 42 : "Poster",
        );
        await prepare(
          root,
          branch === "unused" ? imports + common("") : value.source,
          value.project,
        );
        if (branch !== "incomplete")
          await fact(root, value, branch === "repaired" ? "present" : "missing");
        await configuration(root, [
          {
            category: value.category,
            folder: value.folder,
            name: "Poster",
            reason: "Temporary authoring gap",
          },
        ]);
        const before = await state(root);
        const result = await check(root);
        expect(Boolean(result.failure)).toBe(branch === "incomplete");
        if (branch === "incomplete") {
          expect(result.output).toContain("MV-ASSET-INVALID-DATA");
          expect(result.output).not.toContain("MV-ASSET-INEFFECTIVE-EXCEPTION");
        } else {
          expect(result.output).toContain(
            "warning MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[0]",
          );
          expect(result.output).toContain("Temporary authoring gap");
        }
        if (branch === "warning-only") {
          expect(result.output).toContain("base: warning; effective: warning");
          expect(result.output).toContain("exception reason: Temporary authoring gap");
        }
        expect(await state(root)).toEqual(before);
        recordAssetInput({ actualApi: result });
      });
      if (branch === "incomplete") await independentlyDeterminableExceptions();
    },
    branch === "incomplete" ? 30_000 : undefined,
  );

async function independentlyDeterminableExceptions() {
  for (const sibling of ["repaired", "unused", "warning-only"] as const)
    await withWindowsSandbox(`asset-related-incomplete-${sibling}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const source =
        imports +
        common(
          `${picture()}${sibling === "repaired" ? `,${picture("Other")}` : sibling === "warning-only" ? `,${addActor()}` : ""}`,
        );
      await prepare(
        root,
        source,
        sibling === "warning-only"
          ? {
              "Actors.json": [
                null,
                { id: 1, name: "Sibling", characterName: "Other", battlerName: "" },
              ],
            }
          : {},
      );
      await fact(root, fixture("ordinary"), "present");
      const other = {
        ...fixture("ordinary"),
        folder: sibling === "warning-only" ? "characters" : "pictures",
        name: "Other",
      };
      if (sibling !== "unused")
        await fact(root, other, sibling === "repaired" ? "present" : "missing");
      await configuration(root, [
        exception,
        {
          category: "image",
          folder: other.folder,
          name: "Other",
          reason: "Independent exact sibling",
        },
      ]);
      const before = await state(root);
      for (const mode of ["api", "cli"] as const) {
        const child = startWorkspaceOperation(sandbox, {
          operation: "check",
          mode,
          boundary: "asset-metadata-denied",
        });
        try {
          expect((await child.ended).exitCode).toBe(1);
          const result = sandbox.processes.at(-1)!;
          const output =
            result.stderr +
            (mode === "cli"
              ? ""
              : child.messages.find((message) => message.kind === "result")!.message!);
          expect(output).toContain("error MV-ASSET-QUERY-FAILED");
          expect(output).toContain("MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[1]");
          expect(output).not.toContain("MV-ASSET-INEFFECTIVE-EXCEPTION: assetCheckExceptions[0]");
          expect(output).toContain("Independent exact sibling");
          expect(output).toContain("Coverage: incomplete");
          if (sibling === "warning-only") expect(output).toContain("warning MV-ASSET-MISSING-FILE");
          recordAssetInput({
            sibling,
            mode,
            actualProcess: result,
            exactScope:
              "Poster query failure leaves only its own effect indeterminate; Other remains determinable",
          });
        } finally {
          await child.stop();
        }
      }
      expect(await state(root)).toEqual(before);
    });
}

const mixedSource = (other = false) =>
  imports +
  `export const event=mapEvent({mapId:1,id:1,name:"Mixed",x:0,y:0,pages:[{conditions:{},trigger:"action",image:{character:imageAsset({folder:"characters",name:"Poster"}),characterIndex:0},movement:{type:"custom",route:{commands:[{kind:"changeImage",character:imageAsset({folder:"characters",name:"Poster"}),characterIndex:0}]}},commands:[${addActor()}${other ? `,${picture("Other")}` : ""}]}]});`;
for (const branch of ["mixed-levels", "multiple-files"] as const)
  it(`AV.D06.${branch}.native.case.expected: groups retain individual ordinary and candidate levels and count groups files and real uses separately`, async () => {
    await withWindowsSandbox(`asset-count-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      await prepare(root, mixedSource(branch === "multiple-files"), {
        ...mapProject,
        "Actors.json": [null, { id: 1, name: "Actor", characterName: "Poster", battlerName: "" }],
      });
      await mkdir(join(root, "Game/img/characters"), { recursive: true });
      if (branch === "multiple-files")
        await mkdir(join(root, "Game/img/pictures/Other.png"), { recursive: true });
      const result = await check(root);
      expect(result.failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(result.output).toContain('image/characters "Poster"; 3 use(s)');
      expect(result.output.match(/base: error; effective: error/gu)).toHaveLength(
        branch === "multiple-files" ? 3 : 2,
      );
      expect(result.output.match(/base: warning; effective: warning/gu)).toHaveLength(1);
      expect(result.output).toContain(
        branch === "multiple-files"
          ? "2 problem group(s), 2 problem file(s), 4 affected use(s)"
          : "1 problem group(s), 1 problem file(s), 3 affected use(s)",
      );
      expect(result.output).toContain("Map001.json.events[1].pages[0].image.characterName");
      expect(result.output).toContain(
        "Map001.json.events[1].pages[0].moveRoute.list[0].parameters[0]",
      );
      expect(result.output).toContain("Actors.json[1].characterName");
      recordAssetInput({ actualApi: result });
    });
  });

it("AV.D06.same-file-two-groups.native.case.expected: independent aggregation input counts one legal file across two problem categories while retaining both occurrences", async () => {
  const origin = {
    identity: "commonEvent:10",
    nativePath: "CommonEvents.json[10].list[0].parameters[1]",
    relatedNativePaths: [],
    dependencyChain: [],
    conditions: [],
  };
  const target = {
    ...origin,
    category: "image" as const,
    folder: "pictures" as const,
    name: "Poster",
  };
  const input = [
    {
      code: "MV-ASSET-MISSING-FILE",
      reason: "Independent aggregation fact A",
      targetPath: "C:/Game/img/pictures/Poster.png",
      target,
      uses: [origin],
    },
    {
      code: "MV-ASSET-PATH-TYPE",
      reason: "Independent aggregation fact B",
      targetPath: "C:/Game/img/pictures/Poster.png",
      target,
      uses: [
        {
          ...origin,
          nativePath: "CommonEvents.json[10].list[1].parameters[1]",
          candidate: "Selected initial candidate",
        },
      ],
    },
  ];
  const report = buildAssetReport(input, []);
  expect(report.statistics).toEqual({ groups: 2, files: 1, uses: 2 });
  expect(report.groups.map((group) => [group.code, group.level])).toEqual([
    ["MV-ASSET-MISSING-FILE", "error"],
    ["MV-ASSET-PATH-TYPE", "warning"],
  ]);
  expect(report.hasErrors).toBe(true);
  recordAssetInput({
    scope:
      "Explicitly internal aggregation input, not a claim that contradictory filesystem states coexisted",
    independentInput: input,
    expectedStatistics: { groups: 2, files: 1, uses: 2 },
    actualStatistics: report.statistics,
  });
});

for (const branch of [
  "shared-directory-failure",
  "shared-field-failure",
  "invalid-target",
] as const)
  it(`AV.D07.${branch}.native.case.expected: a common failed basis retains every known origin without fabricating legal targets for unchecked names or fields`, async () => {
    await withWindowsSandbox(`asset-common-failure-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const name = branch === "invalid-target" ? "Unsafe#Name" : "Poster";
      const authored =
        imports +
        common(`${picture(name)},${picture(name, true)}`) +
        common(picture(branch === "invalid-target" ? name : "Second"), 11);
      await prepare(root, authored);
      if (branch === "shared-field-failure") {
        const path = join(root, "Game/data/System.json");
        const system = JSON.parse(await readFile(path, "utf8"));
        await writeFile(path, JSON.stringify({ ...system, hasEncryptedImages: "damaged" }));
        await api.pullWorkspace({ workspaceRoot: root });
      }
      const before = await state(root);
      const result = await check(root);
      const code = {
        "shared-directory-failure": "MV-ASSET-MISSING-DIRECTORY",
        "shared-field-failure": "MV-ASSET-INVALID-DATA",
        "invalid-target": "MV-ASSET-UNSUPPORTED-NAME",
      }[branch];
      expect(result.failure).toContain(`error ${code}`);
      for (const position of [
        "CommonEvents.json[10].list[0].parameters[1]",
        "CommonEvents.json[10].list[1].parameters[1]",
        "CommonEvents.json[11].list[0].parameters[1]",
      ])
        expect(result.failure).toContain(position);
      expect(result.failure).toContain("3 affected use(s)");
      if (branch !== "shared-directory-failure") {
        expect(result.failure).toContain("0 problem file(s)");
        expect(result.failure).not.toContain("; target:");
      }
      if (branch === "shared-field-failure")
        expect(result.failure).toContain("System.json.hasEncryptedImages");
      expect(await state(root)).toEqual(before);
      recordAssetInput({ actualApi: result });
    });
  });

async function earlyFailure(root: string, branch: string) {
  const source =
    branch === "early-config"
      ? imports + common(picture())
      : imports +
        common(
          branch.includes("reference")
            ? animation()
            : branch === "script-gate"
              ? `script({code:${JSON.stringify('ImageManager.loadPicture("Poster");')}})`
              : "rawDslCommand({code:231,parameters:[1]})",
        );
  await prepare(root, source);
  await configuration(
    root,
    branch === "early-config" ? [{ ...exception, category: "unknown" }] : [exception],
  );
  const before = await state(root);
  const result = await check(root);
  expect(result.failure).toContain("asset check not run");
  expect(result.failure).not.toContain("MV-ASSET-MISSING");
  expect(result.failure).not.toContain("Coverage: complete");
  expect(await state(root)).toEqual(before);
  recordAssetInput({ earlierFailure: branch, actualApi: result });
  return result;
}
for (const branch of ["reference-error", "structure-error", "script-gate"] as const)
  it(`AV.D02.${branch}.native.case.expected: matching asset exceptions cannot waive a prior fixed reference structure or Script Command Gate error`, async () => {
    await withWindowsSandbox(`asset-gate-${branch}`, async (sandbox) => {
      const result = await earlyFailure(sandbox.workspaceRoot, branch);
      expect(result.failure).toMatch(
        branch === "script-gate"
          ? /script/iu
          : branch === "reference-error"
            ? /animation/iu
            : /231|parameters|structure/iu,
      );
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).toBe(1);
      expect(cli.stderr).toContain("asset check not run");
      recordAssetInput({ actualCli: cli });
    });
  });
for (const branch of ["early-config", "early-structure", "early-reference"] as const)
  it(`AV.D08.${branch}.native.case.expected: untrusted earlier input reports that asset checking never ran instead of treating zero findings as success`, async () => {
    await withWindowsSandbox(`asset-early-${branch}`, async (sandbox) => {
      await earlyFailure(sandbox.workspaceRoot, branch);
    });
  });

it("AV.D08.independent-results.native.case.expected: a damaged relationship retains unrelated confirmed errors and candidate warnings in the same complete diagnostic delivery", async () => {
  await withWindowsSandbox("asset-independent-results", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, imports + common(`${animation()},${picture()},${addActor()}`), {
      "Animations.json": [
        null,
        { id: 1, name: "Broken animation", animation1Name: 42, animation2Name: "", timings: [] },
      ],
      "Actors.json": [
        null,
        { id: 1, name: "Candidate", characterName: "Candidate", battlerName: "" },
      ],
    });
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    await mkdir(join(root, "Game/img/characters"), { recursive: true });
    const before = await state(root);
    const result = await check(root);
    expect(result.failure).toContain("error MV-ASSET-INVALID-DATA");
    expect(result.failure).toContain("error MV-ASSET-MISSING-FILE");
    expect(result.output).toContain("warning MV-ASSET-MISSING-FILE");
    expect(result.failure).toContain("Animations.json[1].animation1Name");
    expect(result.output).toContain("Actors.json[1].characterName");
    expect(result.failure).toContain("3 problem group(s), 2 problem file(s), 3 affected use(s)");
    expect(result.failure).toContain("Coverage: incomplete");
    expect(await state(root)).toEqual(before);
    const cli = await runCli(sandbox, ["compile"], { allowFailure: true });
    expect(cli.exitCode).toBe(1);
    expect(cli.stderr).toContain("warning MV-ASSET-MISSING-FILE");
    expect(cli.stderr).toContain("error MV-ASSET-INVALID-DATA");
    recordAssetInput({ actualApi: result, actualCli: cli });
  });
});

for (const branch of ["map-page", "nested-body", "route"] as const)
  it(`AV.D09.${branch}.native.case.expected: every saved location retains its definition identity nested authored path route mirrors and applicable event-local chain`, async () => {
    await withWindowsSandbox(`asset-provenance-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const authored =
        branch === "map-page"
          ? imports +
            `export const event=mapEvent({mapId:1,id:1,name:"Pages",x:0,y:0,pages:[{conditions:{},trigger:"action",image:{character:imageAsset({folder:"characters",name:"Poster"}),characterIndex:0},commands:[]},{conditions:{},trigger:"action",image:{character:imageAsset({folder:"characters",name:"Poster"}),characterIndex:0},commands:[]}]});`
          : imports +
            common(
              branch === "nested-body"
                ? `loop({body:{commands:[${animation()}]}})`
                : 'setMovementRoute({target:{kind:"runtimeSelector",scope:"character",target:"player"},route:{commands:[{kind:"changeImage",character:imageAsset({folder:"characters",name:"Poster"}),characterIndex:0}]}})',
            );
      const project =
        branch === "map-page"
          ? mapProject
          : branch === "nested-body"
            ? {
                "Animations.json": [
                  null,
                  {
                    id: 1,
                    name: "Nested animation",
                    animation1Name: "Poster",
                    animation2Name: "",
                    timings: [],
                  },
                ],
              }
            : {};
      await prepare(root, authored, project);
      await mkdir(join(root, "Game/img", branch === "nested-body" ? "animations" : "characters"), {
        recursive: true,
      });
      const before = await state(root);
      const result = await check(root);
      expect(result.failure).toContain("error MV-ASSET-MISSING-FILE");
      expect(result.failure).toContain("Project Root:");
      expect(result.failure).toContain("required extension: .png");
      expect(result.failure).toContain("; target:");
      expect(result.failure).toContain("; failed at:");
      if (branch === "map-page") {
        expect(result.failure).toContain(
          "map:1/event:1 Map001.json.events[1].pages[0].image.characterName",
        );
        expect(result.failure).toContain("Map001.json.events[1].pages[1].image.characterName");
        expect(result.failure).toContain("DSL: pages[0]");
        expect(result.failure).toContain("2 affected use(s)");
      } else if (branch === "nested-body") {
        expect(result.failure).toContain("CommonEvents.json[10].list[1].parameters[1]");
        expect(result.failure).toContain("DSL: commands[0].body.commands[0]");
        expect(result.failure).toContain("Animations.json[1].animation1Name");
        expect(result.failure).toContain("1 affected use(s)");
      } else {
        expect(result.failure).toContain(
          "CommonEvents.json[10].list[0].parameters[1].list[0].parameters[0]",
        );
        expect(result.failure).toContain(
          "related: CommonEvents.json[10].list[1].parameters[0].parameters[0]",
        );
        expect(result.failure).toContain("DSL: commands[0]");
        expect(result.failure).toContain("1 affected use(s)");
      }
      expect(await state(root)).toEqual(before);
      const cli = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      expect(cli.exitCode).toBe(1);
      expect(cli.stderr).toContain("DSL:");
      recordAssetInput({ actualApi: result, actualCli: cli });
    });
  });

for (const branch of [
  "cli-error",
  "cli-warning",
  "cli-exception",
  "cli-dynamic",
  "cli-cycle-relations",
  "cli-unchecked-warning",
  "cli-query-failure",
] as const)
  it(`AV.D10.${branch}.native.case.expected: actual CLI preserves its effective exit decision findings origins chains reasons and unchecked coverage`, async () => {
    await withWindowsSandbox(`asset-cli-policy-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const value = fixture(
        branch === "cli-warning" || branch === "cli-unchecked-warning" ? "candidate" : "ordinary",
        "direct-formal",
        branch === "cli-unchecked-warning" ? "Unsafe#Image" : "Poster",
      );
      let source = value.source;
      if (branch === "cli-dynamic")
        source =
          imports +
          'export const variable=variableDefinition({id:1,name:"Runtime map"});' +
          common("rawDslCommand({code:201,parameters:[1,1,1,1,0,0]})");
      if (branch === "cli-cycle-relations")
        source =
          imports +
          common("callCommonEvent({commonEvent:commonEventRef({id:11})})") +
          common("callCommonEvent({commonEvent:commonEventRef({id:10})})", 11);
      await prepare(root, source, value.project);
      if (!["cli-dynamic", "cli-cycle-relations", "cli-unchecked-warning"].includes(branch))
        await fact(root, value, branch === "cli-query-failure" ? "present" : "missing");
      if (branch === "cli-exception") await configuration(root, [exception]);
      const before = await state(root);
      let result;
      if (branch === "cli-query-failure") {
        const child = startWorkspaceOperation(sandbox, {
          operation: "check",
          mode: "cli",
          boundary: "asset-io-failure",
        });
        try {
          expect((await child.ended).exitCode).toBe(1);
          result = sandbox.processes.at(-1)!;
        } finally {
          await child.stop();
        }
      } else result = await runCli(sandbox, ["compile", "--check"], { allowFailure: true });
      const error = branch === "cli-error" || branch === "cli-query-failure";
      expect(result.exitCode).toBe(error ? 1 : 0);
      if (branch === "cli-dynamic") {
        expect(result.stderr).toContain("info MV-ASSET-DYNAMIC-STOP");
        expect(result.stderr).toContain("CommonEvents.json[10].list[0].parameters[1]");
        expect(result.stderr).toContain("Coverage: incomplete");
      } else if (branch === "cli-cycle-relations") {
        expect(result.stderr).toContain(
          "commonEvent:10 CommonEvents.json[10].list[0].parameters[0] -> commonEvent:11",
        );
        expect(result.stderr).toContain(
          "commonEvent:11 CommonEvents.json[11].list[0].parameters[0] -> commonEvent:10",
        );
        expect(result.stderr).not.toContain("MV-ASSET-DYNAMIC-STOP");
        expect(result.stderr).not.toMatch(/cycle (?:error|warning|stopped)/iu);
      } else {
        const code =
          branch === "cli-query-failure"
            ? "MV-ASSET-QUERY-FAILED"
            : branch === "cli-unchecked-warning"
              ? "MV-ASSET-UNSUPPORTED-NAME"
              : "MV-ASSET-MISSING-FILE";
        expect(result.stderr).toContain(`${error ? "error" : "warning"} ${code}`);
        expect(result.stderr).toContain("CommonEvents.json[10].list[0].parameters[");
        if (branch === "cli-exception") {
          expect(result.stderr).toContain("exception reason: Awaiting artwork");
          expect(result.stderr).toContain("base: error; effective: warning");
        }
        if (branch === "cli-warning" || branch === "cli-unchecked-warning") {
          expect(result.stderr).toContain("Actors.json[1].characterName");
          expect(result.stderr).toContain("candidate: Actor initial");
        }
        expect(result.stderr).toContain(
          branch === "cli-query-failure" || branch === "cli-unchecked-warning"
            ? "Coverage: incomplete"
            : "Coverage: complete",
        );
      }
      expect(await state(root)).toEqual(before);
      recordAssetInput({ actualCli: result, independentlyExpectedExit: error ? 1 : 0 });
    });
  });

it("AV.W14.exception-change.api.case.expected: changing a reasoned asset policy makes generated data stale and a passing Check cannot upgrade the old compilation basis", async () => {
  await withWindowsSandbox("asset-exception-freshness", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root);
    await mkdir(join(root, "Game/img/pictures"), { recursive: true });
    await configuration(root, [exception]);
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
    const oldManifest = await readFile(
      join(root, ".rpgmaker-event-dsl/sync-manifest.json"),
      "utf8",
    );
    expect(JSON.parse(oldManifest).compileBaseline.config.assetCheckExceptions).toEqual([
      exception,
    ]);
    await configuration(root, [{ ...exception, reason: "A newly reviewed policy" }]);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(false);
    const before = await state(root);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    expect(await state(root)).toEqual(before);
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(false);
    await expect(
      api.pushWorkspace({ workspaceRoot: root, allowDestructive: false }),
    ).rejects.toThrow(/stale|fresh|compile/iu);
    expect(await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8")).toBe(
      oldManifest,
    );
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
    expect((await state(root)).project).toEqual(before.project);
    recordAssetInput({
      oldManifest,
      changedPolicy:
        "reason alone is part of the compile policy; Check leaves original Manifest and generated bytes untouched",
    });
  });
});

it("AV.D04.default-policy.native.case.expected: new initialization writes an empty exact policy and omitted live policy has identical baseline semantics", async () => {
  await withWindowsSandbox("asset-policy-default", async (sandbox) => {
    const root = sandbox.workspaceRoot;
    await prepare(root, imports + common(""));
    const path = join(root, configName);
    const config = JSON.parse(await readFile(path, "utf8"));
    expect(config.assetCheckExceptions).toEqual([]);
    await api.compileWorkspace({ workspaceRoot: root, check: false });
    const manifest = await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8");
    delete config.assetCheckExceptions;
    await writeFile(path, JSON.stringify(config));
    expect(await api.isGeneratedProjectDataFresh({ workspaceRoot: root })).toBe(true);
    await api.compileWorkspace({ workspaceRoot: root, check: true });
    expect(await readFile(join(root, ".rpgmaker-event-dsl/sync-manifest.json"), "utf8")).toBe(
      manifest,
    );
    expect(JSON.parse(await readFile(path, "utf8"))).not.toHaveProperty("assetCheckExceptions");
    recordAssetInput({
      supplementaryScope:
        "Init and semantic omitted/empty live defaults; distinct from historical evidence parsing",
      manifest,
      config,
    });
  });
});

it("AV.D04.historical-policy-schema.native.case.expected: understood historical Manifest and pending evidence retain omitted policy keys and their independently frozen original hashes", async () => {
  const fixture = JSON.parse(
    await readFile(
      new URL("./fixtures/asset-legacy-policy-evidence.json", import.meta.url),
      "utf8",
    ),
  );
  function ordered(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(ordered);
    if (value !== null && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, entry]) => [key, ordered(entry)]),
      );
    return value;
  }
  for (const historical of fixture.fixtures) {
    const parsed = syncManifestSchema.parse(historical.originalManifest);
    const pending = pendingPushSchema.parse(historical.pending);
    expect(parsed).toEqual(historical.originalManifest);
    expect(pending).toEqual(historical.pending);
    expect(parsed.compileBaseline!.config).not.toHaveProperty("assetCheckExceptions");
    expect(pending.originalManifest.compileBaseline!.config).not.toHaveProperty(
      "assetCheckExceptions",
    );
    const baseline = parsed.compileBaseline!;
    const hash = baseline.hash;
    const basis = {
      ...(baseline.compileContractVersion === undefined
        ? {}
        : { compileContractVersion: baseline.compileContractVersion }),
      ...(baseline.typeInputs === undefined ? {} : { typeInputs: baseline.typeInputs }),
      projectRootBinding: baseline.projectRootBinding,
      config: baseline.config,
      snapshotFiles: baseline.snapshotFiles,
      sourceFiles: baseline.sourceFiles,
    };
    expect(hash).toBe(
      historical.kind === "pre-policy"
        ? "5e62281ef4c20b94d77e77a1479918f32bbbe764b122e9415975f9a4796f8344"
        : "695252a481561b89898cf6d893a0316e96d86dbb6fbd721f3808dc113178689e",
    );
    expect(hashUtf8Content(writeStableJson(basis))).toBe(historical.expectedBaselineHash);
    expect(hashUtf8Content(writeStableJson(ordered(pending.originalManifest)))).toBe(
      historical.expectedOriginalManifestHash,
    );
    expect(pending.originalManifestHash).toBe(
      historical.kind === "pre-policy"
        ? "976596190c428df4b3c34ba289ea0f0c60a165fb2911360f946440dbc0a905e1"
        : "6678fffae8723e85a831f4a3443365326854ba69ba30306bc7dba4f4605b55a9",
    );
    const wronglyNormalized = { ...basis, config: { ...basis.config, assetCheckExceptions: [] } };
    expect(hashUtf8Content(writeStableJson(wronglyNormalized))).not.toBe(
      historical.expectedBaselineHash,
    );
    if (historical.kind === "pre-contract") {
      expect(parsed.compileBaseline).not.toHaveProperty("compileContractVersion");
      expect(parsed.compileBaseline).not.toHaveProperty("typeInputs");
    }
    const currentShape = structuredClone(historical.pending);
    currentShape.originalManifest.compileBaseline.config.assetCheckExceptions = [exception];
    expect(
      pendingPushSchema.parse(currentShape).originalManifest.compileBaseline!.config
        .assetCheckExceptions,
    ).toEqual([exception]);
  }
  recordAssetInput({
    supplementaryScope:
      "Strict understood formats and original structural/hash preservation only; runtime recovery belongs to 16, no W16 ID registered",
    frozenHistoricalFixture: fixture,
  });
});
