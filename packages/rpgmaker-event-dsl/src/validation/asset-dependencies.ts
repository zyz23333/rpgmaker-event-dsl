import type { AssetTarget, EventAssetUse } from "./asset-uses.js";
import { nativeAssetEvents } from "./asset-uses.js";

export type AssetOrigin = Pick<
  EventAssetUse,
  "identity" | "nativePath" | "relatedNativePaths" | "dependencyChain" | "conditions" | "inactive"
>;
export type AssetDataProblem = AssetOrigin & { dataPath: string; reason: string };
export type AssetDynamicStop = AssetOrigin & { reason: string };
export type AssetRelations = { uses: EventAssetUse[]; problems: AssetDataProblem[] };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Read-only, invocation-local external data. It never discovers event roots. */
export class CapturedAssetData {
  private readonly parsed = new Map<string, unknown>();
  constructor(private readonly files: ReadonlyMap<string, string | Uint8Array>) {}

  private read(file: string): unknown {
    if (!this.parsed.has(file)) {
      const text = this.files.get(file);
      this.parsed.set(
        file,
        text === undefined
          ? undefined
          : JSON.parse(typeof text === "string" ? text : new TextDecoder().decode(text)),
      );
    }
    return this.parsed.get(file);
  }

  object(
    file: string,
    origin: AssetOrigin,
    result: AssetRelations,
  ): Record<string, unknown> | undefined {
    const value = this.read(file);
    if (!object(value)) {
      result.problems.push({
        ...origin,
        dataPath: file,
        reason: "Selected standard-data file must be an object; this relationship is unchecked.",
      });
      return undefined;
    }
    return value;
  }

  entry(
    file: string,
    id: number,
    origin: AssetOrigin,
    result: AssetRelations,
  ): Record<string, unknown> | undefined {
    const table = this.read(file);
    const entry: unknown = Array.isArray(table) ? table[id] : undefined;
    if (!object(entry)) {
      result.problems.push({
        ...origin,
        dataPath: `${file}[${id}]`,
        reason: "Selected standard-data entry must be an object; this relationship is unchecked.",
      });
      return undefined;
    }
    return entry;
  }
}

export function collectAssetName(
  result: AssetRelations,
  value: unknown,
  target: Omit<AssetTarget, "name">,
  origin: AssetOrigin,
  dataPath: string,
): void {
  if (typeof value !== "string") {
    result.problems.push({
      ...origin,
      dataPath,
      reason: "Necessary asset name must be a string; this relationship is unchecked.",
    });
  } else if (value !== "") result.uses.push({ ...target, name: value, ...origin });
}

export function collectAnimationAssets(
  data: CapturedAssetData,
  id: number,
  origin: AssetOrigin,
  result: AssetRelations,
): void {
  const animation = data.entry("Animations.json", id, origin, result);
  if (animation === undefined) return;
  for (const field of ["animation1Name", "animation2Name"])
    collectAssetName(
      result,
      animation[field],
      { category: "image", folder: "animations" },
      {
        ...origin,
        dependencyChain: [
          ...origin.dependencyChain,
          { data: "Animations.json", id, field, relationship: "Animation image sheet" },
        ],
        conditions: [
          ...origin.conditions,
          "Animation image sheets may be preloaded before the command executes.",
        ],
      },
      `Animations.json[${id}].${field}`,
    );
  if (!Array.isArray(animation.timings)) {
    result.problems.push({
      ...origin,
      dataPath: `Animations.json[${id}].timings`,
      dependencyChain: [
        ...origin.dependencyChain,
        {
          data: "Animations.json",
          id,
          field: "timings",
          relationship: "Animation timing sound effects",
        },
      ],
      reason: "Necessary animation timings must be an array; timing relationships are unchecked.",
    });
    return;
  }
  for (const [index, timing] of animation.timings.entries()) {
    const field = `timings[${index}].se.name`;
    collectAssetName(
      result,
      object(timing) && object(timing.se) ? timing.se.name : undefined,
      { category: "audio", folder: "se" },
      {
        ...origin,
        dependencyChain: [
          ...origin.dependencyChain,
          { data: "Animations.json", id, field, relationship: "Animation timing sound effect" },
        ],
        conditions: [
          ...origin.conditions,
          "Animation timing SE plays only when its frame is reached and duplicate suppression permits playback.",
        ],
      },
      `Animations.json[${id}].${field}`,
    );
  }
}

/** Shared selected-entry leaf; a page-tile consumer can later select its one slot. */
export function readTilesetNames(
  data: CapturedAssetData,
  id: number,
  origin: AssetOrigin,
  result: AssetRelations,
): readonly unknown[] | undefined {
  const tileset = data.entry("Tilesets.json", id, origin, result);
  if (tileset === undefined) return undefined;
  if (!Array.isArray(tileset.tilesetNames)) {
    result.problems.push({
      ...origin,
      dataPath: `Tilesets.json[${id}].tilesetNames`,
      dependencyChain: [
        ...origin.dependencyChain,
        { data: "Tilesets.json", id, field: "tilesetNames", relationship: "Tileset image sheets" },
      ],
      reason: "Necessary tilesetNames must be an array; tileset relationships are unchecked.",
    });
    return undefined;
  }
  return tileset.tilesetNames;
}

export function collectTilesetAssets(
  data: CapturedAssetData,
  id: number,
  origin: AssetOrigin,
  result: AssetRelations,
): void {
  const names = readTilesetNames(data, id, origin, result);
  if (names === undefined) return;
  for (const [index, name] of names.entries()) {
    const field = `tilesetNames[${index}]`;
    collectAssetName(
      result,
      name,
      { category: "image", folder: "tilesets" },
      {
        ...origin,
        dependencyChain: [
          ...origin.dependencyChain,
          { data: "Tilesets.json", id, field, relationship: "Tileset image sheet" },
        ],
        conditions: [
          ...origin.conditions,
          "All named tileset sheets are requested independently of tiles placed on the map.",
        ],
      },
      `Tilesets.json[${id}].${field}`,
    );
  }
}

export function collectAnimationAndTilesetAssets(
  files: ReadonlyMap<string, string>,
  external: ReadonlyMap<string, string | Uint8Array>,
): AssetRelations {
  const result: AssetRelations = { uses: [], problems: [] };
  const data = new CapturedAssetData(external);
  for (const event of nativeAssetEvents(files))
    for (const page of event.pages)
      for (const [index, command] of page.list.entries()) {
        if (command.code !== 212 && command.code !== 337 && command.code !== 282) continue;
        const field = command.code === 282 ? 0 : 1;
        const origin: AssetOrigin = {
          identity: event.identity,
          nativePath: `${page.nativePath}.list[${index}].parameters[${field}]`,
          relatedNativePaths: [],
          dependencyChain: [],
          conditions: [],
        };
        if (command.code === 282)
          collectTilesetAssets(data, command.parameters[0] as number, origin, result);
        else collectAnimationAssets(data, command.parameters[1] as number, origin, result);
      }
  return result;
}
