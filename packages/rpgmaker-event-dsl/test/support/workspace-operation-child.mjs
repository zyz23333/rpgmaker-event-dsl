import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";

// T1 system-boundary control: pause one real filesystem operation in a real child.
// Product modules have no test flags or orchestration API.
const options = JSON.parse(process.env.MV_OPERATION_CHILD);
const readFile = fs.readFile;
const rename = fs.rename;
let reached = false;
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
  return readFile(path, ...args);
};
fs.rename = async function (source, target) {
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
