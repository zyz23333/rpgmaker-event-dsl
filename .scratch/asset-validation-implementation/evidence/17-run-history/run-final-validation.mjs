import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, copyFile, writeFile } from "node:fs/promises";
import { arch, release, tmpdir } from "node:os";
import { resolve, join } from "node:path";

const root = resolve(process.cwd());
const out = join(root, ".scratch/asset-validation-implementation/evidence/17-raw");
await mkdir(out, { recursive: true });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const evidence = {
  schema: "asset-validation-final-command-history/v2",
  frozenRevision: git("rev-parse", "HEAD"),
  initialStatus: git("status", "--porcelain"),
  environment: {
    platform: process.platform, architecture: arch(), osRelease: release(),
    node: process.version, nodeExecutable: process.execPath, temp: tmpdir(),
    TEMP: process.env.TEMP, TMP: process.env.TMP,
    pnpm: execFileSync("cmd.exe", ["/d", "/s", "/c", "pnpm --version"], { encoding: "utf8" }).trim(),
    workerOverride: null,
    entryOverride: process.env.MV_CLI_ENTRY ?? null,
  },
  commands: [],
};
if (process.versions.node.split(".")[0] !== "22") throw new Error("Node22 is required");
if (!/^[Cc]:[\\/]/u.test(tmpdir())) throw new Error("Default C TEMP is required");
if (process.env.MV_CLI_ENTRY) throw new Error("No global entry override is permitted");
if (evidence.initialStatus !== "") throw new Error("The execution freeze must start clean");
const protectedPaths = ["packages/rpgmaker-event-dsl/src", "packages/rpgmaker-event-dsl/test",
  "packages/rpgmaker-event-dsl/package.json", "packages/rpgmaker-event-dsl/vitest.config.ts",
  "packages/rpgmaker-event-dsl/vitest.windows.config.ts", "package.json", "pnpm-lock.yaml",
  "pnpm-workspace.yaml", "tsconfig.json"];
evidence.compileContractVersion = (await readFile(join(root, "packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts"), "utf8")).match(/compileContractVersion = "([^"]+)"/u)?.[1];
evidence.frozenInputs = await Promise.all(git("ls-files", "--", ...protectedPaths).split("\n").filter(Boolean).map(async (path) => {
  const bytes = await readFile(join(root, path));
  return { path, bytes: bytes.length, sha256: sha(bytes) };
}));

async function buildArtifacts() {
  const result = [];
  async function visit(directory, prefix) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const path = join(directory, entry.name), relative = prefix + entry.name;
      if (entry.isDirectory()) await visit(path, relative + "/");
      else { const bytes = await readFile(path); result.push({ path: relative, bytes: bytes.length, sha256: sha(bytes) }); }
    }
  }
  await visit(join(root, "packages/rpgmaker-event-dsl/dist"), "packages/rpgmaker-event-dsl/dist/");
  return result;
}

async function snapshotReceipts(entry, command) {
  const source = join(root, "test-results/asset-validation");
  const target = join(out, `current-${entry}-receipts`);
  await mkdir(target, { recursive: true });
  const files = (await readdir(source)).filter((name) => name.endsWith(`.${entry}.json`)).sort();
  const result = [];
  for (const name of files) {
    const bytes = await readFile(join(source, name));
    const row = JSON.parse(bytes.toString("utf8"));
    if (row.startedAt < command.startedAt || row.completedAt > command.completedAt) {
      throw new Error(`Stale/outside command receipt: ${name}`);
    }
    await copyFile(join(source, name), join(target, name));
    result.push({ file: `current-${entry}-receipts/${name}`, bytes: bytes.length,
      sha256: sha(bytes), id: row.id, entry: row.entry, status: row.status,
      ownerTicket: row.ownerTicket, assertionSource: row.expected.assertionsSource,
      assertionSourceSha256: row.expected.sha256,
      startedAt: row.startedAt, completedAt: row.completedAt });
  }
  return result;
}

async function run(command, label, entry) {
  if (git("rev-parse", "HEAD") !== evidence.frozenRevision) throw new Error("Execution HEAD changed");
  execFileSync("git", ["diff", "--quiet", evidence.frozenRevision, "--", ...protectedPaths], { cwd: root });
  const row = { command, label, startedAt: new Date().toISOString() };
  const chunks = [];
  console.log(`START ${label}: ${command}`);
  const child = spawn("cmd.exe", ["/d", "/s", "/c", command], { cwd: root, env: process.env, windowsHide: true });
  row.ownedCommandPid = child.pid;
  child.stdout.on("data", (bytes) => { chunks.push(bytes); process.stdout.write(bytes); });
  child.stderr.on("data", (bytes) => { chunks.push(bytes); process.stderr.write(bytes); });
  row.exitCode = await new Promise((accept, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => { row.signal = signal; accept(code); });
  });
  row.completedAt = new Date().toISOString();
  const bytes = Buffer.concat(chunks);
  row.log = `${label}.log`;
  row.logBytes = bytes.length;
  row.logSha256 = sha(bytes);
  await writeFile(join(out, row.log), bytes);
  if (entry) row.receipts = await snapshotReceipts(entry, row);
  if (command === "pnpm build" && row.exitCode === 0) row.builtArtifacts = await buildArtifacts();
  evidence.commands.push(row);
  await writeFile(join(out, "command-history.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`COMPLETE ${label}: exit=${row.exitCode}, receipts=${row.receipts?.length ?? 0}`);
  if (row.exitCode !== 0) throw new Error(`${command} failed: ${row.exitCode}`);
}

await run("pnpm build", "00-setup-build");
await run("pnpm check", "01-pnpm-check", "source");
await run("pnpm build", "02-pnpm-build");
await run("pnpm --filter rpgmaker-event-dsl test:windows-baseline", "03-windows-baseline", "built");
