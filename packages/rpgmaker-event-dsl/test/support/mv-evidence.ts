import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { arch, release } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

export const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
export const evidenceRoot = join(
  repositoryRoot,
  ".scratch/complete-mv-events-implementation/evidence",
);
export const fixturePath =
  "packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/common-event-project.json";

const text = z.string().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/u);
const sourceKind = z.enum([
  "first-party-help",
  "first-party-template",
  "existing-sample",
  "static-inference",
  "reverse-engineering-observation",
  "synthetic-support",
  "synthetic-rejection",
  "editor-ui-capture",
  "game-observation",
]);

const requirementSchema = z
  .object({
    id: text.regex(/^MV-[A-Z0-9-]+$/u),
    title: text,
    sources: z.array(z.object({ path: text, section: text }).strict()).min(1),
    dimensions: z.array(z.enum(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"])).min(1),
    classifications: z.array(z.enum(["positive", "negative", "boundary", "combination"])).min(1),
    sourceKind,
    input: text,
    fixture: z.object({ path: text, sha256: hash }).strict(),
    expected: text,
    test: z.object({ path: text, name: text }).strict().optional(),
    review: z.object({ path: text, section: text }).strict().optional(),
    nativeGroups: z.array(z.string().regex(/^[ER][1-7]$/u)),
    execution: z.object({ environment: text, owner: text, layer: text }).strict(),
    slice: text,
    required: z.boolean(),
  })
  .strict()
  .refine(
    (requirement) => (requirement.test === undefined) !== (requirement.review === undefined),
    {
      message: "A requirement must link exactly one automated test or documentary review",
    },
  );

export const requirementsSchema = z
  .object({
    formatVersion: z.literal(1),
    scope: text,
    requirements: z.array(requirementSchema).min(1),
  })
  .strict();

export const resultSchema = z
  .object({
    formatVersion: z.literal(1),
    requirementId: text,
    runId: text,
    status: z.enum(["not-executed", "passed", "failed", "blocked", "retest-required"]),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime(),
    operator: text,
    source: z
      .object({
        revision: text,
        fingerprint: hash,
        files: z.array(z.object({ path: text, sha256: hash }).strict()).min(1),
      })
      .strict(),
    fixture: z.object({ path: text, sha256: hash }).strict(),
    environment: z
      .object({
        platform: text,
        architecture: text,
        osRelease: text,
        node: text,
        vitest: text,
        typescript: text,
        package: text,
        native: z.union([
          z.literal("not-executed"),
          z
            .object({
              method: z.enum(["reverse-engineering", "editor-ui", "game"]),
              mv: text,
              runtime: text,
              nwjs: text,
              tools: z.record(text, text),
              artifacts: z.array(z.object({ path: text, sha256: hash }).strict()).min(1),
            })
            .strict(),
        ]),
      })
      .strict(),
    stages: z.array(text).min(1),
    expected: z.unknown(),
    actual: z.unknown(),
    difference: z.string().nullable(),
  })
  .strict();

export function sha256(bytes: string | Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function readRequirements() {
  return requirementsSchema.parse(
    JSON.parse(await readFile(join(evidenceRoot, "requirements.json"), "utf8")),
  );
}

function repositoryPath(path: string): string {
  const resolved = resolve(repositoryRoot, path);
  const within = relative(repositoryRoot, resolved);
  if (
    isAbsolute(within) ||
    within === ".." ||
    within.startsWith("../") ||
    within.startsWith("..\\")
  ) {
    throw new Error(`Evidence path escapes repository: ${path}`);
  }
  return resolved;
}

export async function validateRequirements(): Promise<void> {
  const index = await readRequirements();
  const artifactBytes = new Map<string, Promise<Buffer>>();
  const readArtifact = (path: string): Promise<Buffer> => {
    const resolved = repositoryPath(path);
    let bytes = artifactBytes.get(resolved);
    if (bytes === undefined) {
      bytes = readFile(resolved);
      artifactBytes.set(resolved, bytes);
    }
    return bytes;
  };
  const ids = new Set<string>();
  const checklist = await readFile(join(evidenceRoot, "README.md"), "utf8");
  const listedIds = [...checklist.matchAll(/^\|\s*(MV-[A-Z0-9-]+)\s*\|/gmu)].map(
    (match) => match[1],
  );
  for (const requirement of index.requirements) {
    if (ids.has(requirement.id)) throw new Error(`Duplicate requirement: ${requirement.id}`);
    ids.add(requirement.id);
    if (!listedIds.includes(requirement.id)) {
      throw new Error(`Missing human checklist entry: ${requirement.id}`);
    }
    for (const source of requirement.sources) {
      if (!(await readArtifact(source.path)).toString("utf8").includes(source.section)) {
        throw new Error(`Missing source section: ${source.path} / ${source.section}`);
      }
    }
    const fixtureHash = sha256(await readArtifact(requirement.fixture.path));
    if (fixtureHash !== requirement.fixture.sha256) {
      throw new Error(`Fixture hash differs for ${requirement.id}: ${fixtureHash}`);
    }
    if (requirement.test !== undefined) {
      if (
        !(await readArtifact(requirement.test.path))
          .toString("utf8")
          .includes(requirement.test.name)
      ) {
        throw new Error(`Missing test case: ${requirement.id}`);
      }
    } else if (requirement.review !== undefined) {
      const review = (await readArtifact(requirement.review.path)).toString("utf8");
      if (!review.includes(requirement.review.section) || !review.includes(requirement.id)) {
        throw new Error(`Missing documentary review section or case: ${requirement.id}`);
      }
    }
  }
  if (listedIds.length !== ids.size || listedIds.some((id) => !ids.has(id!))) {
    throw new Error("Human checklist has missing, duplicate, or unknown requirement IDs");
  }
  const resultsRoot = join(evidenceRoot, "results");
  const requirementsById = new Map(
    index.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const runIds = new Set<string>();
  const resultPaths = (await listFiles(resultsRoot)).filter((path) => path.endsWith(".json"));
  const resultReadWindow = 32;
  const readResult = (path: string): Promise<PromiseSettledResult<string>> =>
    readFile(path, "utf8").then(
      (value) => ({ status: "fulfilled", value }),
      (reason: unknown) => ({ status: "rejected", reason }),
    );
  const reads = resultPaths.slice(0, resultReadWindow).map(readResult);
  for (const [position, path] of resultPaths.entries()) {
    const slot = position % resultReadWindow;
    const content = await reads[slot]!;
    const nextPath = resultPaths[position + resultReadWindow];
    if (nextPath !== undefined) reads[slot] = readResult(nextPath);
    if (content.status === "rejected") throw content.reason;
    const result = resultSchema.parse(JSON.parse(content.value));
    const requirement = requirementsById.get(result.requirementId);
    if (requirement === undefined)
      throw new Error(`Result references unknown requirement: ${path}`);
    if (runIds.has(result.runId)) throw new Error(`Duplicate run ID: ${path}`);
    runIds.add(result.runId);
    if (sha256(JSON.stringify(result.source.files)) !== result.source.fingerprint) {
      throw new Error(`Source fingerprint differs from recorded files: ${path}`);
    }
    if (
      result.source.files.find((file) => file.path === result.fixture.path)?.sha256 !==
      result.fixture.sha256
    ) {
      throw new Error(`Fixture differs from captured source inputs: ${path}`);
    }
    if (result.status === "passed" && result.difference !== null)
      throw new Error(`Passing result has a difference: ${path}`);
  }
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? listFiles(join(directory, entry.name))
        : Promise.resolve([join(directory, entry.name)]),
    ),
  );
  return nested.flat().sort();
}

export async function recordEvidence(input: {
  requirementId: string;
  startedAt: string;
  stages: string[];
  expected: unknown;
  actual: unknown;
  error?: unknown;
}): Promise<void> {
  const requirement = (await readRequirements()).requirements.find(
    ({ id }) => id === input.requirementId,
  );
  if (requirement === undefined)
    throw new Error(`Unknown evidence requirement: ${input.requirementId}`);
  const require = createRequire(import.meta.url);
  const toolVersion = (name: string): string =>
    (require(`${name}/package.json`) as { version: string }).version;
  const sourcePaths = [
    ...(await listFiles(join(repositoryRoot, "packages/rpgmaker-event-dsl/src"))),
    ...(await listFiles(join(repositoryRoot, "packages/rpgmaker-event-dsl/test"))),
    ...(process.env.MV_CLI_ENTRY === "built"
      ? await listFiles(join(repositoryRoot, "packages/rpgmaker-event-dsl/dist")).catch(
          (error: unknown) => {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
            throw error;
          },
        )
      : []),
    join(repositoryRoot, ".github/workflows/ci.yml"),
    join(repositoryRoot, "package.json"),
    join(repositoryRoot, "packages/rpgmaker-event-dsl/vitest.config.ts"),
    join(repositoryRoot, "packages/rpgmaker-event-dsl/vitest.windows.config.ts"),
    join(repositoryRoot, "pnpm-lock.yaml"),
    join(repositoryRoot, "packages/rpgmaker-event-dsl/package.json"),
    join(repositoryRoot, "packages/rpgmaker-event-dsl/tsconfig.json"),
    join(repositoryRoot, "tsconfig.base.json"),
    join(evidenceRoot, "requirements.json"),
  ].sort();
  const files = await Promise.all(
    sourcePaths.map(async (path) => ({
      path: relative(repositoryRoot, path).replaceAll("\\", "/"),
      sha256: sha256(await readFile(path)),
    })),
  );
  const runId = `${new Date().toISOString().replaceAll(/[:.]/gu, "-")}-${randomUUID()}`;
  const result = resultSchema.parse({
    formatVersion: 1,
    requirementId: input.requirementId,
    runId,
    status: input.error === undefined ? "passed" : "failed",
    startedAt: input.startedAt,
    completedAt: new Date().toISOString(),
    operator: process.env.GITHUB_ACTOR ?? "Codex automated verification",
    source: {
      revision: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: repositoryRoot,
        encoding: "utf8",
      }).trim(),
      fingerprint: sha256(JSON.stringify(files)),
      files,
    },
    fixture: {
      path: requirement.fixture.path,
      sha256: sha256(await readFile(repositoryPath(requirement.fixture.path))),
    },
    environment: {
      platform: process.platform,
      architecture: arch(),
      osRelease: release(),
      node: process.version,
      vitest: toolVersion("vitest"),
      typescript: toolVersion("typescript"),
      package: (
        JSON.parse(
          await readFile(join(repositoryRoot, "packages/rpgmaker-event-dsl/package.json"), "utf8"),
        ) as { version: string }
      ).version,
      native: "not-executed",
    },
    stages: input.stages,
    expected: input.expected,
    actual: input.actual,
    difference:
      input.error === undefined
        ? null
        : input.error instanceof Error
          ? (input.error.stack ?? input.error.message)
          : String(input.error),
  });
  const output = resolve(
    process.env.MV_EVIDENCE_OUTPUT ?? join(repositoryRoot, "test-results/mv-evidence"),
  );
  const resultPath = join(output, `${input.requirementId}-${runId}.json`);
  await mkdir(dirname(resultPath), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
