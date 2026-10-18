import { z } from "zod";

import { renderCommandAt } from "../decompiler/dispatch.js";
import type { ValidatedMap } from "./read.js";
import type {
  MapCommandSummary,
  MapEventInspection,
  MapEventPageInspection,
  MapEventReference,
  MapObservationWarning,
} from "./types.js";

const conditionSchema = z
  .object({
    switch1Valid: z.boolean().optional(),
    switch1Id: z.number().int().optional(),
    switch2Valid: z.boolean().optional(),
    switch2Id: z.number().int().optional(),
    variableValid: z.boolean().optional(),
    variableId: z.number().int().optional(),
    variableValue: z.number().optional(),
    selfSwitchValid: z.boolean().optional(),
    selfSwitchCh: z.enum(["A", "B", "C", "D"]).optional(),
    actorValid: z.boolean().optional(),
    actorId: z.number().int().optional(),
    itemValid: z.boolean().optional(),
    itemId: z.number().int().optional(),
  })
  .passthrough();

const pageSchema = z.object({
  conditions: conditionSchema,
  trigger: z.number().int().min(0).max(4),
  image: z
    .object({
      characterName: z.string(),
      characterIndex: z.number().int().min(0).max(7),
      direction: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]),
      pattern: z.number().int().min(0).max(2),
      tileId: z.number().int().nonnegative(),
    })
    .passthrough(),
  list: z.array(z.unknown()),
});

const commandSchema = z
  .object({
    code: z.number().int().nonnegative(),
    indent: z.number().int().nonnegative(),
    parameters: z.array(z.unknown()),
  })
  .passthrough();

function summarizeCommands(records: unknown[]): MapCommandSummary {
  const codes = new Map<number, number>();
  const operations: MapCommandSummary["operations"] = [];
  let cursor = 0;
  while (cursor < records.length) {
    const first = commandSchema.safeParse(records[cursor]);
    if (!first.success) {
      operations.push({
        index: cursor,
        code: null,
        recordCount: 1,
        status: "unsupported",
        helpers: [],
        reason:
          "Invalid Raw Event Command shape; expected numeric code/indent and a parameters array.",
      });
      cursor += 1;
      continue;
    }
    const commands = [first.data];
    let end = cursor + 1;
    for (; end < records.length; end += 1) {
      const next = commandSchema.safeParse(records[end]);
      if (!next.success) break;
      commands.push(next.data);
    }
    for (const command of commands) codes.set(command.code, (codes.get(command.code) ?? 0) + 1);
    for (let index = 0; index < commands.length; index += 1) {
      const command = commands[index];
      if (command === undefined || (command.code === 0 && command.parameters.length === 0))
        continue;
      try {
        const rendering = renderCommandAt(commands, index);
        const count = Math.max(
          1,
          Math.min(commands.length - index, rendering.nextIndex - index + 1),
        );
        const recognized = !rendering.helperNames.includes("rawDslCommand");
        operations.push({
          index: cursor + index,
          code: command.code,
          recordCount: count,
          status: recognized ? "recognized" : "unsupported",
          helpers: recognized ? [...rendering.helperNames] : [],
          ...(recognized
            ? {}
            : {
                reason:
                  "This command span has no complete supported DSL interpretation; raw records are available with commands enabled.",
              }),
        });
        index += count - 1;
      } catch {
        operations.push({
          index: cursor + index,
          code: command.code,
          recordCount: 1,
          status: "unsupported",
          helpers: [],
          reason:
            "Unsupported command parameters or structure; raw records are available with commands enabled.",
        });
      }
    }
    cursor = end;
  }
  return {
    recordCount: records.length,
    codes: [...codes]
      .sort(([left], [right]) => left - right)
      .map(([code, count]) => ({ code, count })),
    operations,
  };
}

function pageReferences(page: z.infer<typeof pageSchema>): MapEventReference[] {
  const references: MapEventReference[] = [];
  const add = (scope: MapEventReference["scope"], id: unknown) => {
    if (
      typeof id === "number" &&
      Number.isSafeInteger(id) &&
      id > 0 &&
      !references.some((reference) => reference.scope === scope && reference.id === id)
    ) {
      references.push({ scope, id, status: "missing" });
    }
  };
  for (const [flag, field, scope] of [
    ["switch1Valid", "switch1Id", "switch"],
    ["switch2Valid", "switch2Id", "switch"],
    ["variableValid", "variableId", "variable"],
    ["actorValid", "actorId", "actor"],
    ["itemValid", "itemId", "item"],
  ] as const) {
    if (page.conditions[flag] !== true) continue;
    const id = page.conditions[field];
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)
      throw new Error(`Enabled ${flag} requires a positive ${field}.`);
    add(scope, id);
  }
  if (page.conditions.variableValid === true && page.conditions.variableValue === undefined)
    throw new Error("Enabled variableValid requires a variableValue.");
  if (page.conditions.selfSwitchValid === true && page.conditions.selfSwitchCh === undefined)
    throw new Error("Enabled selfSwitchValid requires a selfSwitchCh.");
  for (const record of page.list) {
    const command = commandSchema.safeParse(record);
    if (command.success && command.data.code === 117)
      add("commonEvent", command.data.parameters[0]);
  }
  return references;
}

export function inspectMapEvent(map: ValidatedMap, eventId: number, commands: boolean) {
  if (!Number.isSafeInteger(eventId) || eventId <= 0)
    throw new Error("Select an event with a positive integer event ID (--event).");
  const selected = map.events.find((event) => event?.id === eventId);
  if (selected === undefined || selected === null)
    throw new Error(`Event ${eventId} does not exist in the Selected Map and source.`);
  const warnings: MapObservationWarning[] = [];
  const pages = selected.pages.map((value, index): MapEventPageInspection => {
    const result = pageSchema.safeParse(value);
    if (!result.success)
      throw new Error(`Malformed event ${eventId} page ${index + 1}: ${result.error.message}`);
    const page = result.data;
    const commandSummary = summarizeCommands(page.list);
    for (const operation of commandSummary.operations) {
      if (operation.status === "unsupported")
        warnings.push({
          code: "unsupported-command-shape",
          message: `Event ${eventId} page ${index + 1}, command record ${operation.index}: ${operation.reason}`,
        });
    }
    let references: MapEventReference[];
    try {
      references = pageReferences(page);
    } catch (error) {
      throw new Error(
        `Malformed event ${eventId} page ${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    return {
      page: index + 1,
      conditions: page.conditions,
      trigger: page.trigger,
      triggerName: (["action", "playerTouch", "eventTouch", "autorun", "parallel"] as const)[
        page.trigger
      ]!,
      image: page.image,
      commandSummary,
      references,
      ...(commands ? { commands: page.list } : {}),
    };
  });
  const event: MapEventInspection = {
    id: selected.id,
    name: selected.name,
    x: selected.x,
    y: selected.y,
    pages,
    ...(selected.note === undefined ? {} : { note: selected.note }),
  };
  return { event, warnings };
}

function referenceFile(scope: MapEventReference["scope"]): string {
  return scope === "switch" || scope === "variable"
    ? "System.json"
    : scope === "commonEvent"
      ? "CommonEvents.json"
      : scope === "actor"
        ? "Actors.json"
        : "Items.json";
}

export function eventReferenceFiles(event: MapEventInspection): string[] {
  return [
    ...new Set(
      event.pages.flatMap((page) => page.references.map(({ scope }) => referenceFile(scope))),
    ),
  ];
}

export function resolveEventReferences(
  event: MapEventInspection,
  inputs: ReadonlyMap<string, unknown>,
): MapEventInspection {
  for (const [file, value] of inputs) {
    if (file === "System.json") {
      if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new Error(
          "Malformed System.json: expected an object with switch and variable name arrays.",
        );
      const system = value as Record<string, unknown>;
      if (
        !Array.isArray(system.switches) ||
        !Array.isArray(system.variables) ||
        !system.switches.every((name) => typeof name === "string") ||
        !system.variables.every((name) => typeof name === "string")
      )
        throw new Error("Malformed System.json: expected switch and variable name arrays.");
    } else if (!Array.isArray(value))
      throw new Error(`Malformed ${file}: expected an entry array.`);
  }
  return {
    ...event,
    pages: event.pages.map((page) => ({
      ...page,
      references: page.references.map((reference) => {
        const value = inputs.get(referenceFile(reference.scope));
        let name: unknown;
        if (reference.scope === "switch" || reference.scope === "variable") {
          const system = value as Record<string, unknown>;
          const names = system[reference.scope === "switch" ? "switches" : "variables"] as string[];
          name = names[reference.id];
        } else {
          const entry: unknown = (value as unknown[])[reference.id];
          if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
            const record = entry as Record<string, unknown>;
            if (record.id === reference.id) name = record.name;
          }
        }
        return typeof name === "string" && name.length > 0
          ? { ...reference, name, status: "resolved" as const }
          : reference;
      }),
    })),
  };
}
