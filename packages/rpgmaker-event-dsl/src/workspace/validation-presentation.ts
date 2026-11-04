import type { DslOwnedDeclaration } from "../domain/declarations.js";
import type { ValidationIssue } from "../validation/types.js";
import { capturedSource, renderCapturedSource, type CapturedSource } from "./source-provenance.js";

function identities(declaration: DslOwnedDeclaration): readonly string[] {
  switch (declaration.kind) {
    case "commonEvent":
      return [`commonEvent:${declaration.id}`, `common event ${declaration.id}`];
    case "mapEvent":
      return [
        `map:${declaration.mapId}/event:${declaration.id}`,
        `map ${declaration.mapId} event ${declaration.id}`,
      ];
    case "troopEvent":
      return [`troop:${declaration.troopId}`, `troop ${declaration.troopId}`];
    default:
      return [];
  }
}

function sourceAtPath(declaration: DslOwnedDeclaration, path: string): CapturedSource | undefined {
  let value: unknown = declaration;
  let source: CapturedSource | undefined;
  // Constructor-prefixed fields describe the same declaration, not a nested object.
  const relative = path.replace(new RegExp(`^${declaration.kind}\\.`), "");
  for (const segment of relative.replaceAll(/\[(\d+)\]/gu, ".$1").split(".")) {
    if (value === null || typeof value !== "object") break;
    if ("kind" in value && value.kind === "rawDslCommand") return undefined;
    if (!Object.hasOwn(value, segment)) break;
    value = (value as Record<string, unknown>)[segment];
    source = capturedSource(value) ?? source;
  }
  if (value && typeof value === "object" && "kind" in value && value.kind === "rawDslCommand")
    return undefined;
  return source;
}

/** Presentation only: keep the original validation decision, severity and wording. */
export function renderValidationIssue(
  issue: ValidationIssue,
  declarations: readonly DslOwnedDeclaration[],
): string {
  const matches =
    issue.identity === undefined
      ? []
      : declarations.filter((value) => identities(value).includes(issue.identity!));
  const source =
    matches.length === 1 && issue.dslPath !== undefined
      ? sourceAtPath(matches[0]!, issue.dslPath)
      : undefined;
  return `${issue.message}${issue.identity === undefined || issue.message.includes(issue.identity) ? "" : `; identity: ${issue.identity}`}${issue.dslPath === undefined ? "" : `; DSL: ${issue.dslPath}`}${issue.nativePath === undefined ? "" : `; native: ${issue.nativePath}`}${renderCapturedSource(source)}`;
}
