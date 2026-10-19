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
const link = fs.link;
const rm = fs.rm;
const mkdtemp = fs.mkdtemp;
const spawn = childProcess.spawn;
const reached = new Set();
let inputReads = 0;
async function checkpoint(kind = "checkpoint") {
  if (reached.has(kind)) return;
  reached.add(kind);
  process.send({ kind, pid: process.pid });
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
    options.boundary === "push-pending-capture" &&
    resolve(String(path)) === resolve(options.pendingPath, "pending-push.json")
  )
    await checkpoint();
  if (
    options.boundary === "push-generated-capture" &&
    resolve(String(path)) === options.generatedCapturePath
  )
    await checkpoint();
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
    options.boundary === "push-retirement-failure" &&
    resolve(String(source)) === options.pendingPath
  )
    throw new Error("Controlled pending retirement rename failure");
  if (
    ["push-before-capture", "push-capture-restore"].includes(options.boundary) &&
    resolve(String(source)) === options.capturePath &&
    String(target).replaceAll("\\", "/").includes("/original/")
  )
    await checkpoint();
  if (
    options.boundary === "push-before-install" &&
    String(source).includes("push-staging.tmp-") &&
    resolve(String(target)) === options.capturePath
  )
    await checkpoint();
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
  const result = await rename(source, target);
  if (
    options.boundary === "push-retirement-installed" &&
    resolve(String(source)) === options.pendingPath
  )
    await checkpoint();
  if (
    options.boundary === "push-manifest-installed" &&
    resolve(String(target)) === options.manifestPath
  )
    await checkpoint();
  if (
    options.boundary === "push-snapshot-installed" &&
    resolve(String(target)) === options.snapshotFilePath
  )
    await checkpoint();
  if (options.boundary === "push-prewrite" && resolve(String(target)) === options.pendingPath)
    await checkpoint();
  if (
    options.boundary === "push-after-install" &&
    String(source).includes("push-staging.tmp-") &&
    resolve(String(target)) === options.capturePath
  )
    await checkpoint();
  return result;
};
fs.link = async function (source, target) {
  if (
    options.boundary === "push-capture-restore" &&
    String(source).replaceAll("\\", "/").includes("/original/") &&
    resolve(String(target)) === options.capturePath
  ) {
    await checkpoint("restore");
    if (options.failRestore) throw new Error("Controlled unsupported non-overwriting restoration");
  }
  if (
    options.boundary === "push-before-install" &&
    !String(source).replaceAll("\\", "/").includes("/original/") &&
    resolve(String(target)) === options.capturePath
  ) {
    await checkpoint();
    if (options.failInstall) throw new Error("Controlled unsupported non-overwriting installation");
  }
  const result = await link(source, target);
  if (
    options.boundary === "push-after-install" &&
    !String(source).replaceAll("\\", "/").includes("/original/") &&
    resolve(String(target)) === options.capturePath
  )
    await checkpoint();
  return result;
};
fs.writeFile = async function (path, ...args) {
  if (String(path).startsWith(`${options.snapshotFilePath}.push-`)) {
    if (options.boundary === "push-snapshot-candidate") await checkpoint();
    if (options.boundary === "push-snapshot-failure")
      throw new Error("Controlled Snapshot candidate failure");
  }
  if (
    options.boundary === "decompile-write-failure" &&
    String(path).includes("decompile-candidates") &&
    String(path).endsWith(".ts")
  )
    throw new Error("Controlled Decompile candidate write failure");
  if (
    options.boundary === "generated-write-failure" &&
    String(path).includes("generated-project-data.tmp-") &&
    (!options.captureFile ||
      String(path)
        .replaceAll("\\", "/")
        .endsWith("/" + options.captureFile))
  )
    throw new Error("Controlled generated candidate write failure");
  const result = await writeFile(path, ...args);
  if (
    options.boundary === "push-snapshot-installed" &&
    resolve(String(path)) === options.snapshotFilePath
  )
    await checkpoint();
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
fs.mkdtemp = async function (prefix, ...args) {
  if (
    options.boundary === "push-retirement-directory-failure" &&
    String(prefix).includes("pending-push.retired-")
  )
    throw new Error("Controlled pending retirement directory failure");
  return mkdtemp(prefix, ...args);
};
fs.rm = async function (path, ...args) {
  if (
    options.boundary === "push-retirement-cleanup-failure" &&
    String(path).includes("pending-push.retired-")
  ) {
    await rm(resolve(String(path), "operation/backup/CommonEvents.json"));
    throw new Error("Controlled partial retired cleanup failure");
  }
  return rm(path, ...args);
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
