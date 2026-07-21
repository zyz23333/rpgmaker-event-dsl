import type { RawEventCommand } from "../compiler/types.js";
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
  pages: SnapshotMapEventPage[];
};

export type SnapshotMapEventPage = {
  conditions?: Record<string, unknown>;
  list?: RawEventCommand[];
  trigger?: number;
};

export type SnapshotCommonEvent = {
  id: number;
  list?: RawEventCommand[];
  name: string;
  switchId?: number;
  trigger?: number;
};
