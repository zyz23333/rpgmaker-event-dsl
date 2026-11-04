import { mkdir, readFile, readdir, lstat, readlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { createMinimalProject, type WindowsSandbox } from "./windows-sandbox.js";
import { startWorkspaceOperation, workspaceApiEntry } from "./workspace-operation-process.js";
export const pushApi: typeof import("../../src/workspace-api.js") = await import(workspaceApiEntry);
export const pushSourceName = "src/push.events.ts";
export const pushPicturePath = "Game/img/pictures/PushPoster.png";
export const pushImports =
  'import {commonEvent,mapEvent,troopEvent,showPicture,imageAsset,callCommonEvent,commonEventRef,forceAction,actorRef,skillRef,showAnimation,animationRef} from "rpgmaker-event-dsl";\n';
export const pushPicture =
  'showPicture({pictureId:1,image:imageAsset({folder:"pictures",name:"PushPoster"}),origin:"upperLeft",position:{kind:"direct",x:0,y:0},scaleX:100,scaleY:100,opacity:255,blendMode:"normal"})';
export const pushDirectSource =
  pushImports +
  `export const event=commonEvent({id:10,name:"Push workflow",trigger:"none",commands:[${pushPicture}]});`;
export async function pushTree(root: string): Promise<Record<string, string> | null> {
  const result: Record<string, string> = {};
  async function visit(path: string, prefix: string) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const absolute = join(path, entry.name),
        key = prefix + entry.name;
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
export async function observePush(root: string) {
  return {
    config: await readFile(join(root, "rpgmaker-event-dsl.config.json"), "utf8"),
    source: await pushTree(join(root, "src")),
    types: await pushTree(join(root, "types")),
    dependency: await readFile(join(root, "node_modules/rpgmaker-event-dsl/package.json"), "utf8"),
    publicTypes: await readFile(
      join(
        root,
        "node_modules/rpgmaker-event-dsl",
        process.env.MV_CLI_ENTRY === "built" ? "dist/index.d.mts" : "src/index.ts",
      ),
      "utf8",
    ),
    package: await readFile(join(root, "package.json"), "utf8"),
    project: await pushTree(join(root, "Game")),
    state: await pushTree(join(root, ".rpgmaker-event-dsl")),
  };
}
export async function putPushFile(root: string, path = pushPicturePath, content = "") {
  await mkdir(join(root, path, ".."), { recursive: true });
  await writeFile(join(root, path), content);
}
export async function preparePush(
  sandbox: WindowsSandbox,
  options: {
    source?: string;
    project?: Record<string, unknown>;
    exceptions?: unknown[];
  } = {},
) {
  const root = sandbox.workspaceRoot;
  await createMinimalProject(root);
  const project = {
    "CommonEvents.json": [null],
    "System.json": {
      gameTitle: "Push fixture",
      switches: [""],
      variables: [""],
      fixtureOrigin: { retainedNull: null, retainedArray: [] },
    },
    "MapInfos.json": [null, { id: 1, name: "Push Map" }],
    "Map001.json": {
      id: 1,
      width: 1,
      height: 1,
      tilesetId: 1,
      events: [null],
      custom: { preserved: ["opaque", null] },
    },
    ...options.project,
  };
  for (const [file, value] of Object.entries(project))
    await writeFile(join(root, "Game/data", file), JSON.stringify(value));
  await pushApi.initWorkspace({ workspaceRoot: root, projectRoot: "./Game" });
  await pushApi.cloneWorkspace({ workspaceRoot: root });
  await mkdir(join(root, "types"), { recursive: true });
  await writeFile(
    join(root, "types/push-input.ts"),
    'export type PushInput = {readonly proof:"captured"};\n',
  );
  const source =
    'import type {PushInput} from "../types/push-input.js";\n' +
    (options.source ?? pushDirectSource);
  await writeFile(join(root, pushSourceName), source);
  if (options.exceptions) {
    const path = join(root, "rpgmaker-event-dsl.config.json"),
      config = JSON.parse(await readFile(path, "utf8"));
    config.assetCheckExceptions = options.exceptions;
    await writeFile(path, JSON.stringify(config));
  }
  await putPushFile(root);
}
export async function runPushOperation(
  sandbox: WindowsSandbox,
  input: Parameters<typeof startWorkspaceOperation>[1],
) {
  const operation = startWorkspaceOperation(sandbox, input),
    ended = await operation.ended,
    record = sandbox.processes.at(-1)!;
  return {
    ...ended,
    stdout: record.stdout,
    stderr: record.stderr,
    message: operation.messages.find((m) => m.kind === "result")?.message ?? "",
    messages: operation.messages,
  };
}
export async function controlledPush(
  sandbox: WindowsSandbox,
  input: Omit<Parameters<typeof startWorkspaceOperation>[1], "operation">,
  mutation?: () => Promise<void>,
) {
  const operation = startWorkspaceOperation(sandbox, {
    operation: "push",
    observeAssets: true,
    assetPath: "img/pictures/PushPoster.png",
    ...input,
  });
  try {
    if (mutation) {
      await operation.waitFor("checkpoint");
      await mutation();
      operation.send("release");
    }
    const ended = await operation.ended,
      record = sandbox.processes.at(-1)!;
    const result = {
      ...ended,
      stdout: record.stdout,
      stderr: record.stderr,
      message: operation.messages.find((m) => m.kind === "result")?.message ?? "",
      messages: operation.messages,
    };
    return result;
  } finally {
    await operation.stop();
  }
}
export async function observedEvaluationPush(sandbox: WindowsSandbox) {
  const reportPath = join(sandbox.root, "w20-inspector.json"),
    startedAt = new Date().toISOString();
  const arguments_ = [
    "--import",
    import.meta.resolve("tsx"),
    fileURLToPath(new URL("./asset-evaluation-child.mjs", import.meta.url)),
    sandbox.workspaceRoot,
    workspaceApiEntry,
    reportPath,
  ];
  const result = await new Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>((done) => {
    execFile(
      process.execPath,
      arguments_,
      { cwd: sandbox.workspaceRoot, windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) =>
        done({ exitCode: error ? Number(error.code) || 1 : 0, stdout, stderr }),
    );
  });
  const processRecord = {
    command: process.execPath,
    arguments: arguments_,
    cwd: sandbox.workspaceRoot,
    startedAt,
    completedAt: new Date().toISOString(),
    signal: null,
    ...result,
  };
  sandbox.processes.push(processRecord);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  return { ...result, report };
}
