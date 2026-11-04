import type {
  RawEventCommand,
  RenderCommandList,
  RenderedCommand,
  RenderSimpleCommand,
} from "../../decompiler/types.js";
import {
  isMessageBackground,
  isMessagePositionType,
  isStringArray,
  literal,
} from "../../decompiler/core.js";

export function renderShowTextCommand(
  commands: readonly RawEventCommand[],
  index: number,
  renderSimpleCommand: RenderSimpleCommand,
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
    return renderSimpleCommand(command, index);
  }

  // MV stores Show Text bodies as 401 continuation commands owned by the parent command.
  while (
    commands[nextIndex + 1]?.code === 401 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const next = commands[nextIndex + 1];
    const line = next?.parameters[0];
    lines.push(line as string);
    nextIndex += 1;
  }

  const fields = [`lines: ${literal(lines)}`];
  const helperNames = ["showText"];

  const image =
    faceName === "" ? "null" : `imageAsset({ folder: "faces", name: ${literal(faceName)} })`;
  fields.push(`face: { image: ${image}, index: ${literal(faceIndex)} }`);
  if (faceName !== "") helperNames.push("imageAsset");
  fields.push(`background: ${literal(["window", "dim", "transparent"][background])}`);
  fields.push(`position: ${literal(["top", "middle", "bottom"][positionType])}`);

  return {
    expression: `showText({ ${fields.join(", ")} })`,
    helperNames,
    nextIndex,
  };
}

export function renderShowChoicesCommand(
  commands: readonly RawEventCommand[],
  index: number,
  renderCommandList: RenderCommandList,
  renderSimpleCommand: RenderSimpleCommand,
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
    return renderSimpleCommand(command, index);
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

  if (commands[nextIndex + 1]?.code === 404 && commands[nextIndex + 1]?.indent === command.indent) {
    nextIndex += 1;
  }

  const renderBody = (branch: readonly RawEventCommand[]) => {
    const last = branch.at(-1);
    const marker = last?.code === 0 && last.indent === command.indent + 1;
    const rendered = renderCommandList(marker ? branch.slice(0, -1) : branch);
    for (const helperName of rendered.helperNames) {
      helperNames.add(helperName);
    }
    return `commands: [${renderInlineCommandListSource(rendered.source)}]${marker ? "" : ', endMarker: "absent"'}`;
  };
  const branchExpressions = branches.map(
    (branch, branchIndex) => `{ text: ${literal(choices[branchIndex])}, ${renderBody(branch)} }`,
  );
  if (cancelBranch !== null && cancelType !== -2) return renderSimpleCommand(command, index);

  const fields = [`choices: [${branchExpressions.join(", ")}]`];

  if (cancelBranch === null && !Object.is(cancelType, 1)) {
    fields.push(
      cancelType === -1
        ? 'cancel: { kind: "disabled" }'
        : `cancel: { kind: "choice", index: ${literal(cancelType)} }`,
    );
  }
  if (!Object.is(defaultType, 0)) {
    fields.push(
      defaultType === -1
        ? 'defaultChoice: { kind: "none" }'
        : `defaultChoice: { kind: "choice", index: ${literal(defaultType)} }`,
    );
  }
  if (positionType !== 2) {
    fields.push(`position: ${literal(["left", "center", "right"][positionType])}`);
  }
  if (background !== 0) {
    fields.push(`background: ${literal(["window", "dim", "transparent"][background])}`);
  }
  if (cancelBranch !== null) {
    fields.push(`cancel: { kind: "branch", ${renderBody(cancelBranch)} }`);
  }

  return {
    expression: `showChoices({ ${fields.join(", ")} })`,
    helperNames: [...helperNames],
    nextIndex,
  };
}

export function renderShowScrollingTextCommand(
  commands: readonly RawEventCommand[],
  index: number,
  renderSimpleCommand: RenderSimpleCommand,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Show Scrolling Text command.");
  }

  const speed = command.parameters[0];
  const noFastForward = command.parameters[1];
  if (typeof speed !== "number" || typeof noFastForward !== "boolean") {
    return renderSimpleCommand(command, index);
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

  const fields = [
    `lines: ${literal(lines)}`,
    `speed: ${speed}`,
    `noFastForward: ${literal(noFastForward)}`,
  ];

  return {
    expression: `showScrollingText({ ${fields.join(", ")} })`,
    helperNames: ["showScrollingText"],
    nextIndex,
  };
}

export function renderCommentCommand(
  commands: readonly RawEventCommand[],
  index: number,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Comment command.");
  }

  const lines = [command.parameters[0] as string];
  let nextIndex = index;

  while (
    commands[nextIndex + 1]?.code === 408 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const next = commands[nextIndex + 1];
    lines.push(next!.parameters[0] as string);
    nextIndex += 1;
  }

  return {
    expression: `comment({ lines: ${literal(lines)} })`,
    helperNames: ["comment"],
    nextIndex,
  };
}

export function renderScriptCommand(
  commands: readonly RawEventCommand[],
  index: number,
  renderSimpleCommand: RenderSimpleCommand,
): RenderedCommand {
  const command = commands[index];
  if (command === undefined) {
    throw new Error("Cannot render missing Script command.");
  }

  if (typeof command.parameters[0] !== "string") {
    return renderSimpleCommand(command, index);
  }

  const lines = [command.parameters[0]];
  let nextIndex = index;
  while (
    commands[nextIndex + 1]?.code === 655 &&
    commands[nextIndex + 1]?.indent === command.indent
  ) {
    const line = commands[nextIndex + 1]?.parameters[0];
    if (typeof line !== "string") {
      break;
    }
    lines.push(line);
    nextIndex += 1;
  }

  return {
    expression: `script({ code: ${literal(lines.join("\n"))} })`,
    helperNames: ["script"],
    nextIndex,
  };
}

export function findMessageBranchEnd(
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

export function renderInlineCommandListSource(source: string): string {
  if (source.length === 0) {
    return "";
  }

  return source.replaceAll("\n", " ");
}
