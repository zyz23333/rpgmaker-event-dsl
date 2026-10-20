import type { RawEventCommand, RenderedCommand } from "../../decompiler/types.js";
import { isNumberTuple, literal } from "../../decompiler/core.js";

export function renderBooleanSystemCommand(
  command: RawEventCommand,
  helperName: string,
  fieldName: "disabled" | "enabled",
  zeroMeansTrue: boolean,
): Omit<RenderedCommand, "nextIndex"> | null {
  const value = command.parameters[0];
  if (value !== 0 && value !== 1) {
    return null;
  }

  const booleanValue = zeroMeansTrue ? value === 0 : value === 1;
  return {
    expression: `${helperName}({ ${fieldName}: ${booleanValue} })`,
    helperNames: [helperName],
  };
}

export function renderChangeWindowColor(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const tone = command.parameters[0];
  if (!isNumberTuple(tone, 4)) return null;
  const fields = ["red", "green", "blue", "gray"].map(
    (field, index) => `${field}: ${literal(tone[index])}`,
  );
  return {
    expression: `changeWindowColor({ tone: { ${fields.join(", ")} } })`,
    helperNames: ["changeWindowColor"],
  };
}

export function renderPluginCommand(
  command: RawEventCommand,
): Omit<RenderedCommand, "nextIndex"> | null {
  const line = command.parameters[0];
  if (typeof line !== "string" || line.length === 0) {
    return null;
  }
  if (line.trim() !== line || line.includes("  ")) {
    return null;
  }

  const [name = "", ...args] = line.split(" ");
  const fields = [`command: ${literal(name)}`];
  if (args.length > 0) {
    fields.push(`args: ${literal(args)}`);
  }
  return {
    expression: `pluginCommand({ ${fields.join(", ")} })`,
    helperNames: ["pluginCommand"],
  };
}

export function renderNoParameterCommand(
  command: RawEventCommand,
  helperName:
    | "abortBattle"
    | "breakLoop"
    | "exitEventProcessing"
    | "gameOver"
    | "openMenuScreen"
    | "openSaveScreen"
    | "returnToTitleScreen",
): Omit<RenderedCommand, "nextIndex"> | null {
  return command.parameters.length === 0
    ? {
        expression: `${helperName}()`,
        helperNames: [helperName],
      }
    : null;
}

export function renderRawCommand(command: RawEventCommand): string {
  const indentLine = `\n  indent: ${command.indent},`;

  return `rawDslCommand({
  code: ${command.code},${indentLine}
  parameters: ${literal(command.parameters)},
})`;
}
