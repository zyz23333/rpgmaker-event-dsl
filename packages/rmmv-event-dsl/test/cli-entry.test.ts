import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("CLI entrypoint", () => {
  it("prints help when executed directly", async () => {
    const { stdout } = await execFileAsync(process.execPath, ["src/cli.ts", "--help"]);

    expect(stdout).toContain("Usage: rmmv-event-dsl");
    expect(stdout).toContain("lint");
    expect(stdout).toContain("create");
    expect(stdout).toContain("replace");
  });
});
