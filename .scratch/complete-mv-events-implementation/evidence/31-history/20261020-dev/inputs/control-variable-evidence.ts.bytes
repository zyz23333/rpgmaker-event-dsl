import { recordEvidence } from "./mv-evidence.js";

export async function verifyVariableEvidence<T>(
  id: string,
  verify: () => Promise<T> | T,
): Promise<T> {
  const startedAt = new Date().toISOString();
  let actual: unknown;
  let failure: unknown;
  try {
    const value = await verify();
    actual = value ?? { completed: true, native: "not-executed" };
    return value;
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    await recordEvidence({
      requirementId: `MV-S6-VARIABLES-${id}`,
      startedAt,
      stages: [
        "Independent normative E122 synthetic input",
        "Public DSL or actual discovered/evaluated Workspace API/CLI",
        "Exact complete saved values or precise rejection plus complete business-state assertions",
      ],
      expected:
        "All linked assertions pass without changing independent expectations; native game execution remains a separate required obligation.",
      actual: actual ?? { completed: false, native: "not-executed" },
      ...(failure === undefined ? {} : { error: failure }),
    });
  }
}
