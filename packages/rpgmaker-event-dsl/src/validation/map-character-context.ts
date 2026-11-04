import type { RawEventCommand, CommandOrigins } from "../compiler/types.js";
import type { ValidationIssue } from "./types.js";
import { describeValue } from "../project-data/json-values.js";

export function inspectMapCharacterContext(
  commands: readonly RawEventCommand[],
  options: {
    identity: string;
    stage: "compile" | "decompile";
    prefix?: string;
    origins?: CommandOrigins;
    eventIds?: ReadonlySet<number>;
  },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const battle = options.identity.startsWith("troop:");
  const common = options.identity.startsWith("commonEvent:");
  for (const [index, command] of commands.entries()) {
    const code = command.code;
    let detail: string | undefined;
    if (code === 212 || code === 213) {
      if (battle)
        detail =
          "Battle character selection returns no map character; this command does nothing and starts no animation/balloon wait.";
      else if (common)
        detail =
          "Character selection depends on the caller's current map and event context; a missing target does nothing and starts no animation/balloon wait.";
      else if (
        (command.parameters[0] as number) > 0 &&
        options.eventIds &&
        !options.eventIds.has(command.parameters[0] as number)
      )
        detail =
          "This event selector has no target among the current map declarations; it does nothing and starts no animation/balloon wait if still missing at execution.";
    } else if (code === 204 && (battle || common))
      detail = battle
        ? "Scroll Map is skipped in battle."
        : "The caller's context controls scrolling: battle skips it; a prior map scroll delays this scroll's start, without waiting for this new scroll to finish.";
    else if (code === 214 && (battle || common))
      detail =
        "Erase Event acts only on the calling event when its interpreter is on the current map with a positive event ID; an absent map-event context does nothing.";
    else if (code === 217)
      detail = battle
        ? "Gather Followers is skipped in battle."
        : "Gather Followers waits on the map until followers gather; blocked movement can keep that wait active. A Common Event inherits its caller's map/battle context.";
    else if (code === 206)
      detail =
        "Boarding or disembarking depends on the player's current vehicle, terrain and location. In battle or an inherited Common Event context this can address retained map-player state; success is not guaranteed.";
    else if ((code === 211 || code === 216) && (battle || common))
      detail =
        code === 211
          ? "Transparency changes the map-player object, including retained map state while in battle; a Common Event inherits its caller's context."
          : "Follower visibility changes map-player state and refreshes the player, including retained map state while in battle; a Common Event inherits its caller's context.";
    if (!detail) continue;
    const target = code === 212 || code === 213;
    const nativePath = `${options.prefix ?? ""}list[${index}]${target ? ".parameters[0]" : ""}`;
    const origin = options.origins?.get(command);
    const dslPath = origin
      ? origin.path +
        (target ? (origin.kind === "rawDslCommand" ? ".parameters[0]" : ".target") : "")
      : undefined;
    const diagnostic = `MV-E${code}-CONTEXT`;
    issues.push({
      level: "warning",
      code: diagnostic,
      identity: options.identity,
      stage: options.stage,
      nativePath,
      ...(dslPath ? { dslPath } : {}),
      expected: "runtime context determines native effect; saved parameters are retained",
      actual: describeValue(command.parameters),
      message: `${options.stage} warning ${options.identity}: ${diagnostic} at ${nativePath}: ${detail}`,
    });
  }
  return issues;
}
