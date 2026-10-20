import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, it } from "vitest";

import {
  fixturePath,
  readRequirements,
  repositoryRoot,
  sha256,
  validateRequirements,
} from "./support/mv-evidence.js";

async function evidenceFixture() {
  const directory = await mkdtemp(join(tmpdir(), "mv-evidence-validation-"));
  const original = (await readRequirements()).requirements[0]!;
  const requirement = { ...original, id: "MV-HARNESS-001" };
  await mkdir(join(directory, "results"));
  await writeFile(
    join(directory, "requirements.json"),
    JSON.stringify({ formatVersion: 1, scope: "Harness validation", requirements: [requirement] }),
  );
  await writeFile(join(directory, "README.md"), "| MV-HARNESS-001 | Current record |\n");
  const files = [
    { path: fixturePath, sha256: sha256(await readFile(join(repositoryRoot, fixturePath))) },
  ];
  const result = {
    formatVersion: 1,
    requirementId: requirement.id,
    runId: "2026-10-20T10-00-00-000Z-11111111-1111-4111-8111-111111111111",
    status: "passed",
    startedAt: "2026-10-20T10:00:00.000Z",
    completedAt: "2026-10-20T10:00:00.001Z",
    operator: "Synthetic harness control",
    source: { revision: "synthetic", fingerprint: sha256(JSON.stringify(files)), files },
    fixture: { path: fixturePath, sha256: files[0]!.sha256 },
    environment: {
      platform: "win32",
      architecture: "x64",
      osRelease: "synthetic",
      node: "v22.23.0",
      vitest: "synthetic",
      typescript: "synthetic",
      package: "synthetic",
      native: "not-executed",
    },
    stages: ["Synthetic harness control"],
    expected: "Record is structurally valid; no coverage conclusion",
    actual: "Record is structurally valid; no coverage conclusion",
    difference: null as string | null,
  };
  const writeResult = async (
    value = result,
    name = `${value.requirementId}-${value.runId}.json`,
  ) => {
    await writeFile(join(directory, "results", name), JSON.stringify(value));
  };
  return { directory, result, writeResult };
}

it("rejects a damaged latest result in an isolated evidence directory", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    result.source.fingerprint = "0".repeat(64);
    await writeResult();
    await expect(validateRequirements({ directory })).rejects.toThrow("Source fingerprint differs");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("checks the current record while retaining a separate audit of superseded payloads", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeFile(
      join(directory, "results", `${result.requirementId}-${result.runId}.json`),
      "{damaged",
    );
    await writeResult({
      ...result,
      runId: "2026-10-20T11-00-00-000Z-22222222-2222-4222-8222-222222222222",
      completedAt: "2026-10-20T11:00:00.001Z",
    });
    await expect(validateRequirements({ directory })).resolves.toBeUndefined();
    await expect(validateRequirements({ directory, history: "all" })).rejects.toThrow();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("selects a later failed run rather than falling back to an earlier passing run", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeResult();
    await writeResult({
      ...result,
      runId: "2026-10-20T11-00-00-000Z-22222222-2222-4222-8222-222222222222",
      completedAt: "2026-10-20T11:00:00.001Z",
      status: "failed",
      difference: "Actual behavior failed; the record itself is still subject to validation",
      source: { ...result.source, fingerprint: "0".repeat(64) },
    });
    await expect(validateRequirements({ directory })).rejects.toThrow("Source fingerprint differs");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("orders legacy records by their recorded completion time and checks malformed names", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeResult();
    await writeResult(
      {
        ...result,
        runId: "legacy-run",
        completedAt: "2026-10-20T11:00:00.000Z",
        fixture: { ...result.fixture, sha256: "0".repeat(64) },
      },
      "MV-HARNESS-001-correction-legacy.json",
    );
    await expect(validateRequirements({ directory })).rejects.toThrow(
      "Fixture differs from captured",
    );
    await writeResult(
      { ...result, runId: "legacy-run", completedAt: "2026-10-20T11:00:00.000Z" },
      "MV-HARNESS-001-correction-legacy.json",
    );
    await expect(validateRequirements({ directory })).resolves.toBeUndefined();
    await writeFile(join(directory, "results", "bad-name.json"), "{damaged");
    await expect(validateRequirements({ directory })).rejects.toThrow(SyntaxError);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("rejects unknown requirement names even when another requirement has a valid current run", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeResult();
    await writeResult({ ...result, requirementId: "MV-UNKNOWN-001" });
    await expect(validateRequirements({ directory })).rejects.toThrow("unknown requirement");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("checks the identity of a selected named run and validates every run sharing the latest time", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    const filename = `${result.requirementId}-${result.runId}.json`;
    await writeResult({ ...result, runId: "different-run" }, filename);
    await expect(validateRequirements({ directory })).rejects.toThrow(
      "identity differs from filename",
    );
    await writeResult();
    await writeResult({
      ...result,
      runId: "2026-10-20T10-00-00-000Z-22222222-2222-4222-8222-222222222222",
      difference: "A passing record cannot have a difference",
    });
    await expect(validateRequirements({ directory })).rejects.toThrow(
      "Passing result has a difference",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("accepts a structurally valid failed record without claiming the requirement passed", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeResult({ ...result, status: "failed", difference: "Expected failure is retained" });
    await expect(validateRequirements({ directory })).resolves.toBeUndefined();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it("fully validates legacy names even after a canonical run supersedes them", async () => {
  const { directory, result, writeResult } = await evidenceFixture();
  try {
    await writeResult();
    await writeResult(
      {
        ...result,
        runId: "legacy-run",
        completedAt: "2026-10-20T09:00:00.000Z",
        source: { ...result.source, fingerprint: "0".repeat(64) },
      },
      "legacy-name.json",
    );
    await expect(validateRequirements({ directory })).rejects.toThrow("Source fingerprint differs");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
