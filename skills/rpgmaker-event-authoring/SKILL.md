---
name: rpgmaker-event-authoring
description: Use when an agent needs to author RPG Maker MV gameplay behavior as Event DSL source with rpgmaker-event-dsl. Trigger on requests to set up or take over an RPG Maker MV project, initialize a Workspace, clone or decompile project data, create or modify Map Events, Common Events, event pages, dialogue, choices, quests, chests, doors, transfers, shops, battles, switches, variables, plugin commands, script commands, raw MV event commands, compile, diff, or prepare a reviewed push.
---

# RPG Maker Event Authoring

Turn RPG Maker MV gameplay intent into idiomatic Event DSL source. Use Workspace commands to support authoring, validation, and review; do not let the command sequence replace authoring judgment.

## Steps

1. Classify the starting point.

   Decide whether the user already has a Workspace or needs initial takeover from an RPG Maker MV Project Root. If takeover is needed, use `init`, `clone`, and `decompile` as appropriate before authoring. Read `references/workflow-safety.md` before any Workspace setup, synchronization, Diff, or Push work.

   Completion criterion: the Workspace state is known, or the missing Project Root or Workspace prerequisite is reported.

2. Understand the gameplay intent.

   Identify the trigger, location, player-visible result, repeat behavior, failure path, and persistent state. Add only short functional player-facing text unless the user asks for story, tone, or character voice.

   Completion criterion: the event can be stated as "when the player does X, the game checks Y, does or shows Z, and records state W."

3. Choose the MV event shape.

   Decide whether the behavior belongs in a Map Event, Common Event, or both. Choose pages for persistent state branches, command lists for moment-to-moment flow, switches and variables for shared game state, and self switches for local event state. Read `references/event-patterns.md` when the structure is not obvious.

   Completion criterion: every persistent state branch has an owner: page condition, switch, variable, or self switch.

4. Author Definition Source.

   Edit Definition Source selected by the Workspace Config. Preserve existing Entry Identity and local source style. Prefer supported DSL helpers. Use `script(...)`, `pluginCommand(...)`, or `rawDslCommand(...)` only when grounded by user intent, project evidence, plugin documentation, or confirmed RPG Maker MV command shape.

   Completion criterion: each intended RPG Maker MV event command is represented by a DSL Command or a justified escape hatch.

5. Validate the event flow.

   Review first interaction, repeated interaction, unmet condition, success condition, and post-completion state. Check that autorun pages turn themselves off, one-time rewards cannot repeat, and referenced project data can resolve.

   Completion criterion: the authored event has no missing command list, accidental repeat, unreachable branch, undefined reference, or unsupported behavior hidden as if it were implemented.

6. Run Workspace validation and stop before unsafe writes.

   Run Compile Check, then compile and Diff using the command form available in the Workspace. Usually this is `rpgmaker-event-dsl compile --check`, `rpgmaker-event-dsl compile`, and `rpgmaker-event-dsl diff`.

   Completion criterion: Compile Check passes and Diff matches the intended event behavior, or the blocker is reported.

## Write Boundary

Do not hand-edit Generated Project Data, Project Data Snapshots, or Project Root `data/*.json` during normal authoring.

Do not run `push` unless the user explicitly asks to apply, push, or write the reviewed result to the RPG Maker MV Project Root.

Do not run `push --allow-destructive` unless the user explicitly confirms the destructive entries shown by Diff.

## Output

Report the authored gameplay behavior, changed Definition Source files, introduced switches, variables, self switches, Common Events, plugin commands, script commands, or raw commands, validation results, Diff summary, Affected Project Data Files when available, and whether Push was skipped or completed.
