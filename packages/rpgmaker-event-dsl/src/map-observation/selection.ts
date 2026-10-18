import { z } from "zod";

import type { MapInspectionSelector } from "./types.js";

const inspectionSelectorSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("summary") }),
  z.strictObject({
    kind: z.literal("event"),
    eventId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    commands: z.boolean().optional(),
  }),
  z.strictObject({ kind: z.literal("cell"), x: z.number(), y: z.number() }),
  z.strictObject({
    kind: z.literal("area"),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
]);

export function readMapInspectionSelector(value: unknown): MapInspectionSelector {
  const result = inspectionSelectorSchema.safeParse(
    value === undefined ? { kind: "summary" } : value,
  );
  if (!result.success) {
    throw new Error(
      `Invalid map inspection selector: select one summary, event, cell, or area; commands are valid only inside an event selector. ${result.error.message}`,
    );
  }
  if (result.data.kind === "event") {
    return {
      kind: "event",
      eventId: result.data.eventId,
      commands: result.data.commands ?? false,
    };
  }
  return result.data;
}
