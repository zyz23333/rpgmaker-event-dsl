import fs from "node:fs/promises";
import fsSync from "node:fs";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { basename, dirname, resolve, sep } from "node:path";

// T1 system-boundary control: pause one real filesystem operation in a real child.
// Product modules have no test flags or orchestration API.
const options = JSON.parse(process.env.MV_OPERATION_CHILD);
const readFile = fs.readFile;
const rename = fs.rename;
const writeFile = fs.writeFile;
const link = fs.link;
const rm = fs.rm;
const mkdtemp = fs.mkdtemp;
const readdir = fs.readdir;
const lstat = fs.lstat;
const realpath = fs.realpath;
const open = fs.open;
const openSync = fsSync.openSync;
const readFileSync = fsSync.readFileSync;
const spawn = childProcess.spawn;
const reached = new Set();
let inputReads = 0;
let snapshotCaptured = false;
let assetPassEntered = false;
function mediaPath(path) {
  const absolute = resolve(String(path));
  return ["img", "audio", "movies"].some((folder) => {
    const root = resolve(options.projectRoot ?? options.workspaceRoot, folder);
    return absolute === root || absolute.startsWith(root + sep);
  });
}
function observeMediaQuery(path) {
  if (!options.observeAssets || !mediaPath(path)) return;
  process.send({ kind: "asset-query", path: resolve(String(path)) });
  if (options.boundary === "asset-no-media-query")
    throw controlledAssetError("EACCES", "unexpected media query", path);
}
async function checkpoint(kind = "checkpoint") {
  if (reached.has(kind)) return;
  reached.add(kind);
  process.send({ kind, pid: process.pid });
  await new Promise((release) => {
    function receive(message) {
      if (message === "release") {
        process.off("message", receive);
        release();
      }
      if (message === "crash") {
        queueMicrotask(() => {
          throw new Error("Controlled abrupt Workspace owner crash");
        });
      }
    }
    process.on("message", receive);
  });
}
function controlledAssetError(code, action, path) {
  return Object.assign(new Error(`Controlled asset ${action}: ${String(path)}`), { code });
}
function guardAssetRead(path) {
  if (options.observeAssets && mediaPath(path)) {
    process.send({ kind: "asset-content-read-attempt", path: resolve(String(path)) });
    throw controlledAssetError("EACCES", "content read forbidden", path);
  }
  if (
    options.boundary === "asset-media-read-denied" &&
    resolve(String(path)) === options.assetPath
  ) {
    process.send({ kind: "asset-content-read-attempt" });
    throw controlledAssetError("EACCES", "content read denied", path);
  }
}
function guardAssetLink(path, allowLinkMetadata = false) {
  const absolute = resolve(String(path));
  if (
    options.boundary === "asset-link-guard" &&
    (absolute.startsWith(options.assetPath + sep) ||
      (!allowLinkMetadata && absolute === options.assetPath))
  ) {
    process.send({ kind: "asset-link-follow-attempt", path: absolute });
    throw controlledAssetError("EACCES", "link descent forbidden", path);
  }
}
fs.readdir = async function (path, ...args) {
  observeMediaQuery(path);
  if (options.assetFault === "enumeration" && resolve(String(path)) === dirname(options.assetPath))
    throw controlledAssetError("EACCES", "workflow enumeration denied", path);
  guardAssetLink(path);
  if (
    options.boundary === "asset-enumeration-denied" &&
    resolve(String(path)) === options.assetPath &&
    !reached.has("asset-fault")
  ) {
    reached.add("asset-fault");
    throw controlledAssetError("EACCES", "enumeration denied", path);
  }
  const entries = await readdir(path, ...args);
  if (
    options.boundary === "asset-after-enumeration" &&
    resolve(String(path)) === dirname(options.assetPath) &&
    entries.some(
      (entry) => (typeof entry === "string" ? entry : entry.name) === basename(options.assetPath),
    )
  )
    await checkpoint();
  return entries;
};
fs.lstat = async function (path, ...args) {
  observeMediaQuery(path);
  guardAssetLink(path, true);
  if (resolve(String(path)) === options.assetPath) {
    if (options.boundary === "asset-metadata-denied")
      throw controlledAssetError("EACCES", "metadata denied", path);
    if (options.boundary === "asset-io-failure")
      throw controlledAssetError("EIO", "metadata I/O failure", path);
  }
  return lstat(path, ...args);
};
fs.realpath = async function (path, ...args) {
  if (
    snapshotCaptured &&
    !assetPassEntered &&
    resolve(String(path)) === options.projectRoot &&
    ["asset-before-pass", "asset-after-check-pass"].includes(options.boundary)
  ) {
    if (options.boundary === "asset-before-pass") await checkpoint();
    assetPassEntered = true;
    process.send({ kind: "asset-pass-entered" });
  }
  observeMediaQuery(path);
  guardAssetLink(path);
  return realpath(path, ...args);
};
fs.open = async function (path, ...args) {
  guardAssetRead(path);
  guardAssetLink(path);
  return open(path, ...args);
};
fsSync.openSync = function (path, ...args) {
  guardAssetRead(path);
  guardAssetLink(path);
  return openSync(path, ...args);
};
fsSync.readFileSync = function (path, ...args) {
  guardAssetRead(path);
  guardAssetLink(path);
  return readFileSync(path, ...args);
};
fs.readFile = async function (path, ...args) {
  guardAssetRead(path);
  guardAssetLink(path);
  if (options.boundary === "config" && resolve(String(path)) === options.configPath) {
    await checkpoint();
  }
  if (
    options.boundary === "asset-after-check-pass" &&
    assetPassEntered &&
    resolve(String(path)) === resolve(options.snapshotPath, "MapInfos.json")
  )
    await checkpoint();
  const content = await readFile(path, ...args);
  if (resolve(String(path)) === resolve(options.snapshotPath, "MapInfos.json"))
    snapshotCaptured = true;
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
    if (options.operation === "push")
      operationOptions.allowDestructive = options.allowDestructive ?? false;
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
