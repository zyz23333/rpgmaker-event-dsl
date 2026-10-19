import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { WindowsSandbox } from "./windows-sandbox.js";

export type WorkspaceOperation =
  | "clone"
  | "pull"
  | "decompile"
  | "compile"
  | "check"
  | "diff"
  | "push"
  | "fresh";
type Message = { kind: string; ok?: boolean; message?: string; pid?: number };

export const workspaceApiEntry = new URL(
  process.env.MV_CLI_ENTRY === "built"
    ? "../../dist/workspace-api.mjs"
    : "../../src/workspace-api.ts",
  import.meta.url,
).href;

export function startWorkspaceOperation(
  sandbox: WindowsSandbox,
  input: {
    operation: WorkspaceOperation;
    mode?: "api" | "cli";
    boundary?:
      | "config"
      | "snapshot-publication"
      | "before-project-write"
      | "snapshot-capture"
      | "snapshot-manifest-failure"
      | "input-validation"
      | "compile-manifest"
      | "generated-write-failure"
      | "generated-installation-failure"
      | "decompile-stage"
      | "before-decompile-move"
      | "after-decompile-move"
      | "decompile-write-failure"
      | "decompile-move-unavailable";
    captureFile?: string;
    barrier?: boolean;
  },
) {
  const helperUrl = new URL("./workspace-operation-child.mjs", import.meta.url);
  const helper = fileURLToPath(helperUrl);
  const mode = input.mode ?? "api";
  const startedAt = new Date().toISOString();
  const commands = input.operation === "check" ? ["compile", "--check"] : [input.operation];
  const arguments_ = [
    "--import",
    import.meta.resolve("tsx"),
    ...(mode === "cli" ? ["--import", helperUrl.href, sandbox.cliEntry, ...commands] : [helper]),
  ];
  const child = spawn(process.execPath, arguments_, {
    cwd: sandbox.workspaceRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    env: {
      ...process.env,
      MV_OPERATION_CHILD: JSON.stringify({
        ...input,
        mode,
        workspaceRoot: sandbox.workspaceRoot,
        apiEntry: workspaceApiEntry,
        configPath: resolve(sandbox.workspaceRoot, "rpgmaker-event-dsl.config.json"),
        snapshotPath: resolve(
          sandbox.workspaceRoot,
          ".rpgmaker-event-dsl",
          "project-data-snapshot",
        ),
        manifestPath: resolve(sandbox.workspaceRoot, ".rpgmaker-event-dsl", "sync-manifest.json"),
        generatedPath: resolve(
          sandbox.workspaceRoot,
          ".rpgmaker-event-dsl",
          "generated-project-data",
        ),
        inputPath: resolve(
          sandbox.workspaceRoot,
          ".rpgmaker-event-dsl",
          "project-data-snapshot",
          "Actors.json",
        ),
        projectFile: resolve(sandbox.workspaceRoot, "Game", "data", "CommonEvents.json"),
        capturePath: resolve(
          sandbox.workspaceRoot,
          "Game",
          "data",
          input.captureFile ?? "Actors.json",
        ),
      }),
    },
  });
  let stdout = "";
  let stderr = "";
  let exited = false;
  const messages: Message[] = [];
  child.stdout!.on("data", (data) => {
    stdout += data;
  });
  child.stderr!.on("data", (data) => {
    stderr += data;
  });
  child.on("message", (message) => messages.push(message as Message));
  const ended = new Promise<{ exitCode: number | null; signal: string | null }>((done) => {
    child.once("exit", (exitCode, signal) => {
      exited = true;
      sandbox.processes.push({
        command: process.execPath,
        arguments: arguments_,
        cwd: sandbox.workspaceRoot,
        startedAt,
        completedAt: new Date().toISOString(),
        exitCode,
        signal,
        stdout,
        stderr,
        ipcMessages: messages,
      });
      done({ exitCode, signal });
    });
  });
  async function waitFor(kinds: string | string[]): Promise<Message> {
    const requested = typeof kinds === "string" ? [kinds] : kinds;
    const existing = messages.find(({ kind }) => requested.includes(kind));
    if (existing !== undefined) return existing;
    if (exited) throw new Error(`Child exited before ${requested}: ${stderr}`);
    return new Promise((done, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Child deadline before ${requested}: ${stderr}`));
      }, 10_000);
      function cleanup() {
        clearTimeout(timer);
        child.off("message", receive);
        child.off("exit", prematureExit);
        child.off("error", failed);
      }
      function receive(message: unknown) {
        const value = message as Message;
        if (requested.includes(value.kind)) {
          cleanup();
          done(value);
        }
      }
      function prematureExit() {
        cleanup();
        reject(new Error(`Child exited before ${requested}: ${stderr}`));
      }
      function failed(error: Error) {
        cleanup();
        reject(error);
      }
      child.on("message", receive);
      child.once("exit", prematureExit);
      child.once("error", failed);
    });
  }
  return {
    child,
    ended,
    waitFor,
    messages,
    send(message: string) {
      child.send(message);
    },
    async stop(signal: "SIGKILL" | "SIGTERM" = "SIGKILL") {
      if (!exited) child.kill(signal);
      await ended;
    },
  };
}
