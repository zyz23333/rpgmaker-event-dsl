export const runtimeBaseline = {
  language: "typescript-strict",
  moduleSystem: "esm-nodenext",
  packageManager: "pnpm",
  runtime: "node-22-lts",
} as const;

export type RuntimeBaseline = typeof runtimeBaseline;
