import type { ValidationIssue } from "./types.js";

export class CommandStructureError extends Error {
  constructor(
    readonly code: string,
    readonly detail: string,
    readonly location: Pick<
      ValidationIssue,
      "nativePath" | "dslPath" | "expected" | "actual" | "relatedLocations"
    > = {},
    readonly identity?: string,
    readonly stage?: "compile" | "decompile",
  ) {
    super(
      `${stage ? `${stage} error ` : ""}${identity ? `${identity}: ` : ""}${code}: ${detail}${location.nativePath ? ` at ${location.nativePath}` : ""}${location.dslPath ? ` (${location.dslPath})` : ""}${location.expected !== undefined ? `; expected ${location.expected}; actual ${location.actual}` : ""}${location.relatedLocations?.map((related) => `; related ${related.nativePath ?? related.dslPath} = ${related.value}`).join("") ?? ""}`,
    );
  }

  issue(identity: string, stage: "compile" | "decompile"): ValidationIssue {
    return {
      level: "error",
      code: this.code,
      stage,
      identity,
      ...this.location,
      message: `${stage} error ${identity}: ${this.message}`,
    };
  }
}
