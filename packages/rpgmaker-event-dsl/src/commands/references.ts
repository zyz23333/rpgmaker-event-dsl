import type {
  AudioAssetFolder,
  AudioAssetReference,
  ImageAssetFolder,
  ImageAssetReference,
  MovieAssetReference,
  RawDslCommand,
  ReferenceValue,
  ScriptInput,
} from "../dsl.js";
import {
  assertIncluded,
  assertNonEmptyString,
  audioAssetFolders,
  createReference,
  imageAssetFolders,
} from "../dsl.js";

export function rawDslCommand(input: {
  code: number;
  indent?: number;
  parameters: readonly unknown[];
}): RawDslCommand {
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

export function audioAsset(input: { folder: AudioAssetFolder; name: string }): AudioAssetReference {
  assertIncluded(audioAssetFolders, input.folder, "audio asset folder");
  assertNonEmptyString(input.name, "Audio asset name");

  return {
    kind: "asset",
    category: "audio",
    folder: input.folder,
    name: input.name,
  };
}

export function imageAsset(input: { folder: ImageAssetFolder; name: string }): ImageAssetReference {
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
  assertNonEmptyString(input.name, "Movie asset name");

  return {
    kind: "asset",
    category: "movie",
    folder: "movies",
    name: input.name,
  };
}

export function scriptInput(input: { code: string }): ScriptInput {
  assertNonEmptyString(input.code, "Script input code");

  return {
    kind: "scriptInput",
    code: input.code,
  };
}

export function actorRef(value: { id: number } | { name: string }): ReferenceValue<"actor"> {
  return createReference("actor", value);
}

export function animationRef(
  value: { id: number } | { name: string },
): ReferenceValue<"animation"> {
  return createReference("animation", value);
}

export function armorRef(value: { id: number } | { name: string }): ReferenceValue<"armor"> {
  return createReference("armor", value);
}

export function classRef(value: { id: number } | { name: string }): ReferenceValue<"class"> {
  return createReference("class", value);
}

export function commonEventRef(
  value: { id: number } | { name: string },
): ReferenceValue<"commonEvent"> {
  return createReference("commonEvent", value);
}

export function enemyRef(value: { id: number } | { name: string }): ReferenceValue<"enemy"> {
  return createReference("enemy", value);
}

export function itemRef(value: { id: number } | { name: string }): ReferenceValue<"item"> {
  return createReference("item", value);
}

export function mapRef(value: { id: number } | { name: string }): ReferenceValue<"map"> {
  return createReference("map", value);
}

export function skillRef(value: { id: number } | { name: string }): ReferenceValue<"skill"> {
  return createReference("skill", value);
}

export function stateRef(value: { id: number } | { name: string }): ReferenceValue<"state"> {
  return createReference("state", value);
}

export function switchRef(value: { id: number } | { name: string }): ReferenceValue<"switch"> {
  return createReference("switch", value);
}

export function tilesetRef(value: { id: number } | { name: string }): ReferenceValue<"tileset"> {
  return createReference("tileset", value);
}

export function troopRef(value: { id: number } | { name: string }): ReferenceValue<"troop"> {
  return createReference("troop", value);
}

export function variableRef(value: { id: number } | { name: string }): ReferenceValue<"variable"> {
  return createReference("variable", value);
}

export function weaponRef(value: { id: number } | { name: string }): ReferenceValue<"weapon"> {
  return createReference("weapon", value);
}
