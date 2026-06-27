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
  battleProcessing,
  changeGold,
  changeItem,
  collectEventDefinitions,
  comment,
  commonEvent,
  commonEventCall,
  commonEventRef,
  controlSelfSwitch,
  controlSwitch,
  controlVariable,
  eraseEvent,
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
  showChoices,
  script,
  showText,
  wait,
  switchRef,
  troopRef,
  variableRef,
  weaponRef,
} from "./dsl.js";

export type {
  CommonEventDefinition,
  CommonEventTrigger,
  CommentNode,
  EventDefinition,
  EventNode,
  EventPage,
  ControlSelfSwitchNode,
  ControlSwitchNode,
  ControlVariableNode,
  ChangeGoldNode,
  ChangeItemNode,
  EraseEventNode,
  MapEventDefinition,
  MapPageTrigger,
  PageConditions,
  ProjectIndex,
  ReferenceKind,
  ReferenceValue,
  BattleProcessingNode,
  WaitNode,
} from "./dsl.js";
export type {
  DefinitionBinding,
  DefinitionTarget,
  LoadedWorkspace,
  WorkspaceConfig,
} from "./workspace.js";

export type RuntimeBaseline = typeof runtimeBaseline;
