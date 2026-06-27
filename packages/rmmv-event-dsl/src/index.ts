export const runtimeBaseline = {
  language: "typescript-strict",
  moduleSystem: "esm-nodenext",
  packageManager: "pnpm",
  runtime: "node-22-lts",
} as const;

export { loadWorkspace } from "./workspace.js";
export { loadProject, buildProjectIndex, parseCommonEvents, parseMapInfos } from "./project.js";
export { loadDefinitionFile } from "./definitions.js";
export {
  actorRef,
  armorRef,
  breakLoop,
  collectEventDefinitions,
  commonEvent,
  commonEventCall,
  commonEventRef,
  conditional,
  exitEvent,
  itemRef,
  jumpToLabel,
  label,
  loop,
  mapEvent,
  mapRef,
  page,
  pluginCommand,
  rawCommand,
  script,
  showText,
  switchRef,
  troopRef,
  variableRef,
  weaponRef,
} from "./dsl.js";

export type {
  CommonEventDefinition,
  CommonEventTrigger,
  EventDefinition,
  EventNode,
  EventPage,
  MapEventDefinition,
  MapPageTrigger,
  PageConditions,
  ProjectIndex,
  ReferenceKind,
  ReferenceValue,
} from "./dsl.js";
export type {
  DefinitionBinding,
  DefinitionTarget,
  LoadedWorkspace,
  WorkspaceConfig,
} from "./workspace.js";

export type RuntimeBaseline = typeof runtimeBaseline;
