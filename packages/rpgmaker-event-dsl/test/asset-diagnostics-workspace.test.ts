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
    expect(result.output).toContain("frame 7");
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
      expect(result.failure).toContain(
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
  it(`AV.D05.${branch}.native.case.expected: ineffective exceptions are located only when complete relevant checking establishes that no error was downgraded`, async () => {
    await withWindowsSandbox(`asset-ineffective-${branch}`, async (sandbox) => {
      const root = sandbox.workspaceRoot;
      const value = fixture(
        branch === "warning-only" ? "candidate" : "ordinary",
        branch === "incomplete" ? "indirect-formal" : "direct-formal",
        branch === "incomplete" ? 42 : "Poster",
      );
      await prepare(root, branch === "unused" ? imports + common("") : value.source, value.project);
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
      if (branch === "warning-only")
        expect(result.output).toContain("base: warning; effective: warning");
      expect(await state(root)).toEqual(before);
      recordAssetInput({ actualApi: result });
    });
  });
