import type { ValidationIssue } from "./types.js";

export class CommandStructureError extends Error {
  constructor(
    readonly code: string,
    readonly detail: string,
    readonly location: { nativePath?: string; dslPath?: string } = {},
    readonly identity?: string,
    readonly stage?: "compile" | "decompile",
  ) {
    super(
      `${identity ? `${identity}: ` : ""}${code}: ${detail}${location.nativePath ? ` at ${location.nativePath}` : ""}${location.dslPath ? ` (${location.dslPath})` : ""}`,
    );
  }

  issue(identity: string, stage: "compile" | "decompile"): ValidationIssue {
    return {
      level: "error",
      code: this.code,
      stage,
      identity,
      ...this.location,
      message: `${identity}: ${this.message}`,
    };
  }
}
