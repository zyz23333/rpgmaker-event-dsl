# RMMV Event DSL Planning

## Purpose

This document sketches a TypeScript-first authoring layer for RPG Maker MV events.
The goal is to let an AI agent author readable, typed event intent while a compiler
emits the raw RPG Maker MV event JSON shape.

The project should avoid direct agent edits to `code / indent / parameters` command
arrays. Raw MV event commands are compact but fragile. A small mistake in command
order, continuation commands, indentation, or ID references can silently break game
logic.

## Core Idea

Use a layered pipeline:

```text
Agent-authored TypeScript DSL
  -> typed EventNode AST
  -> validated project-aware patch
  -> compiled RMMV EventCommand[]
  -> merged Map###.json / CommonEvents.json
  -> raw command validation and smoke checks
```

The public DSL should expose event concepts, not MV command internals.

Example authoring surface:

```ts
event("NorthGate", { x: 12, y: 4 }, [
  page({ trigger: "action" }, [
    conditional(hasItem(item("Old Key")), [
      showText(["The gate opens."]),
      transferPlayer({ map: map("WorldMap"), x: 10, y: 8, direction: "down" }),
    ], [
      showText(["The gate is locked."]),
    ]),
  ]),
]);
```

The compiler should emit the MV-compatible command list:

```json
[
  { "code": 111, "indent": 0, "parameters": [8, 1] },
  { "code": 101, "indent": 1, "parameters": ["", 0, 0, 2] },
  { "code": 401, "indent": 1, "parameters": ["The gate opens."] },
  { "code": 201, "indent": 1, "parameters": [0, 3, 10, 8, 2, 0] },
  { "code": 411, "indent": 0, "parameters": [] },
  { "code": 101, "indent": 1, "parameters": ["", 0, 0, 2] },
  { "code": 401, "indent": 1, "parameters": ["The gate is locked."] },
  { "code": 0, "indent": 0, "parameters": [] }
]
```

## Design Principles

- Public DSL must not expose continuation commands such as `401`, `408`, `605`, or
  `655`.
- Public DSL must not require authors to manage `indent`.
- Raw command construction should be treated as an explicit unsafe escape hatch.
- Project IDs should be resolved from names where possible, then validated against
  project data.
- Compiler output should be deterministic and easy to snapshot test.
- The system should preserve unknown fields when patching existing map data.
- Validation should catch both DSL misuse and compiler bugs.

## Non-Goals

- Do not replace the RPG Maker MV editor.
- Do not execute arbitrary agent-authored TypeScript without restrictions.
- Do not initially cover every MV event command.
- Do not infer or create missing switches, variables, items, maps, or events unless
  the caller explicitly requests creation.
- Do not rely on keyboard/mouse automation of the MV editor.

## Relevant MV Runtime Sources

The MV runtime does not expose a data-driven event command schema. The schema must
be recovered from the core scripts and editor-generated samples.

Key source files:

- `references/rpg-maker-mv-corescript/js/rpg_managers/DataManager.js`
  - Loads `data/Map###.json` through `JSON.parse`.
  - Populates `$dataMap`.
  - Extracts metadata from `note` fields.
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Map.js`
  - Creates runtime `Game_Event` instances from `$dataMap.events`.
  - Sets up autorun, parallel, and starting events.
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Event.js`
  - Selects active event pages.
  - Applies page conditions.
  - Applies image, movement, priority, and trigger settings.
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`
  - Dispatches command objects by `command.code`.
  - Contains the authoritative runtime behavior for event command parameters.

## MV Event Data Shape

Approximate event structure:

```ts
type RmmvEvent = {
  id: number;
  name: string;
  note: string;
  x: number;
  y: number;
  pages: RmmvEventPage[];
};

type RmmvEventPage = {
  conditions: RmmvPageConditions;
  image: RmmvEventImage;
  moveType: number;
  moveSpeed: number;
  moveFrequency: number;
  moveRoute: RmmvMoveRoute;
  walkAnime: boolean;
  stepAnime: boolean;
  directionFix: boolean;
  through: boolean;
  priorityType: number;
  trigger: number;
  list: RmmvEventCommand[];
};

type RmmvEventCommand = {
  code: number;
  indent: number;
  parameters: unknown[];
};
```

Page selection rule:

```text
RPG Maker MV checks pages from last to first.
The last page whose conditions pass becomes the active page.
```

This is important when compiling domain helpers like chests, doors, and staged NPCs.

## Public AST Draft

The public AST should represent concepts, not raw command arrays.

```ts
type EventNode =
  | ShowTextNode
  | ShowChoicesNode
  | ConditionalNode
  | LoopNode
  | BreakLoopNode
  | ExitEventNode
  | CommonEventNode
  | LabelNode
  | JumpToLabelNode
  | ControlSwitchNode
  | ControlVariableNode
  | ControlSelfSwitchNode
  | ChangeGoldNode
  | ChangeItemNode
  | TransferPlayerNode
  | SetEventLocationNode
  | MoveRouteNode
  | WaitNode
  | ScriptNode
  | PluginCommandNode
  | UnsafeRawCommandNode;
```

Continuation command handling should be internal:

```text
showText()       -> 101 + 401*
scrollingText()  -> 105 + 405*
comment()        -> 108 + 408*
script()         -> 355 + 655*
showChoices()    -> 102 + 402* + optional 403
conditional()    -> 111 + optional 411
loop()           -> 112 + 413
shopProcessing() -> 302 + 605*
battle()         -> 301 + optional 601/602/603 branches
```

## Type-Level Guards

The TypeScript API should make common invalid structures unrepresentable:

- No public `command401()` or equivalent continuation builder.
- No public `indent` argument.
- No public end-of-list command; the compiler appends `code: 0`.
- `showText()` requires at least one text line.
- `conditional()` takes structured `then` and optional `else` node arrays.
- `loop()` takes a structured body and emits `413` internally.
- `selfSwitch()` accepts only `"A" | "B" | "C" | "D"`.
- Triggers, directions, fade types, and message positions use string literal unions.

Example branded and literal types:

```ts
type SelfSwitchName = "A" | "B" | "C" | "D";
type Trigger = "action" | "playerTouch" | "eventTouch" | "autorun" | "parallel";
type Direction = "retain" | "down" | "left" | "right" | "up";
type FadeType = "black" | "white" | "none";

type NonEmptyArray<T> = readonly [T, ...T[]];
```

## Runtime Validation

TypeScript is not a complete safety boundary. Runtime validation is still required
because agents can cast to `any`, construct objects manually, or reference missing
project data.

Validate the public AST:

- Node kinds are known.
- Required fields exist.
- Text lines are non-empty where required.
- Choice branches are non-empty.
- Cancel branch indices are in range.
- Unsafe raw commands include a reason and are explicitly allowed by config.

Validate project references:

- Item, weapon, armor, actor, troop, switch, variable, map, and event references exist.
- Event names are unique within a map where name-based resolution is used.
- Transfer coordinates are within map bounds.
- Referenced image/audio asset names exist where feasible.
- Plugin command targets are known where a plugin command registry is available.

Validate raw compiler output:

- Every event command has `code`, `indent`, and `parameters`.
- Every command list ends with `{ code: 0, indent: 0, parameters: [] }`.
- Continuation commands appear only in compiler-approved contexts.
- Indentation never becomes negative.
- Known command parameter arrays have expected length and basic types.
- No unknown command code appears unless unsafe raw commands are enabled.

## Project Index

Name-based authoring requires a project index built from MV data files.

```ts
type ProjectIndex = {
  itemsByName: Map<string, number>;
  weaponsByName: Map<string, number>;
  armorsByName: Map<string, number>;
  actorsByName: Map<string, number>;
  troopsByName: Map<string, number>;
  switchesByName: Map<string, number>;
  variablesByName: Map<string, number>;
  mapsByName: Map<string, number>;
  eventsByMapAndName: Map<number, Map<string, number>>;
};
```

Reference helpers should be explicit:

```ts
gainItem(item("Old Key"), 1);
controlSwitch(switchRef("GateOpened"), true);
transferPlayer({ map: map("WorldMap"), x: 10, y: 8 });
```

The resolver converts names to MV IDs during validation/compilation.

## Initial Command Coverage

Start with the smallest set that supports common narrative and quest workflows:

- `101 / 401` Show Text
- `102 / 402 / 403` Show Choices
- `108 / 408` Comment
- `111 / 411` Conditional Branch / Else
- `112 / 413` Loop / Repeat Above
- `113` Break Loop
- `115` Exit Event Processing
- `117` Common Event
- `118` Label
- `119` Jump to Label
- `121` Control Switches
- `122` Control Variables
- `123` Control Self Switch
- `125` Change Gold
- `126` Change Items
- `201` Transfer Player
- `203` Set Event Location
- `205` Set Movement Route
- `214` Erase Event
- `230` Wait
- `301 / 601 / 602 / 603` Battle Processing
- `302 / 605` Shop Processing
- `355 / 655` Script
- `356` Plugin Command

Later phases can add screen effects, pictures, audio, actor changes, enemy changes,
vehicles, map settings, weather, movie playback, and battle-specific commands.

## Domain Helpers

After the low-level DSL is stable, add domain helpers that compile to event pages
and commands:

```ts
treasureChest("Chest_Potion_01", {
  x: 5,
  y: 9,
  item: item("Potion"),
  amount: 3,
  openedSelfSwitch: "A",
});

lockedGate("NorthGate", {
  x: 12,
  y: 4,
  requiredItem: item("Old Key"),
  onOpen: [transferPlayer({ map: map("WorldMap"), x: 10, y: 8 })],
  lockedText: "The gate is locked.",
});
```

These helpers should encode stable RPG Maker patterns:

- Chest: closed page, reward, self switch, opened page.
- Door/gate: condition check, transfer, locked feedback.
- NPC stage dialogue: first talk, post-state talk, optional reward.
- Quest giver: start switch, completion condition, reward, completion switch.

## Safe Agent Authoring Rules

Generated patches should follow these rules:

- Import only from the public DSL package.
- Do not use `as any`, `unknown as`, or raw object casts.
- Do not import `fs`, `path`, `process`, `child_process`, or unrelated runtime APIs.
- Do not construct `{ code, indent, parameters }` objects directly.
- Do not reference raw numeric database IDs unless explicitly requested.
- Do not create new switches, variables, maps, items, or events implicitly.
- Export a single `defineEventPatch(...)` value.

These rules should be enforced with an AST checker before executing or compiling
agent-authored TypeScript.

## Suggested Repository Shape

```text
packages/rmmv-event-dsl/
  src/
    ast.ts
    public-api.ts
    commands/
      message.ts
      flow.ts
      party.ts
      map.ts
      battle.ts
      script.ts
    compiler/
      compileEventNodes.ts
      compilePage.ts
      compileEvent.ts
      rawCommandSchemas.ts
    validate/
      validateAst.ts
      validateProjectRefs.ts
      validateRawCommands.ts
    project/
      loadProject.ts
      indexProject.ts
      applyPatch.ts
    safety/
      checkGeneratedPatchAst.ts
```

For early experimentation in this repository, keep generated prototypes under a
scratch or prototype directory until the package boundary is clear.

## Test Strategy

Use focused tests with golden samples:

- Compile one DSL node to exact raw command output.
- Compile nested conditionals and loops to expected indentation.
- Validate that public builders reject invalid inputs.
- Validate that raw command output rejects orphan continuation codes.
- Compare compiler output against editor-generated JSON samples.
- Round-trip patch a copied MV test project and verify all JSON files parse.

Golden samples should come from small events created in the RPG Maker MV editor.
The samples are the best way to confirm parameter arrays that are not obvious from
runtime source alone.

## Open Questions

- Should generated patches be TypeScript, JSON, YAML, or a mix?
- Should agent-authored TypeScript be executed in a sandbox or statically checked
  and then evaluated?
- How much of MV's editor-only behavior must be reproduced for compatibility?
- Should switch/variable creation be supported through explicit migration files?
- How should plugin command schemas be discovered or registered?
- Should the first implementation target only map events, or include common events
  from the start?
