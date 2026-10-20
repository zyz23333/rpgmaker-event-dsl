import { assertDslObject } from "../../validation/dsl-command-inputs.js";
import { assertReferenceInput } from "../../validation/reference-inputs.js";

export function assertSwitchCommandInput(
  kind: string,
  input: unknown,
  path: string,
  withKind = true,
): void {
  if (kind !== "controlSwitches" && kind !== "controlSelfSwitch") return;
  const fields = kind === "controlSwitches" ? ["switch", "value"] : ["selfSwitch", "value"];
  assertDslObject(input, withKind ? ["kind", ...fields] : fields, path);
  if (kind !== "controlSwitches") return;
  const target = input.switch;
  const at = `${path}.switch`;
  if (
    typeof target === "object" &&
    target !== null &&
    "kind" in target &&
    target.kind === "referenceRange"
  ) {
    const range: unknown = target;
    assertDslObject(range, ["kind", "from", "to"], at);
    assertReferenceInput(range.from, "switch", `${at}.from`, true);
    assertReferenceInput(range.to, "switch", `${at}.to`, true);
  } else assertReferenceInput(target, "switch", at, true);
}
