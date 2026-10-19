import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { arch, release, tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

export type ProcessResult = {
  command: string;
  arguments: string[];
  cwd: string;
  startedAt: string;
  completedAt: string;
  exitCode: number | string | null;
  signal: string | null;
  stdout: string;
  stderr: string;
};

export type WindowsSandbox = {
  root: string;
  workspaceRoot: string;
  cliEntry: string;
  processes: ProcessResult[];
};

export async function withWindowsSandbox(
  label: string,
  body: (sandbox: WindowsSandbox) => Promise<void>,
): Promise<void> {
  if (process.platform !== "win32" || process.versions.node.split(".")[0] !== "22") {
    throw new Error(
      `Windows / Node 22 verification is required; observed ${process.platform} / ${process.version}. This mandatory case cannot be skipped.`,
    );
  }
  const parent = resolve(
    process.env.MV_WINDOWS_TEST_OUTPUT ?? join(tmpdir(), "rpgmaker-event-dsl-windows"),
  );
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, `${label}-`));
  const originalRoot = await realpath(root);
  const sandbox: WindowsSandbox = {
    root,
    workspaceRoot: join(root, "最小 Workspace with spaces"),
    cliEntry: join(
      packageRoot,
      process.env.MV_CLI_ENTRY === "built" ? "dist/cli.mjs" : "src/cli.ts",
    ),
    processes: [],
  };
  await mkdir(sandbox.workspaceRoot);
  let completed = false;
  try {
    await body(sandbox);
    completed = true;
  } finally {
    await writeFile(
      join(root, "process-results.json"),
      `${JSON.stringify(
        {
          environment: {
            platform: process.platform,
            node: process.version,
            architecture: arch(),
            osRelease: release(),
          },
          completed,
          workspaceRoot: sandbox.workspaceRoot,
          cliEntry: sandbox.cliEntry,
          processes: sandbox.processes,
        },
        null,
        2,
      )}\n`,
    );
    if (completed && process.env.MV_KEEP_WINDOWS_SANDBOXES !== "1") {
      await removeOwnedSandbox({ parent, root, originalRoot });
    } else {
      console.error(`Windows verification sandbox retained: ${root}`);
    }
  }
}

async function removeOwnedSandbox(input: { parent: string; root: string; originalRoot: string }) {
  const within = relative(input.parent, input.root);
  if (
    within.length === 0 ||
    isAbsolute(within) ||
    within.startsWith("..") ||
    (await realpath(input.root)) !== input.originalRoot
  ) {
    throw new Error(`Refusing cleanup outside the original Windows sandbox: ${input.root}`);
  }
  await rm(input.root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

export async function createMinimalProject(workspaceRoot: string) {
  const fixture = JSON.parse(
    await readFile(
      new URL("../fixtures/mv-evidence/common-event-project.json", import.meta.url),
      "utf8",
    ),
  );
  const dataRoot = join(workspaceRoot, "Game", "data");
  await mkdir(dataRoot, { recursive: true });
  await writeFile(join(workspaceRoot, "Game", "Game.rpgproject"), "RPGMV 1.6.1\n");
  for (const [name, data] of Object.entries(fixture.projectFiles)) {
    await writeFile(join(dataRoot, name), JSON.stringify(data));
  }
  await writeFile(join(workspaceRoot, "package.json"), '{"type":"module"}\n');
  const fixturePackage = join(workspaceRoot, "node_modules", "rpgmaker-event-dsl");
  const packageDirectory = process.env.MV_CLI_ENTRY === "built" ? "dist" : "src";
  await mkdir(fixturePackage, { recursive: true });
  await writeFile(
    join(fixturePackage, "package.json"),
    JSON.stringify({
      name: "rpgmaker-event-dsl",
      type: "module",
      exports: {
        ".": { types: packageDirectory === "dist" ? "./dist/index.d.mts" : "./src/index.ts" },
      },
    }),
  );
  await symlink(
    join(packageRoot, packageDirectory),
    join(fixturePackage, packageDirectory),
    "junction",
  );
  return fixture;
}

export async function runCli(
  sandbox: WindowsSandbox,
  arguments_: string[],
  options: { allowFailure?: boolean; entry?: string } = {},
): Promise<ProcessResult> {
  const entry = options.entry ?? sandbox.cliEntry;
  const nodeArguments = [
    ...(entry.endsWith(".ts") ? ["--import", import.meta.resolve("tsx")] : []),
    entry,
    ...arguments_,
  ];
  const startedAt = new Date().toISOString();
  const result = await new Promise<ProcessResult>((resolveResult) => {
    execFile(
      process.execPath,
      nodeArguments,
      {
        cwd: sandbox.workspaceRoot,
        encoding: "utf8",
        windowsHide: true,
        timeout: 15_000,
        maxBuffer: 4 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        resolveResult({
          command: process.execPath,
          arguments: nodeArguments,
          cwd: sandbox.workspaceRoot,
          startedAt,
          completedAt: new Date().toISOString(),
          exitCode: error === null ? 0 : (error.code ?? null),
          signal: error?.signal ?? null,
          stdout,
          stderr,
        });
      },
    );
  });
  sandbox.processes.push(result);
  if (result.exitCode !== 0 && options.allowFailure !== true) {
    throw new Error(`CLI failed (${result.exitCode}): ${arguments_.join(" ")}\n${result.stderr}`);
  }
  return result;
}

export async function createCliJunction(sandbox: WindowsSandbox): Promise<string> {
  const alias = join(sandbox.root, "CLI junction alias with spaces");
  await symlink(dirname(sandbox.cliEntry), alias, "junction");
  return join(alias, sandbox.cliEntry.endsWith(".ts") ? "cli.ts" : "cli.mjs");
}
