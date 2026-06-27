import { describe, expect, it } from "vitest";

import { cliName, createCli } from "../src/cli.js";

describe("createCli", () => {
  it("declares the first-version command surface without implementing workflows", () => {
    const program = createCli();

    expect(program.name()).toBe(cliName);
    expect(program.commands.map((command) => command.name())).toEqual([
      "init",
      "lint",
      "create",
      "replace",
    ]);
  });
});
