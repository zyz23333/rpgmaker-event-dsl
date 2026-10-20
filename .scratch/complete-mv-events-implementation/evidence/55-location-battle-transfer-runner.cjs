"use strict";
// Run exactly the affected final public Workspace/native pair. No build or other cases.
const fs = require("node:fs/promises");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const base = "M:/Shuen/Codex/mv-events-implementation-20261020";
const { runPair, files, json, sha } = require(base + "/final-native-pair-support-v1.cjs");
const scenarioModule = require("./55-location-battle-transfer-scenario.cjs");
const git = (cwd, ...args) =>
  cp
    .execFileSync("git", ["-c", "core.longpaths=true", ...args], {
      cwd,
      encoding: "utf8",
      windowsHide: true,
    })
    .trim();
async function fingerprint(directory) {
  const entries = [];
  for (const file of await files(directory))
    entries.push({
      path: path.relative(directory, file).split(path.sep).join("/"),
      sha256: sha(await fs.readFile(file)),
    });
  return { files: entries, sha256: sha(JSON.stringify(entries)) };
}
async function candidateIdentity(manifest) {
  const source = await fingerprint(path.join(manifest.packageRoot, "src"));
  const dist = await fingerprint(path.join(manifest.packageRoot, "dist"));
  assert.deepEqual(source, manifest.source, "Complete released product source membership/bytes");
  assert.deepEqual(dist, manifest.dist, "Complete released built membership/bytes");
  const apiSha256 = sha(
    await fs.readFile(path.join(manifest.packageRoot, "dist/workspace-api.mjs")),
  );
  assert.equal(apiSha256, manifest.workspaceApiSha256);
  const productSourceTree = git(
    manifest.packageRoot,
    "rev-parse",
    "HEAD:packages/rpgmaker-event-dsl/src",
  );
  assert.equal(productSourceTree, manifest.productSourceTree);
  return {
    actualPackageHead: git(manifest.packageRoot, "rev-parse", "HEAD"),
    productSourceTree,
    sourceSha256: source.sha256,
    distSha256: dist.sha256,
    apiSha256,
    completeMembershipAndBytesMatch: true,
  };
}
async function main() {
  assert.equal(process.versions.node.split(".")[0], "22");
  const manifestPath = base + "/final48-candidate.json";
  const manifestBytes = await fs.readFile(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.compileContractVersion, "mv-1.6.1/22");
  const outputRoot = base + "/ticket55-location-supplement/runs";
  await fs.mkdir(outputRoot, { recursive: true });
  const executionRoot = path.join(outputRoot, "execution-" + crypto.randomUUID());
  await fs.mkdir(executionRoot);
  const before = await candidateIdentity(manifest);
  const dependencies = [];
  for (const file of Object.keys(require.cache).sort())
    dependencies.push({ path: file, sha256: sha(await fs.readFile(file)) });
  const binding = {
    startedAt: new Date().toISOString(),
    releasedCandidateCommit: manifest.candidateCommit,
    compileContractVersion: manifest.compileContractVersion,
    candidateManifest: { path: manifestPath, sha256: sha(manifestBytes) },
    sourceRevision: git(__dirname, "rev-parse", "HEAD"),
    sourceGitStatus: git(__dirname, "status", "--short"),
    before,
    dependencies,
    toolNode: {
      path: process.execPath,
      version: process.version,
      sha256: sha(await fs.readFile(process.execPath)),
    },
    native: "pending",
  };
  await json(path.join(executionRoot, "execution-input.json"), binding);
  const scenario = scenarioModule.makeScenario();
  const editSources = scenario.editSources;
  const formalFiles = [];
  scenario.editSources = async (workspace) => {
    const edits = await editSources(workspace);
    for (const file of await files(path.join(workspace, "src"))) {
      if (!file.endsWith(".ts")) continue;
      const source = await fs.readFile(file, "utf8");
      assert.ok(
        !source.includes("rawDslCommand"),
        "Known commands must use formal generated source",
      );
      formalFiles.push({ path: path.relative(workspace, file), sha256: sha(source), formal: true });
    }
    return edits;
  };
  const report = await runPair(
    {
      packageRoot: manifest.packageRoot,
      seedRoot: manifest.seedRoot,
      host: manifest.host,
      outputRoot,
      mode: "native",
      timeoutMs: 60000,
      purpose: "Final MV-S6-LOCATION-004 controlled Battle Transfer native stall supplement",
    },
    scenario,
  );
  const after = await candidateIdentity(manifest);
  assert.equal(report.build.source.sha256, manifest.source.sha256);
  assert.deepEqual(report.build.source.entries, manifest.source.files);
  assert.equal(report.build.dist.sha256, manifest.dist.sha256);
  assert.deepEqual(report.build.dist.entries, manifest.dist.files);
  assert.equal(report.build.apiSha256, manifest.workspaceApiSha256);
  await json(path.join(report.root, "formal-source-summary.json"), {
    formalFiles,
    allKnownCommandsFormal: formalFiles.length > 0,
  });
  const receipt = {
    purpose: report.purpose,
    requirement: "MV-S6-LOCATION-004",
    scope:
      "Only controlled Battle201 supplement; prior R5 variable/exchange/query coverage is separately bound by55 data-only comparison.",
    binding,
    after,
    root: report.root,
    passed: report.passed,
    error: report.error || null,
    pairResultSha256: sha(await fs.readFile(path.join(report.root, "pair-result.json"))),
    independentFixtureSha256: sha(
      await fs.readFile(path.join(report.root, "independent-fixture.json")),
    ),
    build: {
      actualPackageHead: report.build.gitHead,
      apiSha256: report.build.apiSha256,
      sourceSha256: report.build.source.sha256,
      distSha256: report.build.dist.sha256,
      harnessSha256: report.build.harnessSha256,
      scenarioSha256: report.build.scenarioSha256,
    },
    lifecycle: report.lifecycle,
    checkStateUnchanged: report.checkStateUnchanged,
    sourceEdits: report.sourceEdits,
    formalFiles,
    completeCarrierComparison: {
      passed: report.completeCarrierComparison?.passed,
      files: report.completeCarrierComparison?.files,
    },
    publication: report.publication,
    runtimeComparison: report.runtimeComparison,
    nativeIdentity: report.nativeIdentity,
    sides: Object.fromEntries(
      Object.entries(report.sides).map(([side, item]) => {
        const native = item.native;
        const runtime = native?.["runtime-result.json"]?.value;
        const observation = runtime?.observation;
        return [
          side,
          {
            passed: item.passed,
            validation: item.validation,
            observerSha256: item.observerSha256,
            launch: native && {
              host: native.host,
              args: native.args,
              cwd: native.cwd,
              launchedPid: native.launchedPid,
              profile: native.profile,
              startedAt: native.startedAt,
              completedAt: native.completedAt,
              exitCode: native.exitCode,
              signal: native.signal,
              timedOut: native.timedOut,
            },
            runtimeResultSha256: native?.["runtime-result.json"]?.sha256,
            runtimeIdentitySha256: native?.["runtime-process-identity.json"]?.sha256,
            runtimeIdentity: native?.["runtime-process-identity.json"]?.value,
            stdout: native?.["stdout.txt"],
            stderr: native?.["stderr.txt"],
            engine: runtime && {
              version: runtime.engine,
              versions: runtime.versions,
              engineFiles: runtime.engineFiles,
            },
            expected: runtime?.expected,
            actual: runtime?.actual,
            error: runtime?.error,
            observation: observation && {
              firstFrame: observation.firstFrame,
              lastFrame: observation.lastFrame,
              span: observation.span,
              distinctSamples: observation.samples.length,
              observedFrames: observation.samples.map((sample) => sample.frame),
              everyObservedStateMatches: observation.samples.every(
                (sample) =>
                  JSON.stringify(sample.state) === JSON.stringify(scenarioModule.expectedState),
              ),
              sameInterpreterEverySample: observation.samples.every(
                (sample) => sample.sameInterpreter === true,
              ),
            },
            actions: runtime?.actions,
            transitions: runtime?.transitions,
          },
        ];
      }),
    ),
    completedAt: new Date().toISOString(),
  };
  const receiptPath = path.join(executionRoot, "safe-receipt.json");
  await json(receiptPath, receipt);
  console.log(
    JSON.stringify({
      receiptPath,
      receiptSha256: sha(await fs.readFile(receiptPath)),
      root: report.root,
      pairResultSha256: receipt.pairResultSha256,
      passed: receipt.passed,
      error: receipt.error,
      sides: Object.fromEntries(
        Object.entries(receipt.sides).map(([side, item]) => [
          side,
          {
            passed: item.passed,
            validation: item.validation,
            observation: item.observation,
            error: item.error,
          },
        ]),
      ),
    }),
  );
  if (!report.passed) process.exitCode = 1;
  return receipt;
}
module.exports = { main };
if (require.main === module)
  main().catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
