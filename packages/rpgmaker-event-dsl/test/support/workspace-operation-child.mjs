import fs from "node:fs/promises";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";

// T1 system-boundary control: pause one real filesystem operation in a real child.
// Product modules have no test flags or orchestration API.
const options = JSON.parse(process.env.MV_OPERATION_CHILD);
const readFile = fs.readFile;
const rename = fs.rename;
const writeFile = fs.writeFile;
const spawn = childProcess.spawn;
let reached = false;
let inputReads = 0;
async function checkpoint() {
  if (reached) return;
  reached = true;
  process.send({ kind: "checkpoint", pid: process.pid });
  await new Promise((release) => {
    process.on("message", (message) => {
      if (message === "release") release();
      if (message === "crash") {
        queueMicrotask(() => {
          throw new Error("Controlled abrupt Workspace owner crash");
        });
      }
    });
  });
}
fs.readFile = async function (path, ...args) {
  if (options.boundary === "config" && resolve(String(path)) === options.configPath) {
    await checkpoint();
  }
  const content = await readFile(path, ...args);
  if (
    options.boundary === "input-validation" &&
    resolve(String(path)) === options.inputPath &&
    ++inputReads === 2
  ) {
    await checkpoint();
  }
  if (options.boundary === "snapshot-capture" && resolve(String(path)) === options.capturePath) {
    await checkpoint();
  }
  return content;
};
fs.rename = async function (source, target) {
  if (
    options.boundary === "generated-installation-failure" &&
    resolve(String(target)) === options.generatedPath &&
    String(source).includes(".tmp-")
  )
    throw new Error("Controlled generated installation failure");
  if (
    options.boundary === "snapshot-manifest-failure" &&
    resolve(String(target)) === options.manifestPath
  ) {
    throw new Error("Controlled Snapshot manifest publication failure");
  }
  if (
    (options.boundary === "snapshot-publication" &&
      resolve(String(target)) === options.snapshotPath &&
      String(source).includes(".tmp-")) ||
    (options.boundary === "before-project-write" && resolve(String(source)) === options.projectFile)
  ) {
    await checkpoint();
  }
  return rename(source, target);
};
fs.writeFile = async function (path, ...args) {
  if (
    options.boundary === "decompile-write-failure" &&
    String(path).includes("decompile-candidates") &&
    String(path).endsWith(".ts")
  )
    throw new Error("Controlled Decompile candidate write failure");
  if (
    options.boundary === "generated-write-failure" &&
    String(path).includes("generated-project-data.tmp-")
  )
    throw new Error("Controlled generated candidate write failure");
  const result = await writeFile(path, ...args);
  if (
    options.boundary === "decompile-stage" &&
    String(path).includes("decompile-candidates") &&
    String(path).endsWith(".ts")
  )
    await checkpoint();
  if (
    options.boundary === "compile-manifest" &&
    resolve(String(path)).startsWith(`${options.manifestPath}.tmp-`)
  )
    await checkpoint();
  return result;
};
childProcess.spawn = function (...args) {
  if (
    options.boundary === "decompile-move-unavailable" &&
    String(args[0]).toLowerCase() === "powershell.exe"
  )
    args[0] = "mv20-deliberately-unavailable-host.exe";
  const child = spawn(...args);
  if (String(args[0]).toLowerCase() !== "powershell.exe") return child;
  if (options.boundary === "before-decompile-move") {
    const end = child.stdin.end;
    child.stdin.end = function (...endArgs) {
      if (String(endArgs[0]).startsWith("publish")) {
        void checkpoint().then(() => end.apply(this, endArgs));
        return this;
      }
      return end.apply(this, endArgs);
    };
  }
  if (options.boundary === "after-decompile-move") {
    let published = false;
    child.stdout.on("data", (data) => {
      if (String(data).includes("PUBLISHED")) published = true;
    });
    const emit = child.emit;
    child.emit = function (event, ...eventArgs) {
      if (event === "close" && eventArgs[0] === 0 && published) {
        void checkpoint().then(() => emit.call(this, event, ...eventArgs));
        return true;
      }
      return emit.call(this, event, ...eventArgs);
    };
  }
  return child;
};
syncBuiltinESMExports();

if (options.barrier) {
  process.send({ kind: "ready" });
  await new Promise((start) => process.once("message", start));
}

if (options.mode === "api") {
  try {
    const api = await import(options.apiEntry);
    const operationOptions = { workspaceRoot: options.workspaceRoot };
    if (options.operation === "compile") operationOptions.check = false;
    if (options.operation === "check") operationOptions.check = true;
    if (options.operation === "push") operationOptions.allowDestructive = false;
    const names = {
      clone: "cloneWorkspace",
      pull: "pullWorkspace",
      decompile: "decompileWorkspace",
      compile: "compileWorkspace",
      check: "compileWorkspace",
      diff: "diffWorkspace",
      push: "pushWorkspace",
      fresh: "isGeneratedProjectDataFresh",
    };
    const value = await api[names[options.operation]](operationOptions);
    process.send({ kind: "result", ok: true, value });
  } catch (error) {
    process.send({ kind: "result", ok: false, message: error.message });
    process.exitCode = 1;
  }
  process.disconnect();
}
