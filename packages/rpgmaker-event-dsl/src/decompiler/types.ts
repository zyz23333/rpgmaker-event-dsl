import type { RawEventCommand } from "../compiler/types.js";
import type { NativePageMovement } from "../commands/movement/page.js";
export type { RawEventCommand } from "../compiler/types.js";

export type RenderedCommand = {
  expression: string;
  helperNames: readonly string[];
  nextIndex: number;
};

export type DecompiledCommandListRendering = {
  helperNames: readonly string[];
  source: string;
};

export type RenderCommandList = (
  commands: readonly RawEventCommand[],
) => DecompiledCommandListRendering;

export type RenderSimpleCommand = (command: RawEventCommand, index: number) => RenderedCommand;

export type SnapshotMapEvent = {
  id: number;
  name: string;
  x: number;
  y: number;
  note: string;
  pages: SnapshotMapEventPage[];
};

export type SnapshotMapEventPage = {
  movement?: NativePageMovement;
  conditions?: Record<string, unknown>;
  list?: RawEventCommand[];
  trigger?: number;
  image: {
    characterName: string;
    characterIndex: number;
    direction: number;
    pattern: number;
    tileId: number;
  };
  directionFix: boolean;
  stepAnime: boolean;
  through: boolean;
  walkAnime: boolean;
  priorityType: number;
};

export type SnapshotCommonEvent = {
  id: number;
  list?: RawEventCommand[];
  name: string;
  switchId?: number;
  trigger?: number;
};
