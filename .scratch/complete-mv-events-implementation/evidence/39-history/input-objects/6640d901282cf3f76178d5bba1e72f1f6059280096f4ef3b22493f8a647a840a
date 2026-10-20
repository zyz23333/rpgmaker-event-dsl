import { describe, expect, it } from "vitest";

import { cliName, createCli } from "../src/cli.js";

describe("createCli", () => {
  it("declares the first-version command surface without implementing workflows", () => {
    const program = createCli();

    expect(program.name()).toBe(cliName);
    expect(program.commands.map((command) => command.name())).toEqual([
      "init",
      "clone",
      "pull",
      "decompile",
      "compile",
      "diff",
      "push",
    ]);
  });

  it("declares workspace compile and push safety options", () => {
    const program = createCli();
    const compileCommand = program.commands.find((command) => command.name() === "compile");
    const diffCommand = program.commands.find((command) => command.name() === "diff");
    const pushCommand = program.commands.find((command) => command.name() === "push");

    expect(compileCommand?.options.map((option) => option.long)).toContain("--check");
    expect(diffCommand?.options.map((option) => option.long)).toContain("--short");
    expect(diffCommand?.options.map((option) => option.long)).toContain("--file");
    expect(pushCommand?.options.map((option) => option.long)).toContain("--allow-destructive");
  });
});
