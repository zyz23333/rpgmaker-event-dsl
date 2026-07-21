import { execFile } from "node:child_process";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const nodeCommand = process.execPath;
const tsxLoaderArgs = ["--import", "tsx"];

describe("CLI entrypoint", () => {
  it("prints help when executed directly", async () => {
    const { stdout } = await execFileAsync(nodeCommand, [...tsxLoaderArgs, "src/cli.ts", "--help"]);

    expect(stdout).toContain("Usage: rpgmaker-event-dsl");
    expect(stdout).toContain("init");
    expect(stdout).toContain("clone");
    expect(stdout).toContain("pull");
    expect(stdout).toContain("decompile");
    expect(stdout).toContain("compile");
    expect(stdout).toContain("diff");
    expect(stdout).toContain("push");
    expect(stdout).not.toContain("lint");
    expect(stdout).not.toContain("create");
    expect(stdout).not.toContain("replace");
  });

  it("prints help when executed through a symlinked bin path", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-cli-bin-"));
    const binPath = join(workspaceRoot, "rpgmaker-event-dsl.ts");

    try {
      await symlink(join(process.cwd(), "src", "cli.ts"), binPath);
    } catch (error) {
      if (
        process.platform === "win32" &&
        error instanceof Error &&
        "code" in error &&
        ((error as { code?: unknown }).code === "EPERM" ||
          (error as { code?: unknown }).code === "EACCES")
      ) {
        return;
      }
      throw error;
    }

    const { stdout } = await execFileAsync(nodeCommand, [...tsxLoaderArgs, binPath, "--help"]);

    expect(stdout).toContain("Usage: rpgmaker-event-dsl");
  });

  it("initializes a workspace from the init command", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "rpgmaker-event-dsl-cli-"));
    const projectRoot = join(workspaceRoot, "..", "MyGame-cli");

    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, "Game.rpgproject"), "", "utf8");
    await mkdir(join(projectRoot, "data"), { recursive: true });

    await execFileAsync(nodeCommand, [
      ...tsxLoaderArgs,
      "src/cli.ts",
      "init",
      workspaceRoot,
      "--project-root",
      "../MyGame-cli",
    ]);

    const { stdout } = await execFileAsync(nodeCommand, [...tsxLoaderArgs, "src/cli.ts", "--help"]);
    expect(stdout).toContain("init");
  });
});
