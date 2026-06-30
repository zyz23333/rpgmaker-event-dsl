import type {
  BattleProcessingDslCommand,
  CommonEventDefinition,
  ControlVariablesDslCommand,
  DslCommand,
  EventPage,
  MapEventDefinition,
  PageConditions,
  ReferenceKind,
  ReferenceValue,
} from "./dsl.js";
import type { ReferenceResolver } from "./staged-graph.js";

type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

export type ProjectEventData = {
  id: number;
  name: string;
  x?: number;
  y?: number;
  note?: string;
  pages?: ProjectEventPage[];
  trigger?: number;
  switchId?: number;
  list?: RawEventCommand[];
};

type ProjectEventPage = {
  conditions?: Record<string, unknown>;
  directionFix?: boolean;
  image?: Record<string, unknown>;
  list: RawEventCommand[];
  moveFrequency?: number;
  moveRoute?: Record<string, unknown>;
  moveSpeed?: number;
  moveType?: number;
  priorityType?: number;
  stepAnime?: boolean;
  through?: boolean;
  trigger?: number;
  walkAnime?: boolean;
};

type CompiledCommonEvent = {
  id: number;
  name: string;
  trigger: number;
  switchId: number;
  list: RawEventCommand[];
};

export function compileMapEvent(
  definition: MapEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): ProjectEventData {
  return {
    id: options.nextId,
    name: definition.name,
    x: definition.x,
    y: definition.y,
    pages: definition.pages.map((page) => compilePage(page, options.resolver)),
  };
}

export function compileCommonEvent(
  definition: CommonEventDefinition,
  options: { nextId: number; resolver: ReferenceResolver },
): CompiledCommonEvent {
  return {
    id: options.nextId,
    name: definition.name,
    trigger: commonEventTriggerToCode(definition.trigger),
    switchId: definition.switch ? options.resolver.resolveReference(definition.switch) : 1,
    list: compileNodes(definition.commands, 0, options.resolver),
  };
}

export function compilePage(page: EventPage, resolver: ReferenceResolver): ProjectEventPage {
  return {
    conditions: compileConditions(page.conditions, resolver),
    directionFix: false,
    image: {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0,
    },
    list: compileNodes(page.commands, 0, resolver),
    moveFrequency: 3,
    moveRoute: {
      list: [{ code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false,
    },
    moveSpeed: 3,
    moveType: 0,
    priorityType: 1,
    stepAnime: false,
    through: false,
    trigger:
      page.trigger === "action"
        ? 0
        : page.trigger === "playerTouch"
          ? 1
          : page.trigger === "eventTouch"
            ? 2
            : page.trigger === "autorun"
              ? 3
              : 4,
    walkAnime: true,
  };
}

function compileNodes(
  nodes: readonly DslCommand[],
  indent: number,
  resolver: ReferenceResolver,
  includeTerminator = true,
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  for (const node of nodes) {
    switch (node.kind) {
      case "showText":
        output.push({
          code: 101,
          indent,
          parameters: ["", 0, 0, 2],
        });
        for (const line of node.lines) {
          output.push({
            code: 401,
            indent,
            parameters: [line],
          });
        }
        break;
      case "conditional":
        output.push({
          code: 111,
          indent,
          parameters: [0, 1, 0, 0, 0],
        });
        output.push(...compileNodes(node.then, indent + 1, resolver, false));
        if (node.else) {
          output.push({
            code: 411,
            indent,
            parameters: [],
          });
          output.push(...compileNodes(node.else, indent + 1, resolver, false));
        }
        break;
      case "comment":
        output.push({
          code: 108,
          indent,
          parameters: [node.lines[0]],
        });
        for (let index = 1; index < node.lines.length; index += 1) {
          output.push({
            code: 408,
            indent,
            parameters: [node.lines[index]],
          });
        }
        break;
      case "loop":
        output.push({
          code: 112,
          indent,
          parameters: [],
        });
        output.push(...compileNodes(node.body, indent + 1, resolver, false));
        output.push({
          code: 413,
          indent,
          parameters: [],
        });
        break;
      case "breakLoop":
        output.push({ code: 113, indent, parameters: [] });
        break;
      case "exitEvent":
        output.push({ code: 115, indent, parameters: [] });
        break;
      case "commonEvent":
        output.push({
          code: 117,
          indent,
          parameters: [resolver.resolveReference(node.ref)],
        });
        break;
      case "label":
        output.push({ code: 118, indent, parameters: [node.name] });
        break;
      case "jumpToLabel":
        output.push({ code: 119, indent, parameters: [node.name] });
        break;
      case "controlSwitches": {
        const switchId = resolver.resolveReference(node.switch);
        output.push({
          code: 121,
          indent,
          parameters: [switchId, switchId, resolveControlValue(node.value)],
        });
        break;
      }
      case "controlVariables":
        output.push({
          code: 122,
          indent,
          parameters: compileControlVariablesParameters(node, resolver),
        });
        break;
      case "controlSelfSwitch":
        output.push({
          code: 123,
          indent,
          parameters: [node.selfSwitch, resolveControlValue(node.value)],
        });
        break;
      case "changeGold":
        output.push({
          code: 125,
          indent,
          parameters: [node.operation === "gain" ? 0 : 1, 0, node.value],
        });
        break;
      case "changeItem":
        output.push({
          code: 126,
          indent,
          parameters: [
            resolver.resolveReference(node.item),
            node.operation === "gain" ? 0 : 1,
            0,
            node.amount,
          ],
        });
        break;
      case "wait":
        output.push({
          code: 230,
          indent,
          parameters: [node.frames],
        });
        break;
      case "eraseEvent":
        output.push({
          code: 214,
          indent,
          parameters: [],
        });
        break;
      case "battleProcessing":
        output.push({
          code: 301,
          indent,
          parameters: compileBattleProcessingParameters(node, resolver),
        });
        break;
      case "script":
        output.push({
          code: 355,
          indent,
          parameters: [node.code.join("\n")],
        });
        for (let index = 1; index < node.code.length; index += 1) {
          output.push({
            code: 655,
            indent,
            parameters: [node.code[index]],
          });
        }
        break;
      case "pluginCommand":
        output.push({
          code: 356,
          indent,
          parameters: [node.args ? `${node.command} ${node.args.join(" ")}` : node.command],
        });
        break;
      case "transferPlayer":
        if ("map" in node.target) {
          output.push({
            code: 201,
            indent,
            parameters: [
              0,
              getReferenceId(node.target.map),
              node.target.x,
              node.target.y,
              node.target.direction ?? 2,
              node.target.fadeType ?? 0,
            ],
          });
        } else {
          output.push({
            code: 201,
            indent,
            parameters: [
              1,
              getReferenceId(node.target.variableMap),
              getReferenceId(node.target.variableX),
              getReferenceId(node.target.variableY),
              node.target.direction ?? 2,
              node.target.fadeType ?? 0,
            ],
          });
        }
        break;
      case "showChoices":
        output.push({
          code: 102,
          indent,
          parameters: [
            node.choices,
            node.cancelType ?? -1,
            node.defaultType ?? 0,
            node.positionType ?? 2,
            node.background ?? 0,
          ],
        });
        output.push(...compileChoiceBranches(node, indent, resolver));
        break;
      case "shopProcessing":
        output.push({
          code: 302,
          indent,
          parameters: [...node.goods, node.allowSelling ?? false],
        });
        break;
      case "rawDslCommand":
        output.push({
          code: node.code,
          indent: node.indent ?? indent,
          parameters: [...node.parameters],
        });
        break;
    }
  }

  if (includeTerminator) {
    output.push({ code: 0, indent, parameters: [] });
  }
  return output;
}

function resolveControlValue(value: boolean): number {
  return value ? 0 : 1;
}

function compileControlVariablesParameters(
  node: ControlVariablesDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  const targetId = resolver.resolveReference(node.variable);
  const operation =
    node.operation === "set"
      ? 0
      : node.operation === "add"
        ? 1
        : node.operation === "sub"
          ? 2
          : node.operation === "mul"
            ? 3
            : node.operation === "div"
              ? 4
              : 5;

  if (typeof node.value === "number") {
    return [targetId, targetId, operation, 0, node.value];
  }

  if ("kind" in node.value && node.value.kind === "random") {
    return [targetId, targetId, operation, 2, node.value.from, node.value.to];
  }

  return [targetId, targetId, operation, 1, resolver.resolveReference(node.value)];
}

function compileChoiceBranches(
  node: Extract<DslCommand, { kind: "showChoices" }>,
  indent: number,
  resolver: ReferenceResolver,
): RawEventCommand[] {
  const output: RawEventCommand[] = [];

  node.branches.forEach((branch, index) => {
    output.push({
      code: 402,
      indent,
      parameters: [index],
    });
    output.push(...compileNodes(branch, indent + 1, resolver, false));
  });

  if (node.cancelBranch) {
    output.push({
      code: 403,
      indent,
      parameters: [],
    });
    output.push(...compileNodes(node.cancelBranch, indent + 1, resolver, false));
  }

  return output;
}

function compileBattleProcessingParameters(
  node: BattleProcessingDslCommand,
  resolver: ReferenceResolver,
): unknown[] {
  if ("useRandomEncounter" in node.troop) {
    return [2, 0, node.canEscape ?? false, node.canLose ?? false];
  }

  return [0, resolver.resolveReference(node.troop), node.canEscape ?? false, node.canLose ?? false];
}

function compileConditions(
  conditions: PageConditions | undefined,
  resolver: ReferenceResolver,
): Record<string, unknown> {
  const variableValue =
    conditions?.variable && typeof conditions.variable.value === "number"
      ? conditions.variable.value
      : 0;

  return {
    actorId: conditions?.actor ? resolver.resolveReference(conditions.actor) : 0,
    actorValid: conditions?.actor !== undefined,
    itemId: conditions?.item ? resolver.resolveReference(conditions.item) : 0,
    itemValid: conditions?.item !== undefined,
    selfSwitchCh: conditions?.selfSwitch ?? "A",
    selfSwitchValid: conditions?.selfSwitch !== undefined,
    switch1Id: conditions?.switch1 ? resolver.resolveReference(conditions.switch1) : 0,
    switch1Valid: conditions?.switch1 !== undefined,
    switch2Id: conditions?.switch2 ? resolver.resolveReference(conditions.switch2) : 0,
    switch2Valid: conditions?.switch2 !== undefined,
    variableId: conditions?.variable ? resolver.resolveReference(conditions.variable.ref) : 0,
    variableValid: conditions?.variable !== undefined,
    variableValue,
  };
}

function commonEventTriggerToCode(trigger: CommonEventDefinition["trigger"]): number {
  switch (trigger) {
    case "none":
      return 0;
    case "autorun":
      return 1;
    case "parallel":
      return 2;
  }
}

function getReferenceId<TKind extends ReferenceKind>(ref: ReferenceValue<TKind>): number {
  if ("id" in ref) {
    return ref.id;
  }

  return 0;
}
