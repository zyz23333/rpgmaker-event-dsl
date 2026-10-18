import { z } from "zod";

export const mapEventImageSchema = z
  .object({
    characterName: z.string(),
    characterIndex: z.number().int().min(0).max(7),
    direction: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]),
    pattern: z.number().int().min(0).max(2),
    tileId: z.number().int().nonnegative(),
  })
  .passthrough();
