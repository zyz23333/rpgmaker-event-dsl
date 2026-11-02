import { compileNodes } from "../compiler/dispatch.js";
import type { CommandOrigins } from "../compiler/types.js";
import type { DslOwnedDeclaration } from "../domain/declarations.js";
import type { DslCommand } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";

export type AuthoredAssetLocation = {
  dslPath: string;
  source?: { file: string; line: number; column: number };
};
const capturedLocations = new WeakMap<object, { file: string; line: number; column: number }>();
export function rememberCapturedLocation(
  value: unknown,
  location: { file: string; line: number; column: number },
): void {
  if (value !== null && typeof value === "object") capturedLocations.set(value, location);
}
function atPath(value: unknown, path: string): unknown {
  for (const segment of path.replaceAll(/\[(\d+)\]/gu, ".$1").split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

/** Ephemeral correspondence from the same captured authored objects to native positions. */
export function createAssetProvenance(
  declarations: readonly DslOwnedDeclaration[],
  resolver: ReferenceResolver,
): ReadonlyMap<string, AuthoredAssetLocation> {
  const locations = new Map<string, AuthoredAssetLocation>();
  function commands(
    nodes: readonly DslCommand[],
    nativeBase: string,
    authored: unknown,
    path = "commands",
  ) {
    const origins: CommandOrigins = new Map();
    const list = compileNodes(nodes, 0, resolver, true, path, origins);
    list.forEach((command, index) => {
      const origin = origins.get(command);
      if (origin === undefined) return;
      const node = atPath(authored, origin.path);
      const source =
        origin.kind === "rawDslCommand" || node === null || typeof node !== "object"
          ? undefined
          : capturedLocations.get(node);
      locations.set(`${nativeBase}.list[${index}]`, {
        dslPath: origin.path,
        ...(source === undefined ? {} : { source }),
      });
    });
  }
  for (const declaration of declarations) {
    if (declaration.kind === "commonEvent")
      commands(declaration.commands, `CommonEvents.json[${declaration.id}]`, declaration);
    if (declaration.kind === "mapEvent" || declaration.kind === "troopEvent") {
      const root =
        declaration.kind === "mapEvent"
          ? `Map${String(declaration.mapId).padStart(3, "0")}.json.events[${declaration.id}]`
          : `Troops.json[${declaration.troopId}]`;
      declaration.pages.forEach((page, index) => {
        const native = `${root}.pages[${index}]`;
        const path = `pages[${index}]`;
        const source = capturedLocations.get(page);
        locations.set(native, { dslPath: path, ...(source === undefined ? {} : { source }) });
        commands(page.commands, native, declaration, `${path}.commands`);
      });
    }
  }
  return locations;
}

export function renderAuthoredAssetLocation(
  nativePath: string,
  locations?: ReadonlyMap<string, AuthoredAssetLocation>,
): string {
  if (!locations) return "";
  const match = [...locations]
    .filter(([path]) => nativePath === path || nativePath.startsWith(`${path}.`))
    .sort(([left], [right]) => right.length - left.length)[0]?.[1];
  return match === undefined
    ? ""
    : `; DSL: ${match.dslPath}${match.source === undefined ? "" : `; source: ${match.source.file} (line ${match.source.line}, column ${match.source.column})`}`;
}
