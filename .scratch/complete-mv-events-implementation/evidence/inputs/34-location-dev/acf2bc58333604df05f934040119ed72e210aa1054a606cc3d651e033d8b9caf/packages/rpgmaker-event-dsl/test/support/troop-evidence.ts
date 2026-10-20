import { recordEvidence } from "./mv-evidence.js";

export async function verifyTroopEvidence(
  requirementId: string,
  verify: () => unknown | Promise<unknown>,
): Promise<void> {
  const startedAt = new Date().toISOString();
  let actual: unknown = "Verification did not complete; inspect the preserved assertion failure.";
  let failure: unknown;
  try {
    actual = await verify();
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    await recordEvidence({
      requirementId,
      startedAt,
      stages: [
        "Independent complete native input or formal DSL declaration",
        "Approved authoring/validation or public Workspace API/filesystem boundary",
        "Complete saved values, diagnostics, carrier bytes and state assertions",
      ],
      expected:
        "The independently specified Troop Event contract and all assertions in the linked case hold.",
      actual,
      ...(failure === undefined ? {} : { error: failure }),
    });
  }
}
