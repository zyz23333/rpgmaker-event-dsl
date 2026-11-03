import { compileNodes } from "../compiler/dispatch.js";
import type { CommandOrigins } from "../compiler/types.js";
import type { DslOwnedDeclaration } from "../domain/declarations.js";
import type { DslCommand } from "../domain/types.js";
import type { ReferenceResolver } from "../validation/types.js";
import { capturedSource, renderCapturedSource, type CapturedSource } from "./source-provenance.js";

export type AuthoredAssetLocation = {
  dslPath: string;
  origin?: CapturedSource;
};
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
      const originSource =
        origin.kind === "rawDslCommand" || node === null || typeof node !== "object"
          ? undefined
          : capturedSource(node);
      locations.set(`${nativeBase}.list[${index}]`, {
        dslPath: origin.path,
        ...(originSource === undefined ? {} : { origin: originSource }),
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
        const origin = capturedSource(page);
        locations.set(native, { dslPath: path, ...(origin === undefined ? {} : { origin }) });
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
  let path = nativePath;
  while (path !== "") {
    const match = locations.get(path);
    if (match !== undefined) return `; DSL: ${match.dslPath}${renderCapturedSource(match.origin)}`;
    const separator = path.lastIndexOf(".");
    if (separator < 0) return "";
    path = path.slice(0, separator);
  }
  return "";
}
