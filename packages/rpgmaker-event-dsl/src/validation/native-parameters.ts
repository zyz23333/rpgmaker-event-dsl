import { CommandStructureError } from "./command-errors.js";
import { renderJsonValue } from "../project-data/json-values.js";
import { assertNativeConditionalParameters } from "../commands/flow/conditional-validation.js";
import {
  assertNativeSwitchCommand,
  assertNativeTimerParameters,
} from "../commands/variables/validation.js";
import { assertNativeScreenParameters } from "../commands/screen/validation.js";
import { assertNativeMapAppearanceParameters } from "../commands/map/native-validation.js";
import { assertNativeSystemSettingsParameters } from "../commands/movement/access-native-validation.js";
import { assertNativePictureParameters } from "../commands/screen/picture-native.js";
import { assertNativeAudioParameters } from "../commands/audio/validation.js";
import { assertNativeActorResourceParameters } from "../commands/actor/native-validation.js";

// Shared saved-slot envelopes. Family validators retain ownership of semantic ranges,
// references and mode-specific saved values; this table is not full family acceptance.
const signatures: Record<number, string> = {
  0: "",
  101: "snnn",
  102: "annnn",
  103: "nn",
  104: "nn",
  105: "nb",
  108: "s",
  111: "",
  112: "",
  113: "",
  115: "",
  117: "n",
  118: "s",
  119: "s",
  121: "nnn",
  122: "",
  123: "sn",
  124: "",
  125: "nnn",
  126: "nnnn",
  127: "nnnnb",
  128: "nnnnb",
  129: "nnb",
  132: "o",
  133: "o",
  134: "n",
  135: "n",
  136: "n",
  137: "n",
  138: "a",
  139: "o",
  140: "no",
  201: "nnnnnn",
  202: "nnnnn",
  203: "nnnnn",
  204: "nnn",
  205: "no",
  206: "",
  211: "n",
  212: "nnb",
  213: "nnb",
  214: "",
  216: "n",
  217: "",
  221: "",
  222: "",
  223: "anb",
  224: "anb",
  225: "nnnb",
  230: "n",
  231: "nsnnnnnnnn",
  232: "nnnnnnnnnnnb",
  233: "nn",
  234: "nanb",
  235: "n",
  236: "snnb",
  241: "o",
  242: "n",
  243: "",
  244: "",
  245: "o",
  246: "n",
  249: "o",
  250: "o",
  251: "",
  261: "s",
  281: "n",
  282: "n",
  283: "ss",
  284: "sbbnn",
  285: "nnnnn",
  301: "nnbb",
  302: "nnnnb",
  303: "nn",
  311: "nnnnnb",
  312: "nnnnn",
  313: "nnnn",
  314: "nn",
  315: "nnnnnb",
  316: "nnnnnb",
  317: "nnnnnn",
  318: "nnnn",
  319: "nnn",
  320: "ns",
  321: "nnb",
  322: "nsnsns",
  323: "nsn",
  324: "ns",
  325: "ns",
  326: "nnnnn",
  331: "nnnnb",
  332: "nnnn",
  333: "nnn",
  334: "n",
  335: "n",
  336: "nn",
  337: "nnb",
  339: "nnnn",
  340: "",
  342: "nnnn",
  351: "",
  352: "",
  353: "",
  354: "",
  355: "s",
  356: "s",
  401: "s",
  402: "ns",
  403: "nx",
  404: "",
  405: "s",
  408: "s",
  411: "",
  412: "",
  413: "",
  505: "o",
  601: "",
  602: "",
  603: "",
  604: "",
  605: "nnnn",
  655: "s",
};

export function isKnownCommandCode(code: number): boolean {
  return Object.hasOwn(signatures, code);
}

export function assertNativeCommandParameters(
  code: number,
  parameters: readonly unknown[],
  path: string,
): void {
  if (!isKnownCommandCode(code)) return;
  if (code >= 231 && code <= 235) {
    assertNativePictureParameters(code, parameters, path);
    return;
  }
  assertNativeAudioParameters(code, parameters, path);
  if (code === 111) {
    assertNativeConditionalParameters(parameters, path);
    return;
  }
  if (code === 124) {
    assertNativeTimerParameters(parameters, path);
    return;
  }
  assertNativeMapAppearanceParameters(code, parameters, path);
  assertNativeSystemSettingsParameters(code, parameters, path);
  assertNativeActorResourceParameters(code, parameters, path);
  try {
    assertNativeSwitchCommand(code, parameters);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommandStructureError(
      /^MV-[\w-]+/u.exec(detail)?.[0] ?? "MV-COMMAND-PARAMETERS",
      detail,
      {
        nativePath: `${path}.${/parameters(?:\[[\d.]+\])?/u.exec(detail)?.[0] ?? "parameters"}`,
        expected: `valid E${code} switch parameters`,
        actual: renderJsonValue(parameters),
      },
    );
  }
  let signature = signatures[code]!;
  if (code === 122)
    signature =
      ({ 0: "nnnnn", 1: "nnnnn", 2: "nnnnnn", 3: "nnnnnnn", 4: "nnnns" } as Record<number, string>)[
        parameters[3] as number
      ] ?? "?";
  assertNativeScreenParameters(code, parameters, path);
  const matches = (value: unknown, kind: string) =>
    kind === "x" ||
    (kind === "n"
      ? typeof value === "number"
      : kind === "s"
        ? typeof value === "string"
        : kind === "b"
          ? typeof value === "boolean"
          : kind === "a"
            ? Array.isArray(value)
            : kind === "o"
              ? typeof value === "object" && value !== null && !Array.isArray(value)
              : false);
  if (
    parameters.length !== signature.length ||
    ![...signature].every((kind, index) => matches(parameters[index], kind))
  )
    throw new CommandStructureError(
      "MV-COMMAND-PARAMETERS",
      "Known command parameters do not match their native contract.",
      {
        nativePath: `${path}.parameters${[118, 119, 355, 356, 655].includes(code) && parameters.length === 1 ? "[0]" : ""}`,
        expected: `E${code} saved slots ${signature || "[]"}`,
        actual: renderJsonValue(parameters),
      },
    );
  const slot = (index: number, valid: boolean, expected: string): void => {
    if (!valid)
      throw new CommandStructureError("MV-COMMAND-PARAMETERS", "Invalid known saved parameter.", {
        nativePath: `${path}.parameters[${index}]`,
        expected,
        actual: renderJsonValue(parameters[index]),
      });
  };
  const oneOf = (index: number, values: readonly unknown[]) =>
    slot(
      index,
      values.includes(parameters[index]) && !Object.is(parameters[index], -0),
      `one of ${renderJsonValue(values)}`,
    );
  const integer = (index: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER) =>
    slot(
      index,
      Number.isSafeInteger(parameters[index]) &&
        !Object.is(parameters[index], -0) &&
        (parameters[index] as number) >= minimum &&
        (parameters[index] as number) <= maximum,
      `integer ${minimum}..${maximum}, excluding negative zero`,
    );
  if (code === 101) integer(1, 0, 2147483647);
  if (code === 322) integer(4, 0);
  if (code === 101) {
    oneOf(2, [0, 1, 2]);
    oneOf(3, [0, 1, 2]);
  }
  if (code === 103 || code === 104) integer(0, 1);
  if (code === 103) integer(1, 1, 8);
  if (code === 104) oneOf(1, [1, 2, 3, 4]);
  if (code === 105) integer(0, 1, 8);
  if ([401, 405, 108, 408].includes(code))
    if ((parameters[0] as string).includes("\n"))
      throw new CommandStructureError(
        "MV-MESSAGE-LINE",
        "A saved physical line cannot contain LF.",
        {
          nativePath: `${path}.parameters[0]`,
          expected: "one physical line without LF; CR and empty text are preserved",
          actual: renderJsonValue(parameters[0]),
        },
      );
  if (code === 102) {
    slot(
      0,
      (parameters[0] as unknown[]).every((value) => typeof value === "string") &&
        (parameters[0] as unknown[]).length > 0 &&
        (parameters[0] as unknown[]).length <= 6,
      "1..6 string choices",
    );
    // These explicit numeric saved indices retain -0; symbolic selectors below cannot.
    slot(
      1,
      [-2, -1, 0, 1, 2, 3, 4, 5].includes(parameters[1] as number),
      "cancel mode -2, -1 or numeric choice index 0..5",
    );
    slot(
      2,
      [-1, 0, 1, 2, 3, 4, 5].includes(parameters[2] as number),
      "default none -1 or numeric choice index 0..5",
    );
    oneOf(3, [0, 1, 2]);
    oneOf(4, [0, 1, 2]);
  }
  if (code === 122) {
    oneOf(2, [0, 1, 2, 3, 4, 5]);
    if (parameters[3] === 3) oneOf(4, [0, 1, 2, 3, 4, 5, 6, 7]);
  }
  if (code === 402) integer(0, 0);
  if (code === 403) {
    oneOf(0, [6]);
    oneOf(1, [null]);
  }
  if (code === 232) oneOf(1, [0]);
  if (code === 302 || code === 605) {
    oneOf(0, [0, 1, 2]);
    oneOf(2, [0, 1]);
    if (parameters[2] === 0) oneOf(3, [0]);
  }
  if (code === 201) {
    oneOf(0, [0, 1]);
    if (parameters[0] === 0) {
      integer(2, 0);
      integer(3, 0);
    }
    oneOf(4, [0, 2, 4, 6, 8]);
    oneOf(5, [0, 1, 2]);
  }
  if (code === 202) {
    oneOf(0, [0, 1, 2]);
    oneOf(1, [0, 1]);
    if (parameters[1] === 0) {
      integer(3, 0);
      integer(4, 0);
    }
  }
  if (code === 203) {
    oneOf(1, [0, 1, 2]);
    if (parameters[1] === 0) {
      integer(2, 0);
      integer(3, 0);
    }
    oneOf(4, [0, 2, 4, 6, 8]);
  }
  if ([132, 133, 139, 140, 241, 245, 249, 250].includes(code)) {
    const index = code === 140 ? 1 : 0;
    const audio = parameters[index] as Record<string, unknown>;
    slot(
      index,
      Object.keys(audio).length === 4 &&
        ["name", "volume", "pitch", "pan"].every((key) => Object.hasOwn(audio, key)) &&
        typeof audio.name === "string" &&
        [audio.volume, audio.pitch, audio.pan].every((value) => typeof value === "number"),
      "complete audio object with name, volume, pitch and pan only",
    );
  }
  for (const [event, index] of [
    [138, 0],
    [223, 0],
    [224, 0],
  ] as const)
    if (code === event)
      slot(
        index,
        (parameters[index] as unknown[]).length === 4 &&
          (parameters[index] as unknown[]).every((value) => typeof value === "number"),
        "exactly four numeric saved color/tone components",
      );
}
