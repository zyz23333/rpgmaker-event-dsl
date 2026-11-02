import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { arch, release } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { it } from "vitest";

const inputs = new AsyncLocalStorage<unknown[]>();
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

/** Test-owned literals and sources, never expected values computed by the product. */
export function recordAssetInput(input: unknown): void {
  inputs.getStore()?.push(input);
}

export function createAssetTest(options: { ownerTicket: string; testSource: string }) {
  return (name: string, verify: () => Promise<void>): void => {
    it(name, async () => {
      const id = name.slice(0, name.indexOf(":"));
      const startedAt = new Date().toISOString();
      const literalInputs: unknown[] = [];
      let failure: unknown;
      try {
        await inputs.run(literalInputs, verify);
      } catch (error) {
        failure = error;
        throw error;
      } finally {
        const entry = process.env.MV_CLI_ENTRY === "built" ? "built" : "source";
        const sourcePath = fileURLToPath(options.testSource);
        const testSource = await readFile(sourcePath, "utf8");
        const destination = join(
          repositoryRoot,
          "test-results/asset-validation",
          `${id}.${entry}.json`,
        );
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(
          destination,
          `${JSON.stringify(
            {
              id,
              ownerTicket: options.ownerTicket,
              status: failure === undefined ? "passed" : "failed",
              contract: ".scratch/asset-validation/implementation-acceptance-cases.md",
              startedAt,
              completedAt: new Date().toISOString(),
              environment: {
                platform: process.platform,
                node: process.version,
                architecture: arch(),
                osRelease: release(),
              },
              entry,
              input: literalInputs,
              expected: {
                description: name.slice(name.indexOf(":") + 1).trim(),
                assertionsSource: relative(repositoryRoot, sourcePath).split(/[/\\]/u).join("/"),
                sha256: createHash("sha256").update(testSource).digest("hex"),
                assertions: verify.toString(),
              },
              actual:
                failure === undefined ? "All independent assertions passed." : String(failure),
              nativeExecution: "not-applicable; synthetic Workspace/API and actual CLI test",
            },
            null,
            2,
          )}\n`,
        );
      }
    });
  };
}
