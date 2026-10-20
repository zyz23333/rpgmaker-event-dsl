import type {
  AudioAssetFolder,
  AudioAssetReference,
  ImageAssetFolder,
  ImageAssetReference,
  MovieAssetReference,
  RawDslCommand,
  ReferenceKind,
  ReferenceValue,
  ScriptInput,
} from "../domain/types.js";
import { createReference, imageAssetFolders } from "../domain/references.js";
import { assertIncluded, assertNonEmptyString } from "./shared.js";
import { assertMovieAssetInput } from "../commands/screen/validation.js";
import { assertDslObject, assertRawDslInput } from "../validation/dsl-command-inputs.js";
import { assertAudioAssetInput } from "../commands/audio/validation.js";
import { assertReferenceInput } from "../validation/reference-inputs.js";

function authoredReference<TKind extends ReferenceKind>(
  kind: TKind,
  value: { id: number } | { name: string },
): ReferenceValue<TKind> {
  assertReferenceInput(value, kind, `${kind}Ref`);
  return createReference(kind, value);
}

export function rawDslCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): RawDslCommand {
  assertRawDslInput(input, "rawDslCommand", 0, false, false);
  const node: RawDslCommand = {
    kind: "rawDslCommand",
    code: input.code,
    parameters: input.parameters,
  };

  if (input.indent !== undefined) {
    node.indent = input.indent;
  }

  return node;
}

export function audioAsset<Folder extends AudioAssetFolder>(input: {
  folder: Folder;
  name: string;
}): AudioAssetReference<Folder> {
  assertAudioAssetInput(input);

  return {
    kind: "asset",
    category: "audio",
    folder: input.folder,
    name: input.name,
  };
}

export function imageAsset(input: { folder: ImageAssetFolder; name: string }): ImageAssetReference {
  assertDslObject(input, ["folder", "name"], "imageAsset");
  assertIncluded(imageAssetFolders, input.folder, "image asset folder");
  assertNonEmptyString(input.name, "Image asset name");

  return {
    kind: "asset",
    category: "image",
    folder: input.folder,
    name: input.name,
  };
}

export function movieAsset(input: { name: string }): MovieAssetReference {
  assertMovieAssetInput(input);

  return {
    kind: "asset",
    category: "movie",
    folder: "movies",
    name: input.name,
  };
}

export function scriptInput(input: { code: string }): ScriptInput {
  assertDslObject(input, ["code"], "scriptInput");
  if (typeof input.code !== "string") throw new Error("Script input code must be a string.");

  return {
    kind: "scriptInput",
    code: input.code,
  };
}

export function actorRef(value: { id: number } | { name: string }): ReferenceValue<"actor"> {
  return authoredReference("actor", value);
}

export function animationRef(
  value: { id: number } | { name: string },
): ReferenceValue<"animation"> {
  return authoredReference("animation", value);
}

export function armorRef(value: { id: number } | { name: string }): ReferenceValue<"armor"> {
  return authoredReference("armor", value);
}

export function classRef(value: { id: number } | { name: string }): ReferenceValue<"class"> {
  return authoredReference("class", value);
}

export function commonEventRef(
  value: { id: number } | { name: string },
): ReferenceValue<"commonEvent"> {
  return authoredReference("commonEvent", value);
}

export function enemyRef(value: { id: number } | { name: string }): ReferenceValue<"enemy"> {
  return authoredReference("enemy", value);
}

export function itemRef(value: { id: number } | { name: string }): ReferenceValue<"item"> {
  return authoredReference("item", value);
}

export function mapRef(value: { id: number } | { name: string }): ReferenceValue<"map"> {
  return authoredReference("map", value);
}

export function skillRef(value: { id: number } | { name: string }): ReferenceValue<"skill"> {
  return authoredReference("skill", value);
}

export function stateRef(value: { id: number } | { name: string }): ReferenceValue<"state"> {
  return authoredReference("state", value);
}

export function switchRef(value: { id: number } | { name: string }): ReferenceValue<"switch"> {
  return authoredReference("switch", value);
}

export function tilesetRef(value: { id: number } | { name: string }): ReferenceValue<"tileset"> {
  return authoredReference("tileset", value);
}

export function troopRef(value: { id: number } | { name: string }): ReferenceValue<"troop"> {
  return authoredReference("troop", value);
}

export function variableRef(value: { id: number } | { name: string }): ReferenceValue<"variable"> {
  return authoredReference("variable", value);
}

export function weaponRef(value: { id: number } | { name: string }): ReferenceValue<"weapon"> {
  return authoredReference("weapon", value);
}
