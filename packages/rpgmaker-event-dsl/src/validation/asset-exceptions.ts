import { z } from "zod";
import { audioAssetFolders, imageAssetFolders } from "../domain/references.js";

const details = {
  name: z.string().min(1),
  reason: z
    .string()
    .refine((value) => value.trim().length > 0, "Reason must contain non-whitespace text."),
};
export const assetCheckExceptionSchema = z.discriminatedUnion("category", [
  z
    .object({ category: z.literal("image"), folder: z.enum(imageAssetFolders), ...details })
    .strict(),
  z
    .object({ category: z.literal("audio"), folder: z.enum(audioAssetFolders), ...details })
    .strict(),
  z.object({ category: z.literal("movie"), folder: z.literal("movies"), ...details }).strict(),
]);
export type AssetCheckException = z.infer<typeof assetCheckExceptionSchema>;
export const assetCheckExceptionsSchema = z
  .array(assetCheckExceptionSchema)
  .superRefine((entries, context) => {
    const seen = new Set<string>();
    entries.forEach((entry, index) => {
      const key = JSON.stringify([entry.category, entry.folder, entry.name]);
      if (seen.has(key))
        context.addIssue({
          code: "custom",
          path: [index],
          message: "Duplicate exact asset namespace and saved name.",
        });
      seen.add(key);
    });
  });
