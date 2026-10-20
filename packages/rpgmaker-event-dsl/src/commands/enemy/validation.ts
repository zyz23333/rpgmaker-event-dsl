import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { CommandStructureError } from "../../validation/command-errors.js";
import { describeValue } from "../../project-data/json-values.js";
import type { ReferenceResolver } from "../../validation/types.js";

const codes = {
  changeEnemyHp: 331,
  changeEnemyMp: 332,
  changeEnemyState: 333,
  enemyRecoverAll: 334,
  enemyAppear: 335,
  enemyTransform: 336,
  showBattleAnimation: 337,
  changeEnemyTp: 342,
  forceAction: 339,
  abortBattle: 340,
} as const;
type Kind = keyof typeof codes;
const fields: Record<Kind, readonly string[]> = {
  changeEnemyHp: ["target", "operation", "value", "allowDeath"],
  changeEnemyMp: ["target", "operation", "value"],
  changeEnemyTp: ["target", "operation", "value"],
  changeEnemyState: ["target", "operation", "state"],
  enemyRecoverAll: ["target"],
  enemyAppear: ["target"],
  enemyTransform: ["target", "enemy"],
  showBattleAnimation: ["target", "animation", "allEnemies"],
  forceAction: ["subject", "skill", "target"],
  abortBattle: [],
};
function fail(
  code: number,
  at: { dslPath: string } | { nativePath: string },
  expected: string,
  actual: unknown,
): never {
  throw new CommandStructureError(`MV-E${code}`, "Invalid Enemy command input.", {
    ...at,
    expected,
    actual: describeValue(actual),
  });
}
function validInteger(value: unknown, min: number, max: number) {
  return Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
}
function ref(
  value: unknown,
  kind: "state" | "enemy" | "animation" | "variable" | "actor" | "skill",
  code: number,
  path: string,
  resolver?: ReferenceResolver,
) {
  assertDslObject(value, ["kind", "id", "name"], path);
  if (
    value.kind !== kind ||
    Object.hasOwn(value, "id") === Object.hasOwn(value, "name") ||
    (Object.hasOwn(value, "id")
      ? !validInteger(value.id, 1, Number.MAX_SAFE_INTEGER)
      : typeof value.name !== "string")
  )
    fail(
      code,
      { dslPath: path },
      `explicit ${kind} reference by positive id or string name`,
      value,
    );
  if (resolver)
    try {
      resolver.resolveReference(value as never);
    } catch (error) {
      throw new CommandStructureError(
        `MV-E${code}-REFERENCE`,
        error instanceof Error ? error.message : String(error),
        { dslPath: path, expected: `existing ${kind}`, actual: describeValue(value) },
      );
    }
}
export function assertEnemyInput(
  kind: string,
  value: unknown,
  path: string,
  withKind = false,
  resolver?: ReferenceResolver,
): void {
  if (!Object.hasOwn(codes, kind)) return;
  const command = kind as Kind;
  const code = codes[command];
  assertDslObject(value, [...(withKind ? ["kind"] : []), ...fields[command]], path);
  const check = (valid: boolean, suffix: string, expected: string, actual: unknown) => {
    if (!valid) fail(code, { dslPath: path + suffix }, expected, actual);
  };
  if (code === 340) return;
  if (code === 339) {
    const subject = value.subject;
    assertDslObject(subject, ["kind", "scope", "target", "index", "actor"], path + ".subject");
    check(
      subject.kind === "runtimeSelector" &&
        subject.scope === "battler" &&
        ["enemy", "actor"].includes(subject.target as string),
      ".subject",
      "single enemy or fixed Actor battler selector",
      subject,
    );
    assertDslObject(
      subject,
      subject.target === "enemy"
        ? ["kind", "scope", "target", "index"]
        : ["kind", "scope", "target", "actor"],
      path + ".subject",
    );
    if (subject.target === "enemy")
      check(validInteger(subject.index, 0, 7), ".subject.index", "integer 0..7", subject.index);
    else ref(subject.actor, "actor", code, path + ".subject.actor", resolver);
    ref(value.skill, "skill", code, path + ".skill", resolver);
    const target = value.target;
    assertDslObject(target, ["kind", "index"], path + ".target");
    check(
      ["lastTarget", "random", "index"].includes(target.kind as string),
      ".target.kind",
      "lastTarget, random or index",
      target.kind,
    );
    assertDslObject(
      target,
      target.kind === "index" ? ["kind", "index"] : ["kind"],
      path + ".target",
    );
    if (target.kind === "index")
      check(validInteger(target.index, 0, 7), ".target.index", "integer 0..7", target.index);
    return;
  }
  const target = value.target;
  assertDslObject(target, ["kind", "scope", "target", "index"], path + ".target");
  const all = target.target === "all";
  check(
    target.kind === "runtimeSelector" &&
      target.scope === "enemy" &&
      (target.target === "enemy" || all),
    ".target",
    "enemy runtime selector",
    target,
  );
  if (all) {
    assertDslObject(target, ["kind", "scope", "target"], path + ".target");
    check(
      !["enemyAppear", "enemyTransform", "showBattleAnimation"].includes(command),
      ".target",
      "single enemy position 0..7",
      target,
    );
  } else check(validInteger(target.index, 0, 7), ".target.index", "integer 0..7", target.index);
  if (["changeEnemyHp", "changeEnemyMp", "changeEnemyTp"].includes(command)) {
    check(
      value.operation === "gain" || value.operation === "lose",
      ".operation",
      "gain or lose",
      value.operation,
    );
    const operand = value.value;
    assertDslObject(operand, ["kind", "value", "variable"], path + ".value");
    check(
      operand.kind === "constant" || operand.kind === "variable",
      ".value.kind",
      "constant or variable",
      operand.kind,
    );
    if (operand.kind === "constant") {
      assertDslObject(operand, ["kind", "value"], path + ".value");
      check(
        validInteger(operand.value, 1, code === 342 ? 100 : 9999),
        ".value.value",
        `integer 1..${code === 342 ? 100 : 9999}`,
        operand.value,
      );
    } else {
      assertDslObject(operand, ["kind", "variable"], path + ".value");
      ref(operand.variable, "variable", code, path + ".value.variable", resolver);
    }
    if (code === 331)
      check(
        typeof value.allowDeath === "boolean",
        ".allowDeath",
        "explicit boolean",
        value.allowDeath,
      );
  }
  if (code === 333) {
    check(
      value.operation === "add" || value.operation === "remove",
      ".operation",
      "add or remove",
      value.operation,
    );
    ref(value.state, "state", code, path + ".state", resolver);
  }
  if (code === 336) ref(value.enemy, "enemy", code, path + ".enemy", resolver);
  if (code === 337) {
    ref(value.animation, "animation", code, path + ".animation", resolver);
    check(
      typeof value.allEnemies === "boolean",
      ".allEnemies",
      "explicit boolean",
      value.allEnemies,
    );
  }
}
