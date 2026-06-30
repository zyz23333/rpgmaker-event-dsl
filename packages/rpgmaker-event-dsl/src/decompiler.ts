import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseMapInfos, type MapInfoEntry } from "./project.js";
import type { WorkspaceStatePaths } from "./state.js";

type RawEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};

type RenderedCommand = {
  expression: string;
  helperNames: readonly string[];
  nextIndex: number;
};

export type DecompiledCommandListRendering = {
  helperNames: readonly string[];
  source: string;
};

type SnapshotMapEvent = {
  id: number;
  name: string;
  x: number;
  y: number;
  pages: SnapshotMapEventPage[];
};

type SnapshotMapEventPage = {
  conditions?: Record<string, unknown>;
  list?: RawEventCommand[];
  trigger?: number;
};

type SnapshotCommonEvent = {
  id: number;
  list?: RawEventCommand[];
  name: string;
  switchId?: number;
  trigger?: number;
};

type DecompileFile = {
  content: string;
  path: string;
};

export type DecompileProjectDataSnapshotOptions = {
  sourceRoot: string;
  statePaths: WorkspaceStatePaths;
  workspaceRoot: string;
};

export async function decompileProjectDataSnapshot(
  options: DecompileProjectDataSnapshotOptions,
): Promise<void> {
  const files = await buildDecompiledSourceFiles(options);

  await assertTargetFilesDoNotExist(files);

  for (const file of files) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, "utf8");
  }
}

async function buildDecompiledSourceFiles(
  options: DecompileProjectDataSnapshotOptions,
): Promise<DecompileFile[]> {
  const mapInfos = parseMapInfos(await readSnapshotFile(options.statePaths, "MapInfos.json"));
  const outputRoot = resolve(options.workspaceRoot, options.sourceRoot, "decompiled");
  const files: DecompileFile[] = [];

  for (const mapInfo of mapInfos) {
    const mapFileName = formatMapFileName(mapInfo.id);
    const mapData = await readSnapshotObject(options.statePaths, mapFileName);
    files.push({
      content: renderMapSource(mapInfo, readMapEvents(mapData)),
      path: resolve(outputRoot, "maps", `${mapFileName.slice(0, -".json".length)}.events.ts`),
    });
  }

  files.push({
    content: renderCommonEventsSource(
      readCommonEvents(await readSnapshotArray(options.statePaths, "CommonEvents.json")),
    ),
    path: resolve(outputRoot, "common-events.events.ts"),
  });

  files.push({
    content: renderSystemSource(await readSnapshotObject(options.statePaths, "System.json")),
    path: resolve(outputRoot, "system.dsl.ts"),
  });

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function assertTargetFilesDoNotExist(files: readonly DecompileFile[]): Promise<void> {
  const existingFiles: string[] = [];

  // Decompile is intentionally all-or-nothing so existing hand-maintained source is never mixed
  // with a partially written generated layout.
  for (const file of files) {
    const targetStats = await stat(file.path).catch((error: unknown) => {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    });

    if (targetStats !== null) {
      existingFiles.push(file.path);
    }
  }

  if (existingFiles.length > 0) {
    throw new Error(
      [
        "Decompile output already exists. Remove it before running decompile again.",
        ...existingFiles.map((filePath) => `- ${filePath}`),
      ].join("\n"),
    );
  }
}

function renderMapSource(mapInfo: MapInfoEntry, events: readonly SnapshotMapEvent[]): string {
  if (events.length === 0) {
    return renderEmptyModule();
  }

  const names = createExportNameAllocator();
  const body = events
    .map((event) => {
      const exportName = names.create("mapEvent", event.name, event.id);
      return `export const ${exportName} = mapEvent({
  mapId: ${mapInfo.id},
  id: ${event.id},
  name: ${literal(event.name)},
  x: ${event.x},
  y: ${event.y},
  pages: [
${indentLines(event.pages.map(renderPage).join(",\n"), 4)}
  ],
});`;
    })
    .join("\n\n");

  return `${renderEventImport([
    "mapEvent",
    "page",
    ...collectConditionHelperNames(
      events.flatMap((event) => event.pages.map((page) => page.conditions)),
    ),
    ...collectCommandHelperNames(
      events.flatMap((event) => event.pages.flatMap((page) => normalizeCommandList(page.list))),
    ),
  ])}\n\n${body}\n`;
}

function renderCommonEventsSource(events: readonly SnapshotCommonEvent[]): string {
  if (events.length === 0) {
    return renderEmptyModule();
  }

  const names = createExportNameAllocator();
  const body = events
    .map((event) => {
      const exportName = names.create("commonEvent", event.name, event.id);
      const trigger = commonEventTriggerFromCode(event.trigger);
      const switchLine =
        trigger === "none"
          ? ""
          : `\n  switch: switchRef({ id: ${readPositiveInteger(event.switchId) ?? 1} }),`;

      return `export const ${exportName} = commonEvent({
  id: ${event.id},
  name: ${literal(event.name)},
  trigger: ${literal(trigger)},${switchLine}
  commands: [
${indentLines(renderCommands(normalizeCommandList(event.list)), 4)}
  ],
});`;
    })
    .join("\n\n");

  return `${renderEventImport([
    "commonEvent",
    ...(events.some((event) => commonEventTriggerFromCode(event.trigger) !== "none")
      ? ["switchRef"]
      : []),
    ...collectCommandHelperNames(events.flatMap((event) => normalizeCommandList(event.list))),
  ])}\n\n${body}\n`;
}

function renderSystemSource(system: Record<string, unknown>): string {
  const switches = readNamedSystemEntries(system.switches);
  const variables = readNamedSystemEntries(system.variables);
  const declarations: string[] = [];
  const names = createExportNameAllocator();

  for (const entry of switches) {
    declarations.push(`export const ${names.create("switch", entry.name, entry.id)} = switchDefinition({
  id: ${entry.id},
  name: ${literal(entry.name)},
});`);
  }

  for (const entry of variables) {
    declarations.push(`export const ${names.create("variable", entry.name, entry.id)} = variableDefinition({
  id: ${entry.id},
  name: ${literal(entry.name)},
});`);
  }

  if (declarations.length === 0) {
    return renderEmptyModule();
  }

  return `import { switchDefinition, variableDefinition } from "rpgmaker-event-dsl";\n\n${declarations.join(
    "\n\n",
  )}\n`;
}

function renderPage(page: SnapshotMapEventPage): string {
  return `page({
  conditions: ${renderPageConditions(page.conditions)},
  trigger: ${literal(mapPageTriggerFromCode(page.trigger))},
  commands: [
${indentLines(renderCommands(normalizeCommandList(page.list)), 4)}
  ],
})`;
}

export function renderDecompiledCommandList(
  commands: readonly RawEventCommand[],
): DecompiledCommandListRendering {
  const rendered: string[] = [];
  const helperNames = new Set<string>();

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];

    if (command === undefined || command.code === 0) {
      continue;
    }

    const commandRendering = renderCommandAt(commands, index);
    rendered.push(commandRendering.expression);
    for (const helperName of commandRendering.helperNames) {
      helperNames.add(helperName);
    }
    index = commandRendering.nextIndex;
  }

  return {
    helperNames: [...helperNames].sort((left, right) => left.localeCompare(right)),
    source: rendered.map((line) => `${line},`).join("\n"),
  };
}

function renderCommands(commands: readonly RawEventCommand[]): string {
  return renderDecompiledCommandList(commands).source;
}

function renderCommandAt(commands: readonly RawEventCommand[], index: number): RenderedCommand {
  const command = commands[index];

  if (command === undefined) {
    throw new Error("Cannot render missing event command.");
  }

  switch (command.code) {
    case 101:
      return renderShowTextCommand(commands, index);
    case 102:
      return renderShowChoicesCommand(commands, index);
    case 105:
      return renderShowScrollingTextCommand(commands, index);
    case 108:
      return renderCommentCommand(commands, index);
    case 111:
      return renderConditionalCommand(commands, index);
    default:
      return renderSimpleOrRawCommand(command, index);
  }
}

function renderShowTextCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Show Text command.");
  }

  const lines: string[] = [];
  let nextIndex = index;
  const faceName = command.parameters[0];
  const faceIndex = command.parameters[1];
  const background = command.parameters[2];
  const positionType = command.parameters[3];

  if (
    typeof faceName !== "string" ||
    typeof faceIndex !== "number" ||
    !isMessageBackground(background) ||
    !isMessagePositionType(positionType)
  ) {
    return renderSimpleOrRawCommand(command, index);
  }

  // MV stores Show Text bodies as 401 continuation commands owned by the parent command.
  while (
    commands[nextIndex + 1]?.code === 401 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const next = commands[nextIndex + 1];
    const line = next?.parameters[0];
    lines.push(typeof line === "string" ? line : "");
    nextIndex += 1;
  }

  const fields = [`lines: ${literal(lines.length > 0 ? lines : [""])}`];
  const helperNames = ["showText"];

  if (faceName.length > 0) {
    fields.push(
      `face: { image: imageAsset({ folder: "faces", name: ${literal(faceName)} }), index: ${faceIndex} }`,
    );
    helperNames.push("imageAsset");
  }
  if (background !== 0) {
    fields.push(`background: ${background}`);
  }
  if (positionType !== 2) {
    fields.push(`positionType: ${positionType}`);
  }

  return {
    expression: `showText({ ${fields.join(", ")} })`,
    helperNames,
    nextIndex,
  };
}

function renderShowChoicesCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Show Choices command.");
  }

  const choices = command.parameters[0];
  const cancelType = command.parameters[1];
  const defaultType = command.parameters[2];
  const positionType = command.parameters[3];
  const background = command.parameters[4];

  if (
    !isStringArray(choices) ||
    choices.length === 0 ||
    typeof cancelType !== "number" ||
    typeof defaultType !== "number" ||
    !isMessagePositionType(positionType) ||
    !isMessageBackground(background)
  ) {
    return renderSimpleOrRawCommand(command, index);
  }

  const helperNames = new Set<string>(["showChoices"]);
  const branches = Array.from({ length: choices.length }, () => [] as RawEventCommand[]);
  let cancelBranch: RawEventCommand[] | null = null;
  let nextIndex = index;

  while (commands[nextIndex + 1]?.indent === command.indent) {
    const branchCommand = commands[nextIndex + 1];
    if (branchCommand === undefined || (branchCommand.code !== 402 && branchCommand.code !== 403)) {
      break;
    }

    const branchEndIndex = findMessageBranchEnd(commands, nextIndex + 2, command.indent);
    const body = commands.slice(nextIndex + 2, branchEndIndex);

    if (branchCommand.code === 402) {
      const choiceIndex = branchCommand.parameters[0];
      if (
        typeof choiceIndex !== "number" ||
        !Number.isInteger(choiceIndex) ||
        choiceIndex < 0 ||
        choiceIndex >= choices.length
      ) {
        break;
      }
      branches[choiceIndex] = body;
    } else {
      cancelBranch = body;
    }

    nextIndex = branchEndIndex - 1;
  }

  const branchExpressions = branches.map((branch) => {
    const rendered = renderDecompiledCommandList(branch);
    for (const helperName of rendered.helperNames) {
      helperNames.add(helperName);
    }
    return `[${renderInlineCommandListSource(rendered.source)}]`;
  });

  const fields = [`choices: ${literal(choices)}`, `branches: [${branchExpressions.join(", ")}]`];

  if (cancelType !== -1) {
    fields.push(`cancelType: ${cancelType}`);
  }
  if (defaultType !== 0) {
    fields.push(`defaultType: ${defaultType}`);
  }
  if (positionType !== 2) {
    fields.push(`positionType: ${positionType}`);
  }
  if (background !== 0) {
    fields.push(`background: ${background}`);
  }
  if (cancelBranch !== null) {
    const renderedCancelBranch = renderDecompiledCommandList(cancelBranch);
    for (const helperName of renderedCancelBranch.helperNames) {
      helperNames.add(helperName);
    }
    fields.push(`cancelBranch: [${renderInlineCommandListSource(renderedCancelBranch.source)}]`);
  }

  return {
    expression: `showChoices({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

function renderShowScrollingTextCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Show Scrolling Text command.");
  }

  const speed = command.parameters[0];
  const noFastForward = command.parameters[1];
  if (typeof speed !== "number" || typeof noFastForward !== "boolean") {
    return renderSimpleOrRawCommand(command, index);
  }

  const lines: string[] = [];
  let nextIndex = index;

  while (
    commands[nextIndex + 1]?.code === 405 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const next = commands[nextIndex + 1];
    const line = next?.parameters[0];
    if (typeof line !== "string") {
      break;
    }
    lines.push(line);
    nextIndex += 1;
  }

  const fields = [`lines: ${literal(lines.length > 0 ? lines : [""])}`];
  if (speed !== 2) {
    fields.push(`speed: ${speed}`);
  }
  if (noFastForward) {
    fields.push("noFastForward: true");
  }

  return {
    expression: `showScrollingText({ ${fields.join(", ")} })`,
    helperNames: ["showScrollingText"],
    nextIndex,
  };
}

function renderConditionalCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Conditional Branch command.");
  }

  const condition = renderConditionalBranchCondition(command.parameters);
  if (condition === null) {
    return renderSimpleOrRawCommand(command, index);
  }

  const helperNames = new Set<string>(["conditional", ...condition.helperNames]);
  const thenEndIndex = findConditionalBranchBodyEnd(commands, index + 1, command.indent);
  const thenCommands = commands.slice(index + 1, thenEndIndex);
  const renderedThen = renderDecompiledCommandList(thenCommands);

  for (const helperName of renderedThen.helperNames) {
    helperNames.add(helperName);
  }

  const fields = [
    `condition: ${condition.expression}`,
    `then: [${renderInlineCommandListSource(renderedThen.source)}]`,
  ];
  let nextIndex = thenEndIndex - 1;

  if (commands[thenEndIndex]?.code === 411 && commands[thenEndIndex]?.indent === command.indent) {
    const elseEndIndex = findConditionalBranchBodyEnd(commands, thenEndIndex + 1, command.indent);
    const renderedElse = renderDecompiledCommandList(
      commands.slice(thenEndIndex + 1, elseEndIndex),
    );

    for (const helperName of renderedElse.helperNames) {
      helperNames.add(helperName);
    }

    fields.push(`else: [${renderInlineCommandListSource(renderedElse.source)}]`);
    nextIndex = elseEndIndex - 1;
  }

  return {
    expression: `conditional({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

function renderCommentCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Comment command.");
  }

  const lines = [readStringParameter(command.parameters[0])];
  let nextIndex = index;

  while (
    commands[nextIndex + 1]?.code === 408 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const next = commands[nextIndex + 1];
    lines.push(readStringParameter(next?.parameters[0]));
    nextIndex += 1;
  }

  return {
    expression: `comment(${literal(lines)})`,
    helperNames: ["comment"],
    nextIndex,
  };
}

function renderSimpleOrRawCommand(command: RawEventCommand, index: number): RenderedCommand {
  const helper = renderSimpleCommand(command);

  if (helper !== null) {
    return {
      expression: helper.expression,
      helperNames: helper.helperNames,
      nextIndex: index,
    };
  }

  return {
    expression: renderRawCommand(command),
    helperNames: ["rawDslCommand"],
    nextIndex: index,
  };
}

function renderSimpleCommand(command: RawEventCommand): Omit<RenderedCommand, "nextIndex"> | null {
  switch (command.code) {
    case 117: {
      const commonEventId = readPositiveInteger(command.parameters[0]);
      return commonEventId === null
        ? null
        : {
            expression: `callCommonEvent(commonEventRef({ id: ${commonEventId} }))`,
            helperNames: ["callCommonEvent", "commonEventRef"],
          };
    }
    case 118:
      return {
        expression: `label(${literal(readStringParameter(command.parameters[0]))})`,
        helperNames: ["label"],
      };
    case 119:
      return {
        expression: `jumpToLabel(${literal(readStringParameter(command.parameters[0]))})`,
        helperNames: ["jumpToLabel"],
      };
    case 121: {
      const startSwitchId = readPositiveInteger(command.parameters[0]);
      const endSwitchId = readPositiveInteger(command.parameters[1]);
      const value = readControlValue(command.parameters[2]);
      return startSwitchId === null || endSwitchId === null || value === null
        ? null
        : {
            expression: `controlSwitches({ switch: ${renderReferenceTarget("switchRef", startSwitchId, endSwitchId)}, value: ${value} })`,
            helperNames: ["controlSwitches", "switchRef"],
          };
    }
    case 122:
      return renderControlVariables(command);
    case 123: {
      const selfSwitch = command.parameters[0];
      const value = readControlValue(command.parameters[1]);
      return isSelfSwitch(selfSwitch) && value !== null
        ? {
            expression: `controlSelfSwitch({ selfSwitch: ${literal(selfSwitch)}, value: ${value} })`,
            helperNames: ["controlSelfSwitch"],
          }
        : null;
    }
    case 124: {
      const action = command.parameters[0];
      const seconds = command.parameters[1];
      if (action === 0 && typeof seconds === "number") {
        return {
          expression: `controlTimer({ action: "start", seconds: ${seconds} })`,
          helperNames: ["controlTimer"],
        };
      }
      if (action === 1) {
        return {
          expression: `controlTimer({ action: "stop" })`,
          helperNames: ["controlTimer"],
        };
      }
      return null;
    }
    case 125: {
      const operand = renderOperateValueOperand(
        command.parameters[0],
        command.parameters[1],
        command.parameters[2],
      );
      return operand === null
        ? null
        : {
            expression: `changeGold({ operation: ${literal(operand.operation)}, value: ${operand.expression} })`,
            helperNames: ["changeGold", ...operand.helperNames],
          };
    }
    case 103: {
      const variableId = readPositiveInteger(command.parameters[0]);
      const digits = command.parameters[1];
      return variableId !== null && typeof digits === "number"
        ? {
            expression: `inputNumber({ variable: variableRef({ id: ${variableId} }), digits: ${digits} })`,
            helperNames: ["inputNumber", "variableRef"],
          }
        : null;
    }
    case 104: {
      const variableId = readPositiveInteger(command.parameters[0]);
      const itemType = command.parameters[1];
      return variableId !== null && isItemType(itemType)
        ? {
            expression: `selectItem({ variable: variableRef({ id: ${variableId} }), itemType: ${itemType} })`,
            helperNames: ["selectItem", "variableRef"],
          }
        : null;
    }
    case 126: {
      const itemId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      return itemId === null || operand === null
        ? null
        : {
            expression: `changeItems({ item: itemRef({ id: ${itemId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression} })`,
            helperNames: ["changeItems", "itemRef", ...operand.helperNames],
          };
    }
    case 127: {
      const weaponId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      const includeEquipment = command.parameters[4];
      return weaponId === null || operand === null || typeof includeEquipment !== "boolean"
        ? null
        : {
            expression: `changeWeapons({ weapon: weaponRef({ id: ${weaponId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression}, includeEquipment: ${includeEquipment} })`,
            helperNames: ["changeWeapons", "weaponRef", ...operand.helperNames],
          };
    }
    case 128: {
      const armorId = readPositiveInteger(command.parameters[0]);
      const operand = renderOperateValueOperand(
        command.parameters[1],
        command.parameters[2],
        command.parameters[3],
      );
      const includeEquipment = command.parameters[4];
      return armorId === null || operand === null || typeof includeEquipment !== "boolean"
        ? null
        : {
            expression: `changeArmors({ armor: armorRef({ id: ${armorId} }), operation: ${literal(operand.operation)}, amount: ${operand.expression}, includeEquipment: ${includeEquipment} })`,
            helperNames: ["armorRef", "changeArmors", ...operand.helperNames],
          };
    }
    case 129: {
      const actorId = readPositiveInteger(command.parameters[0]);
      const operation = command.parameters[1];
      const initialize = command.parameters[2];
      return actorId === null ||
        (operation !== 0 && operation !== 1) ||
        typeof initialize !== "boolean"
        ? null
        : {
            expression: `changePartyMember({ actor: actorRef({ id: ${actorId} }), operation: ${literal(operation === 0 ? "add" : "remove")}, initialize: ${initialize} })`,
            helperNames: ["actorRef", "changePartyMember"],
          };
    }
    case 201:
      return renderTransferPlayer(command);
    case 202:
      return renderSetVehicleLocation(command);
    case 203:
      return renderSetEventLocation(command);
    case 204:
      return renderScrollMap(command);
    case 206:
      return command.parameters.length === 0
        ? {
            expression: "getOnOffVehicle()",
            helperNames: ["getOnOffVehicle"],
          }
        : null;
    case 214:
      return {
        expression: "eraseEvent()",
        helperNames: ["eraseEvent"],
      };
    case 230: {
      const frames = command.parameters[0];
      return typeof frames === "number"
        ? {
            expression: `wait(${frames})`,
            helperNames: ["wait"],
          }
        : null;
    }
    default:
      return null;
  }
}

function renderTransferPlayer(command: RawEventCommand): Omit<RenderedCommand, "nextIndex"> | null {
  const designation = command.parameters[0];
  const direction = command.parameters[4];
  const fadeType = command.parameters[5];

  if (!isDirection(direction) || !isFadeType(fadeType)) {
    return null;
  }

  if (designation === 0) {
    const mapId = readPositiveInteger(command.parameters[1]);
    const x = command.parameters[2];
    const y = command.parameters[3];
    return mapId === null || typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `transferPlayer({ destination: { kind: "direct", map: mapRef({ id: ${mapId} }), x: ${x}, y: ${y} }${renderOptionalDirectionAndFade(direction, fadeType)} })`,
          helperNames: ["mapRef", "transferPlayer"],
        };
  }

  if (designation === 1) {
    const mapVariableId = readPositiveInteger(command.parameters[1]);
    const xVariableId = readPositiveInteger(command.parameters[2]);
    const yVariableId = readPositiveInteger(command.parameters[3]);
    return mapVariableId === null || xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `transferPlayer({ destination: { kind: "variables", map: variableRef({ id: ${mapVariableId} }), x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) }${renderOptionalDirectionAndFade(direction, fadeType)} })`,
          helperNames: ["transferPlayer", "variableRef"],
        };
  }

  return null;
}

function renderSetVehicleLocation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const vehicle = vehicleFromCode(command.parameters[0]);
  const designation = command.parameters[1];
  if (vehicle === null) {
    return null;
  }

  if (designation === 0) {
    const mapId = readPositiveInteger(command.parameters[2]);
    const x = command.parameters[3];
    const y = command.parameters[4];
    return mapId === null || typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `setVehicleLocation({ vehicle: ${literal(vehicle)}, destination: { kind: "direct", map: mapRef({ id: ${mapId} }), x: ${x}, y: ${y} } })`,
          helperNames: ["mapRef", "setVehicleLocation"],
        };
  }

  if (designation === 1) {
    const mapVariableId = readPositiveInteger(command.parameters[2]);
    const xVariableId = readPositiveInteger(command.parameters[3]);
    const yVariableId = readPositiveInteger(command.parameters[4]);
    return mapVariableId === null || xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `setVehicleLocation({ vehicle: ${literal(vehicle)}, destination: { kind: "variables", map: variableRef({ id: ${mapVariableId} }), x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) } })`,
          helperNames: ["setVehicleLocation", "variableRef"],
        };
  }

  return null;
}

function renderSetEventLocation(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const character = renderCharacterRuntimeSelector(command.parameters[0]);
  const designation = command.parameters[1];
  const direction = command.parameters[4];
  if (character === null || !isEventLocationDirection(direction)) {
    return null;
  }

  if (designation === 0) {
    const x = command.parameters[2];
    const y = command.parameters[3];
    return typeof x !== "number" || typeof y !== "number"
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "direct", x: ${x}, y: ${y} }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation"],
        };
  }

  if (designation === 1) {
    const xVariableId = readPositiveInteger(command.parameters[2]);
    const yVariableId = readPositiveInteger(command.parameters[3]);
    return xVariableId === null || yVariableId === null
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "variables", x: variableRef({ id: ${xVariableId} }), y: variableRef({ id: ${yVariableId} }) }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation", "variableRef"],
        };
  }

  if (designation === 2) {
    const exchangeCharacter = renderCharacterRuntimeSelector(command.parameters[2]);
    return exchangeCharacter === null
      ? null
      : {
          expression: `setEventLocation({ character: ${character.expression}, destination: { kind: "exchange", character: ${exchangeCharacter.expression} }${renderOptionalEventDirection(direction)} })`,
          helperNames: ["setEventLocation"],
        };
  }

  return null;
}

function renderScrollMap(command: RawEventCommand): Omit<RenderedCommand, "nextIndex"> | null {
  const direction = command.parameters[0];
  const distance = command.parameters[1];
  const speed = command.parameters[2];

  return isDirection(direction) && typeof distance === "number" && typeof speed === "number"
    ? {
        expression: `scrollMap({ direction: ${direction}, distance: ${distance}, speed: ${speed} })`,
        helperNames: ["scrollMap"],
      }
    : null;
}

function renderControlVariables(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const startVariableId = readPositiveInteger(command.parameters[0]);
  const endVariableId = readPositiveInteger(command.parameters[1]);
  const operationCode = command.parameters[2];
  const operandKind = command.parameters[3];

  if (
    startVariableId === null ||
    endVariableId === null ||
    typeof operationCode !== "number" ||
    typeof operandKind !== "number"
  ) {
    return null;
  }

  const operation = controlVariablesOperationFromCode(operationCode);
  if (operation === null) {
    return null;
  }

  if (operandKind === 0 && typeof command.parameters[4] === "number") {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: ${command.parameters[4]} })`,
      helperNames: ["controlVariables", "variableRef"],
    };
  }

  if (operandKind === 1) {
    const sourceVariableId = readPositiveInteger(command.parameters[4]);
    return sourceVariableId === null
      ? null
      : {
          expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: variableRef({ id: ${sourceVariableId} }) })`,
          helperNames: ["controlVariables", "variableRef"],
        };
  }

  if (
    operandKind === 2 &&
    typeof command.parameters[4] === "number" &&
    typeof command.parameters[5] === "number"
  ) {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: { kind: "random", from: ${command.parameters[4]}, to: ${command.parameters[5]} } })`,
      helperNames: ["controlVariables", "variableRef"],
    };
  }

  if (operandKind === 3) {
    const operand = renderControlVariablesGameDataOperand(
      command.parameters[4],
      command.parameters[5],
      command.parameters[6],
    );
    return operand === null
      ? null
      : {
          expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: ${operand.expression} })`,
          helperNames: ["controlVariables", "variableRef", ...operand.helperNames],
        };
  }

  if (operandKind === 4 && typeof command.parameters[4] === "string") {
    return {
      expression: `controlVariables({ variable: ${renderReferenceTarget("variableRef", startVariableId, endVariableId)}, operation: ${literal(operation)}, value: { kind: "script", script: scriptInput({ code: ${literal(command.parameters[4])} }) } })`,
      helperNames: ["controlVariables", "scriptInput", "variableRef"],
    };
  }

  return null;
}

function renderReferenceTarget(
  helperName: "switchRef" | "variableRef",
  startId: number,
  endId: number,
): string {
  if (startId === endId) {
    return `${helperName}({ id: ${startId} })`;
  }

  return `{ kind: "referenceRange", from: ${helperName}({ id: ${startId} }), to: ${helperName}({ id: ${endId} }) }`;
}

function renderCharacterRuntimeSelector(
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  if (value === -1) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "player" }`,
      helperNames: [],
    };
  }
  if (value === 0) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "currentEvent" }`,
      helperNames: [],
    };
  }
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return {
      expression: `{ kind: "runtimeSelector", scope: "character", target: "event", id: ${value} }`,
      helperNames: [],
    };
  }

  return null;
}

function renderOptionalDirectionAndFade(direction: 2 | 4 | 6 | 8, fadeType: 0 | 1 | 2): string {
  const fields: string[] = [];
  if (direction !== 2) {
    fields.push(`direction: ${direction}`);
  }
  if (fadeType !== 0) {
    fields.push(`fadeType: ${fadeType}`);
  }

  return fields.length === 0 ? "" : `, ${fields.join(", ")}`;
}

function renderOptionalEventDirection(direction: 0 | 2 | 4 | 6 | 8): string {
  return direction === 0 ? "" : `, direction: ${direction}`;
}

function renderOperateValueOperand(
  operationParameter: unknown,
  operandType: unknown,
  operand: unknown,
): { expression: string; helperNames: readonly string[]; operation: "gain" | "lose" } | null {
  const operation = operationParameter === 0 ? "gain" : operationParameter === 1 ? "lose" : null;
  if (operation === null) {
    return null;
  }

  if (operandType === 0 && typeof operand === "number") {
    return { expression: `${operand}`, helperNames: [], operation };
  }

  if (operandType === 1) {
    const variableId = readPositiveInteger(operand);
    return variableId === null
      ? null
      : {
          expression: `variableRef({ id: ${variableId} })`,
          helperNames: ["variableRef"],
          operation,
        };
  }

  return null;
}

function renderControlVariablesGameDataOperand(
  type: unknown,
  param1: unknown,
  param2: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  switch (type) {
    case 0: {
      const itemId = readPositiveInteger(param1);
      return itemId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "item", item: itemRef({ id: ${itemId} }) }`,
            helperNames: ["itemRef"],
          };
    }
    case 1: {
      const weaponId = readPositiveInteger(param1);
      return weaponId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "weapon", weapon: weaponRef({ id: ${weaponId} }) }`,
            helperNames: ["weaponRef"],
          };
    }
    case 2: {
      const armorId = readPositiveInteger(param1);
      return armorId === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "armor", armor: armorRef({ id: ${armorId} }) }`,
            helperNames: ["armorRef"],
          };
    }
    case 3:
      return renderActorGameDataOperand(param1, param2);
    case 4:
      return renderEnemyGameDataOperand(param1, param2);
    case 5:
      return renderCharacterGameDataOperand(param1, param2);
    case 6:
      return typeof param1 === "number" && Number.isInteger(param1) && param1 >= 0
        ? {
            expression: `{ kind: "gameData", source: "party", memberIndex: ${param1} }`,
            helperNames: [],
          }
        : null;
    case 7: {
      const value = otherGameDataValueFromCode(param1);
      return value === null
        ? null
        : {
            expression: `{ kind: "gameData", source: "other", value: ${literal(value)} }`,
            helperNames: [],
          };
    }
    default:
      return null;
  }
}

function renderActorGameDataOperand(
  actorParameter: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const actorId = readPositiveInteger(actorParameter);
  const value = actorGameDataValueFromCode(valueParameter);
  return actorId === null || value === null
    ? null
    : {
        expression: `{ kind: "gameData", source: "actor", actor: actorRef({ id: ${actorId} }), value: ${literal(value)} }`,
        helperNames: ["actorRef"],
      };
}

function renderEnemyGameDataOperand(
  enemyIndex: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const value = enemyGameDataValueFromCode(valueParameter);
  return typeof enemyIndex === "number" &&
    Number.isInteger(enemyIndex) &&
    enemyIndex >= 0 &&
    value !== null
    ? {
        expression: `{ kind: "gameData", source: "enemy", enemyIndex: ${enemyIndex}, value: ${literal(value)} }`,
        helperNames: [],
      }
    : null;
}

function renderCharacterGameDataOperand(
  characterId: unknown,
  valueParameter: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const value = characterGameDataValueFromCode(valueParameter);
  return typeof characterId === "number" && Number.isInteger(characterId) && value !== null
    ? {
        expression: `{ kind: "gameData", source: "character", characterId: ${characterId}, value: ${literal(value)} }`,
        helperNames: [],
      }
    : null;
}

function renderConditionalBranchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  switch (parameters[0]) {
    case 0:
      return renderSwitchCondition(parameters);
    case 1:
      return renderVariableCondition(parameters);
    case 2:
      return renderSelfSwitchCondition(parameters);
    case 3:
      return renderTimerCondition(parameters);
    case 4:
      return renderActorCondition(parameters);
    case 5:
      return renderEnemyCondition(parameters);
    case 6:
      return renderCharacterCondition(parameters);
    case 7:
      return renderGoldCondition(parameters);
    case 8:
      return renderItemCondition(parameters);
    case 9:
      return renderWeaponCondition(parameters);
    case 10:
      return renderArmorCondition(parameters);
    case 11:
      return renderButtonCondition(parameters);
    case 12:
      return typeof parameters[1] === "string"
        ? {
            expression: `{
  kind: "script",
  script: scriptInput({ code: ${literal(parameters[1])} }),
}`,
            helperNames: ["scriptInput"],
          }
        : null;
    case 13:
      return renderVehicleCondition(parameters);
    default:
      return null;
  }
}

function renderSwitchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const switchId = readPositiveInteger(parameters[1]);
  const value = readControlValue(parameters[2]);

  return switchId === null || value === null
    ? null
    : {
        expression: `{ kind: "switch", switch: switchRef({ id: ${switchId} }), value: ${value} }`,
        helperNames: ["switchRef"],
      };
}

function renderVariableCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const variableId = readPositiveInteger(parameters[1]);
  const operandKind = parameters[2];
  const operator = conditionalVariableOperatorFromCode(parameters[4]);

  if (variableId === null || operator === null) {
    return null;
  }

  if (operandKind === 0 && typeof parameters[3] === "number") {
    return {
      expression: `{ kind: "variable", variable: variableRef({ id: ${variableId} }), operator: ${literal(operator)}, value: ${parameters[3]} }`,
      helperNames: ["variableRef"],
    };
  }

  if (operandKind === 1) {
    const sourceVariableId = readPositiveInteger(parameters[3]);
    return sourceVariableId === null
      ? null
      : {
          expression: `{ kind: "variable", variable: variableRef({ id: ${variableId} }), operator: ${literal(operator)}, value: variableRef({ id: ${sourceVariableId} }) }`,
          helperNames: ["variableRef"],
        };
  }

  return null;
}

function renderSelfSwitchCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const selfSwitch = parameters[1];
  const value = readControlValue(parameters[2]);

  return isSelfSwitch(selfSwitch) && value !== null
    ? {
        expression: `{ kind: "selfSwitch", selfSwitch: ${literal(selfSwitch)}, value: ${value} }`,
        helperNames: [],
      }
    : null;
}

function renderTimerCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const seconds = parameters[1];
  const operator = parameters[2] === 0 ? "ge" : parameters[2] === 1 ? "le" : null;

  return typeof seconds === "number" && operator !== null
    ? {
        expression: `{ kind: "timer", seconds: ${seconds}, operator: ${literal(operator)} }`,
        helperNames: [],
      }
    : null;
}

function renderActorCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const actorId = readPositiveInteger(parameters[1]);
  if (actorId === null) {
    return null;
  }

  const check = renderActorConditionCheck(parameters[2], parameters[3]);
  if (check === null) {
    return null;
  }

  return {
    expression: `{ kind: "actor", actor: actorRef({ id: ${actorId} }), check: ${check.expression} }`,
    helperNames: ["actorRef", ...check.helperNames],
  };
}

function renderActorConditionCheck(
  checkKind: unknown,
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  switch (checkKind) {
    case 0:
      return { expression: `{ kind: "inParty" }`, helperNames: [] };
    case 1:
      return typeof value === "string"
        ? { expression: `{ kind: "name", name: ${literal(value)} }`, helperNames: [] }
        : null;
    case 2:
      return renderReferencedActorCheck("class", "classRef", value);
    case 3:
      return renderReferencedActorCheck("skill", "skillRef", value);
    case 4:
      return renderReferencedActorCheck("weapon", "weaponRef", value);
    case 5:
      return renderReferencedActorCheck("armor", "armorRef", value);
    case 6:
      return renderReferencedActorCheck("state", "stateRef", value);
    default:
      return null;
  }
}

function renderReferencedActorCheck(
  kind: "armor" | "class" | "skill" | "state" | "weapon",
  helperName: "armorRef" | "classRef" | "skillRef" | "stateRef" | "weaponRef",
  value: unknown,
): { expression: string; helperNames: readonly string[] } | null {
  const id = readPositiveInteger(value);
  return id === null
    ? null
    : {
        expression: `{ kind: ${literal(kind)}, ${kind}: ${helperName}({ id: ${id} }) }`,
        helperNames: [helperName],
      };
}

function renderEnemyCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const enemyIndex = parameters[1];
  if (typeof enemyIndex !== "number" || !Number.isInteger(enemyIndex) || enemyIndex < 0) {
    return null;
  }

  if (parameters[2] === 0) {
    return {
      expression: `{ kind: "enemy", enemyIndex: ${enemyIndex}, check: { kind: "appeared" } }`,
      helperNames: [],
    };
  }

  if (parameters[2] === 1) {
    const stateId = readPositiveInteger(parameters[3]);
    return stateId === null
      ? null
      : {
          expression: `{ kind: "enemy", enemyIndex: ${enemyIndex}, check: { kind: "state", state: stateRef({ id: ${stateId} }) } }`,
          helperNames: ["stateRef"],
        };
  }

  return null;
}

function renderCharacterCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const characterId = parameters[1];
  const direction = parameters[2];

  return typeof characterId === "number" && isDirection(direction)
    ? {
        expression: `{ kind: "character", characterId: ${characterId}, direction: ${direction} }`,
        helperNames: [],
      }
    : null;
}

function renderGoldCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const amount = parameters[1];
  const operator =
    parameters[2] === 0 ? "ge" : parameters[2] === 1 ? "le" : parameters[2] === 2 ? "lt" : null;

  return typeof amount === "number" && operator !== null
    ? {
        expression: `{ kind: "gold", amount: ${amount}, operator: ${literal(operator)} }`,
        helperNames: [],
      }
    : null;
}

function renderItemCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const itemId = readPositiveInteger(parameters[1]);
  return itemId === null
    ? null
    : {
        expression: `{ kind: "item", item: itemRef({ id: ${itemId} }) }`,
        helperNames: ["itemRef"],
      };
}

function renderWeaponCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const weaponId = readPositiveInteger(parameters[1]);
  return weaponId === null || typeof parameters[2] !== "boolean"
    ? null
    : {
        expression: `{ kind: "weapon", weapon: weaponRef({ id: ${weaponId} }), includeEquipment: ${parameters[2]} }`,
        helperNames: ["weaponRef"],
      };
}

function renderArmorCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const armorId = readPositiveInteger(parameters[1]);
  return armorId === null || typeof parameters[2] !== "boolean"
    ? null
    : {
        expression: `{ kind: "armor", armor: armorRef({ id: ${armorId} }), includeEquipment: ${parameters[2]} }`,
        helperNames: ["armorRef"],
      };
}

function renderButtonCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  return isButtonName(parameters[1])
    ? {
        expression: `{ kind: "button", button: ${literal(parameters[1])} }`,
        helperNames: [],
      }
    : null;
}

function renderVehicleCondition(
  parameters: readonly unknown[],
): { expression: string; helperNames: readonly string[] } | null {
  const vehicle = vehicleFromCode(parameters[1]);

  return vehicle === null
    ? null
    : {
        expression: `{ kind: "vehicle", vehicle: ${literal(vehicle)} }`,
        helperNames: [],
      };
}

function vehicleFromCode(value: unknown): "boat" | "ship" | "airship" | null {
  if (value === 0) {
    return "boat";
  }
  if (value === 1) {
    return "ship";
  }
  if (value === 2) {
    return "airship";
  }

  return null;
}

function renderRawCommand(command: RawEventCommand): string {
  const indentLine = command.indent === 0 ? "" : `\n  indent: ${command.indent},`;

  return `rawDslCommand({
  code: ${command.code},${indentLine}
  parameters: ${literal(command.parameters)},
})`;
}

function findConditionalBranchBodyEnd(
  commands: readonly RawEventCommand[],
  startIndex: number,
  parentIndent: number,
): number {
  let index = startIndex;

  while (index < commands.length) {
    const command = commands[index];
    if (command === undefined || command.code === 0 || command.indent < parentIndent) {
      break;
    }
    if (command.indent === parentIndent && command.code === 411) {
      break;
    }
    if (command.indent <= parentIndent) {
      break;
    }
    index += 1;
  }

  return index;
}

function findMessageBranchEnd(
  commands: readonly RawEventCommand[],
  startIndex: number,
  parentIndent: number,
): number {
  let index = startIndex;

  while (index < commands.length) {
    const command = commands[index];
    if (command === undefined || command.indent <= parentIndent) {
      break;
    }
    index += 1;
  }

  return index;
}

function renderInlineCommandListSource(source: string): string {
  if (source.length === 0) {
    return "";
  }

  return source.replaceAll("\n", " ");
}

function renderPageConditions(conditions: Record<string, unknown> | undefined): string {
  if (conditions === undefined) {
    return "{}";
  }

  const fields: string[] = [];

  if (conditions.switch1Valid === true) {
    const switchId = readPositiveInteger(conditions.switch1Id);
    if (switchId !== null) {
      fields.push(`switch1: switchRef({ id: ${switchId} })`);
    }
  }

  if (conditions.switch2Valid === true) {
    const switchId = readPositiveInteger(conditions.switch2Id);
    if (switchId !== null) {
      fields.push(`switch2: switchRef({ id: ${switchId} })`);
    }
  }

  if (conditions.variableValid === true) {
    const variableId = readPositiveInteger(conditions.variableId);
    if (variableId !== null && typeof conditions.variableValue === "number") {
      fields.push(
        `variable: { ref: variableRef({ id: ${variableId} }), operator: "ge", value: ${conditions.variableValue} }`,
      );
    }
  }

  if (conditions.selfSwitchValid === true && typeof conditions.selfSwitchCh === "string") {
    fields.push(`selfSwitch: ${literal(conditions.selfSwitchCh)}`);
  }

  if (conditions.itemValid === true) {
    const itemId = readPositiveInteger(conditions.itemId);
    if (itemId !== null) {
      fields.push(`item: itemRef({ id: ${itemId} })`);
    }
  }

  if (conditions.actorValid === true) {
    const actorId = readPositiveInteger(conditions.actorId);
    if (actorId !== null) {
      fields.push(`actor: actorRef({ id: ${actorId} })`);
    }
  }

  if (fields.length === 0) {
    return "{}";
  }

  return `{\n${indentLines(fields.map((field) => `${field},`).join("\n"), 4)}\n  }`;
}

function renderEventImport(helpers: readonly string[]): string {
  const uniqueHelpers = [...new Set(helpers)].sort((left, right) => left.localeCompare(right));

  return `import { ${uniqueHelpers.join(", ")} } from "rpgmaker-event-dsl";`;
}

function collectCommandHelperNames(commands: readonly RawEventCommand[]): string[] {
  return [...renderDecompiledCommandList(commands).helperNames];
}

function collectConditionHelperNames(
  conditions: readonly (Record<string, unknown> | undefined)[],
): string[] {
  const helpers = new Set<string>();

  for (const condition of conditions) {
    if (condition?.switch1Valid === true || condition?.switch2Valid === true) {
      helpers.add("switchRef");
    }
    if (condition?.variableValid === true) {
      helpers.add("variableRef");
    }
    if (condition?.itemValid === true) {
      helpers.add("itemRef");
    }
    if (condition?.actorValid === true) {
      helpers.add("actorRef");
    }
  }

  return [...helpers];
}

function readMapEvents(mapData: Record<string, unknown>): SnapshotMapEvent[] {
  const events = Array.isArray(mapData.events) ? mapData.events : [];

  return events.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = readPositiveInteger(record.id);
    if (id === null) {
      return [];
    }

    return [
      {
        id,
        name: typeof record.name === "string" ? record.name : `Event ${id}`,
        pages: readMapEventPages(record.pages),
        x: typeof record.x === "number" ? record.x : 0,
        y: typeof record.y === "number" ? record.y : 0,
      },
    ];
  });
}

function readMapEventPages(value: unknown): SnapshotMapEventPage[] {
  if (!Array.isArray(value)) {
    return [{ conditions: {}, list: [], trigger: 0 }];
  }

  const pages = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    return [
      {
        conditions:
          record.conditions &&
          typeof record.conditions === "object" &&
          !Array.isArray(record.conditions)
            ? (record.conditions as Record<string, unknown>)
            : {},
        list: readRawCommandList(record.list),
        trigger: typeof record.trigger === "number" ? record.trigger : 0,
      },
    ];
  });

  return pages.length > 0 ? pages : [{ conditions: {}, list: [], trigger: 0 }];
}

function readCommonEvents(value: readonly unknown[]): SnapshotCommonEvent[] {
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const id = readPositiveInteger(record.id);
    if (id === null) {
      return [];
    }

    const output: SnapshotCommonEvent = {
      id,
      list: readRawCommandList(record.list),
      name: typeof record.name === "string" ? record.name : `Common Event ${id}`,
      trigger: typeof record.trigger === "number" ? record.trigger : 0,
    };

    if (typeof record.switchId === "number") {
      output.switchId = record.switchId;
    }

    return [output];
  });
}

function readRawCommandList(value: unknown): RawEventCommand[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.code !== "number") {
      return [];
    }

    return [
      {
        code: record.code,
        indent: typeof record.indent === "number" ? record.indent : 0,
        parameters: Array.isArray(record.parameters) ? [...record.parameters] : [],
      },
    ];
  });
}

function normalizeCommandList(commands: readonly RawEventCommand[] | undefined): RawEventCommand[] {
  return commands?.filter((command) => command.code !== 0) ?? [];
}

function readNamedSystemEntries(value: unknown): Array<{ id: number; name: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0 || index === 0) {
      return [];
    }

    return [{ id: index, name: entry }];
  });
}

async function readSnapshotFile(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<string> {
  return readFile(resolve(statePaths.projectDataSnapshotDirectory, relativePath), "utf8");
}

async function readSnapshotArray(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<unknown[]> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON array.`);
  }

  return parsed;
}

async function readSnapshotObject(
  statePaths: WorkspaceStatePaths,
  relativePath: string,
): Promise<Record<string, unknown>> {
  const parsed = JSON.parse(await readSnapshotFile(statePaths, relativePath));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected snapshot ${relativePath} to contain a JSON object.`);
  }

  return parsed as Record<string, unknown>;
}

function renderEmptyModule(): string {
  return "export {};\n";
}

function commonEventTriggerFromCode(value: unknown): "none" | "autorun" | "parallel" {
  if (value === 1) {
    return "autorun";
  }
  if (value === 2) {
    return "parallel";
  }

  return "none";
}

function mapPageTriggerFromCode(
  value: unknown,
): "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel" {
  if (value === 1) {
    return "playerTouch";
  }
  if (value === 2) {
    return "eventTouch";
  }
  if (value === 3) {
    return "autorun";
  }
  if (value === 4) {
    return "parallel";
  }

  return "action";
}

function controlVariablesOperationFromCode(
  value: number,
): "set" | "add" | "sub" | "mul" | "div" | "mod" | null {
  switch (value) {
    case 0:
      return "set";
    case 1:
      return "add";
    case 2:
      return "sub";
    case 3:
      return "mul";
    case 4:
      return "div";
    case 5:
      return "mod";
    default:
      return null;
  }
}

function actorGameDataValueFromCode(
  value: unknown,
):
  | "level"
  | "exp"
  | "hp"
  | "mp"
  | "mhp"
  | "mmp"
  | "atk"
  | "def"
  | "mat"
  | "mdf"
  | "agi"
  | "luk"
  | null {
  switch (value) {
    case 0:
      return "level";
    case 1:
      return "exp";
    case 2:
      return "hp";
    case 3:
      return "mp";
    case 4:
      return "mhp";
    case 5:
      return "mmp";
    case 6:
      return "atk";
    case 7:
      return "def";
    case 8:
      return "mat";
    case 9:
      return "mdf";
    case 10:
      return "agi";
    case 11:
      return "luk";
    default:
      return null;
  }
}

function enemyGameDataValueFromCode(
  value: unknown,
): "hp" | "mp" | "mhp" | "mmp" | "atk" | "def" | "mat" | "mdf" | "agi" | "luk" | null {
  switch (value) {
    case 0:
      return "hp";
    case 1:
      return "mp";
    case 2:
      return "mhp";
    case 3:
      return "mmp";
    case 4:
      return "atk";
    case 5:
      return "def";
    case 6:
      return "mat";
    case 7:
      return "mdf";
    case 8:
      return "agi";
    case 9:
      return "luk";
    default:
      return null;
  }
}

function characterGameDataValueFromCode(
  value: unknown,
): "mapX" | "mapY" | "direction" | "screenX" | "screenY" | null {
  switch (value) {
    case 0:
      return "mapX";
    case 1:
      return "mapY";
    case 2:
      return "direction";
    case 3:
      return "screenX";
    case 4:
      return "screenY";
    default:
      return null;
  }
}

function otherGameDataValueFromCode(
  value: unknown,
):
  | "mapId"
  | "partyMembers"
  | "gold"
  | "steps"
  | "playTime"
  | "timer"
  | "saveCount"
  | "battleCount"
  | "winCount"
  | "escapeCount"
  | null {
  switch (value) {
    case 0:
      return "mapId";
    case 1:
      return "partyMembers";
    case 2:
      return "gold";
    case 3:
      return "steps";
    case 4:
      return "playTime";
    case 5:
      return "timer";
    case 6:
      return "saveCount";
    case 7:
      return "battleCount";
    case 8:
      return "winCount";
    case 9:
      return "escapeCount";
    default:
      return null;
  }
}

function conditionalVariableOperatorFromCode(
  value: unknown,
): "eq" | "ge" | "le" | "gt" | "lt" | "ne" | null {
  switch (value) {
    case 0:
      return "eq";
    case 1:
      return "ge";
    case 2:
      return "le";
    case 3:
      return "gt";
    case 4:
      return "lt";
    case 5:
      return "ne";
    default:
      return null;
  }
}

function createExportNameAllocator(): {
  create(prefix: string, displayName: string, id: number): string;
} {
  const usedNames = new Set<string>();

  return {
    create(prefix, displayName, id) {
      const nameParts = displayName
        .normalize("NFKD")
        .replaceAll(/[^a-zA-Z0-9]+/gu, " ")
        .trim()
        .split(/\s+/u)
        .filter(Boolean);
      const base =
        nameParts.length === 0 ? prefix : `${prefix}${nameParts.map(toPascalCasePart).join("")}`;
      const candidate = `${base}${id.toString().padStart(3, "0")}`;
      let output = candidate;
      let suffix = 2;

      while (usedNames.has(output)) {
        output = `${candidate}_${suffix}`;
        suffix += 1;
      }

      usedNames.add(output);
      return output;
    },
  };
}

function toPascalCasePart(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function formatMapFileName(mapId: number): string {
  return `Map${mapId.toString().padStart(3, "0")}.json`;
}

function indentLines(value: string, spaces: number): string {
  if (value.length === 0) {
    return "";
  }

  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
}

function literal(value: unknown): string {
  return JSON.stringify(value);
}

function readStringParameter(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isMessageBackground(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

function isMessagePositionType(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

function isItemType(value: unknown): value is 1 | 2 | 3 | 4 {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isDirection(value: unknown): value is 2 | 4 | 6 | 8 {
  return value === 2 || value === 4 || value === 6 || value === 8;
}

function isEventLocationDirection(value: unknown): value is 0 | 2 | 4 | 6 | 8 {
  return value === 0 || isDirection(value);
}

function isFadeType(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

function isSelfSwitch(value: unknown): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function isButtonName(
  value: unknown,
): value is "ok" | "cancel" | "shift" | "down" | "left" | "right" | "up" | "pageup" | "pagedown" {
  return (
    value === "ok" ||
    value === "cancel" ||
    value === "shift" ||
    value === "down" ||
    value === "left" ||
    value === "right" ||
    value === "up" ||
    value === "pageup" ||
    value === "pagedown"
  );
}

function readControlValue(value: unknown): boolean | null {
  if (value === 0) {
    return true;
  }
  if (value === 1) {
    return false;
  }

  return null;
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code?: string }).code === "ENOENT"
  );
}
