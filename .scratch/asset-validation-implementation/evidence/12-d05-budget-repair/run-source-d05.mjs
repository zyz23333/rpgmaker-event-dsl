import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { arch, release, tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../../../..");
const raw = join(evidence, "raw/green");
mkdirSync(raw, { recursive: true });
const node = "M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe";
const pnpm = "F:/Javascript/nodejs/node_modules/corepack/dist/pnpm.js";
const env = { ...process.env, PATH: `${dirname(node)}${delimiter}${process.env.PATH}` };
assert.equal(process.version, "v22.23.4");
assert.equal(process.platform, "win32");
assert.ok(/^C:[/\\]/iu.test(tmpdir()), `Expected default C TEMP: ${tmpdir()}`);
assert.equal(process.env.MV_CLI_ENTRY, undefined, "Use the default source entry without an entry override");
const git = (...args) => execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024 });
const frozenRevision = git("rev-parse", "HEAD").toString().trim();
assert.equal(git("status", "--porcelain").toString().trim(), "", "Freeze all authored files before execution");
const plan = [
  ["01-typecheck", ["typecheck"]],
  ["02-lint", ["lint"]],
  ["03-format-check", ["format:check"]],
  ["04-source-d05", ["--filter", "rpgmaker-event-dsl", "test", "test/asset-diagnostics-workspace.test.ts", "-t", "^AV[.]D05[.]", "--reporter=json", `--outputFile=${join(raw, "source-d05-runner.json")}`]],
];
const history = {
  schemaVersion: 1, frozenRevision, worktree: root, branch: git("branch", "--show-current").toString().trim(),
  environment: { platform: process.platform, node: process.version, execPath: process.execPath, architecture: arch(), osRelease: release(), temp: process.env.TEMP, tmp: process.env.TMP, effectiveTempDirectory: tmpdir(), pnpmVersion: execFileSync(node, [pnpm, "--version"], { cwd: root, env }).toString().trim(), entry: "source (default; MV_CLI_ENTRY absent)", maxWorkers: "2 (unchanged vitest.config.ts; no command override)", globalTestTimeout: "10000 (unchanged vitest.config.ts)", localIncompleteTimeout: 30000, entryOrTempOrWorkerOrGlobalTimeoutOverrides: [] },
  commands: [],
};
const identityFiles = ["packages/rpgmaker-event-dsl/test/asset-diagnostics-workspace.test.ts", "packages/rpgmaker-event-dsl/test/support/asset-evidence.ts", "packages/rpgmaker-event-dsl/vitest.config.ts", "packages/rpgmaker-event-dsl/package.json", "package.json", "pnpm-lock.yaml"];
history.frozenFiles = identityFiles.map((file) => { const bytes = readFileSync(join(root, file)); return { file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }; });
const save = () => writeFileSync(join(raw, "command-history.json"), `${JSON.stringify(history, null, 2)}\n`);
save();
for (const [name, args] of plan) {
  const log = createWriteStream(join(raw, `${name}.log`), { flags: "wx" });
  const record = { name, executable: node, argv: [pnpm, ...args], displayCommand: `pnpm ${args.join(" ")}`, cwd: root, startedAt: new Date().toISOString() };
  history.commands.push(record);
  save();
  console.log(`Started ${record.displayCommand}`);
  const child = spawn(node, [pnpm, ...args], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (bytes) => log.write(bytes));
  const result = await new Promise((accept, reject) => { child.once("error", reject); child.once("exit", (exitCode, signal) => accept({ exitCode, signal })); });
  await new Promise((accept) => log.end(accept));
  Object.assign(record, result, { completedAt: new Date().toISOString() });
  record.durationMs = Date.parse(record.completedAt) - Date.parse(record.startedAt);
  const logBytes = readFileSync(join(raw, `${name}.log`));
  record.log = { file: `raw/green/${name}.log`, bytes: logBytes.length, sha256: createHash("sha256").update(logBytes).digest("hex") };
  save();
  console.log(`Completed ${name}: exit ${result.exitCode}, ${record.durationMs}ms`);
  if (result.exitCode !== 0) process.exit(result.exitCode ?? 1);
}
git("diff", "--exit-code", frozenRevision, "--", "packages", "package.json", "pnpm-lock.yaml");
history.executionCompletedAt = new Date().toISOString();
history.frozenFilesUnchangedAfterExecution = true;
save();
console.log(`Evidence captured at ${raw}`);
