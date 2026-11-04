# Authoring Event DSL source

[Documentation](README.md)

Read this guide when creating declarations or sharing source between events. Use the [event reference](reference/events.md) for identity, fields and defaults, and the [command reference](reference/commands/README.md) for individual helpers.

- [How This Works](#how-this-works)
- [Declaration files](#declaration-files)
- [Source discovery](#source-discovery)
- [Shared authoring values](#shared-authoring-values)
- [Parameterized command functions](#parameterized-command-functions)
- [Runtime scripts](#runtime-scripts)

## How This Works

RPG Maker MV events are stored as JSON. Inside that JSON, event commands are not stored as
readable names like "Show Text" or "Call Common Event". They are stored as command
records with numeric codes, indentation, and parameter arrays.

For example, this is the raw RPG Maker MV shape for a simple text message:

```json
[
  { "code": 101, "indent": 0, "parameters": ["", 0, 0, 2] },
  { "code": 401, "indent": 0, "parameters": ["Welcome."] },
  { "code": 0, "indent": 0, "parameters": [] }
]
```

That is valid RPG Maker MV data, but it is hard to write, review, refactor, or ask an AI
agent to change safely.

The DSL gives those raw records readable names and typed structure:

```ts
commands: [
  showText({
    lines: ["Welcome."],
    face: { image: null, index: 0 },
    background: "window",
    position: "bottom",
  }),
];
```

That single DSL command compiles into the raw command list above. `code: 101` starts the
text message, `code: 401` stores the text line, and `code: 0` terminates the command
list.

The same mapping applies to larger RPG Maker MV structures:

- `commonEvent(...)` becomes an entry in `CommonEvents.json`.
- `mapEvent(...)` becomes an event inside a `Map###.json` file.
- `page(...)` becomes an RPG Maker MV event page.
- `troopEvent({ troopId, pages })` owns the ordered battle event pages of an existing
  troop; `battlePage({ conditions?, span?, commands })` describes one battle page.
- `switchDefinition(...)` and `variableDefinition(...)` describe named project IDs.
- References such as `switchRef({ id: 1 })` compile back to the numeric IDs that RPG
  Maker MV expects.

## Declaration files

A DSL file is a TypeScript file that exports RPG Maker MV declarations. For example,
`src/system.dsl.ts` can define a switch and a common event:

```ts
import { commonEvent, showText, switchDefinition } from "rpgmaker-event-dsl";

export const hasKey = switchDefinition({
  id: 1,
  name: "Has Key",
});

export const introCommonEvent = commonEvent({
  id: 1,
  name: "Intro",
  trigger: "none",
  commands: [
    showText({
      lines: ["Welcome."],
      face: { image: null, index: 0 },
      background: "window",
      position: "bottom",
    }),
  ],
});
```

When compiled, `introCommonEvent` becomes a `CommonEvents.json` entry, and its
`showText(...)` command becomes RPG Maker MV's raw text command records.

For required declaration fields and defaults, see [Common Events](reference/events.md#common-events).

## Source discovery

Files under `sourceRoot` are evaluated as declaration entries when they match
`sourceInclude` and do not match `sourceExclude`. The default patterns include event
declarations such as `src/maps/Map001.events.ts` and system declarations such as
`src/system.dsl.ts`. Ordinary helper modules should use names outside those include
patterns unless they are intended to export DSL-owned declarations.
Directory exclusions also apply to their descendants. Empty `sourceInclude` selects
all ordinary files. Discovery always excludes the reserved Decompile isolation
directory by physical location and deduplicates physical file aliases. The source
package must use `"type": "module"` for the generated TypeScript imports and exports.

Discovery settings are defined in [Workspace Config](reference/cli.md#workspace-config). Ordinary helper modules can live alongside entries without becoming declarations themselves.

## Shared authoring values

Local modules can export constants, configuration objects, references and command
arrays for several Definition Sources to reuse. For example, a shared module:

```ts
// src/shared/greeting.ts
import { comment } from "rpgmaker-event-dsl";

export const greeting = [comment({ lines: ["Welcome to the village."] })];
export const eventSettings = { trigger: "none" } as const;
```

An event source imports the named values and explicitly spreads the command array:

```ts
// src/intro.events.ts
import { commonEvent } from "rpgmaker-event-dsl";
import { eventSettings, greeting } from "./shared/greeting.js";

export const intro = commonEvent({
  ...eventSettings,
  id: 1,
  name: "Introduction",
  commands: [...greeting],
});
```

Relative imports follow ESM/NodeNext resolution, including `.js` specifiers resolving
to `.ts` source. Dependencies may import other shared modules and use named import
aliases and local named export lists. Value-module cycles fail with their import chain.
Only discovered entry exports are collected as project declarations; importing a
helper does not make its exports additional events. Include/exclude patterns select
entry files, so a dependency can be imported even when it is not an entry candidate.

Value-module targets must remain physically inside `sourceRoot` and outside the
reserved Decompile isolation area, including through directory aliases. Local default
or namespace imports, direct re-exports, and host-module execution are unsupported.
The loader evaluates a restricted DSL expression subset; this is compile-time source
composition and does not add a runtime Common Event call. Type-only imports remain
validated without evaluating their module values.

Shared implementation files are type-checked and captured with their dependencies.
After changing a shared module, run `compile` again before `diff` or `push`; an unchanged
entry file does not keep the old generated data fresh. `compile --check` validates the
same composition without publishing data or refreshing its compilation baseline.

## Parameterized command functions

Shared modules and event files can declare named functions or const arrow functions.
These functions compose DSL values during Compile/Check. A reward helper can accept
one typed options object, while another helper arranges the resulting commands:

```ts
// src/shared/rewards.ts
import { changeGold, comment, type DslCommand } from "rpgmaker-event-dsl";

export function reward(options: { gold: number; text: string }): DslCommand[] {
  const amount = { kind: "constant", value: options.gold } as const;
  return [comment({ lines: [options.text] }), changeGold({ operation: "gain", value: amount })];
}

export const openedChest = ({ gold, text }: { gold: number; text: string }) => [
  ...reward({ gold, text }),
  comment({ lines: ["Opened"] }),
];
```

Each event keeps its explicit identity and supplies its own parameter values:

```ts
// src/rewards.events.ts
import { commonEvent } from "rpgmaker-event-dsl";
import { openedChest as chest } from "./shared/rewards.js";

export const copper = commonEvent({
  id: 1,
  name: "Copper reward",
  trigger: "none",
  commands: chest({ gold: 25, text: "Copper chest" }),
});

export const silver = commonEvent({
  id: 2,
  name: "Silver reward",
  trigger: "none",
  commands: chest({ gold: 90, text: "Silver chest" }),
});
```

Use existing free Common Event IDs when adding this example to a project. The helper
calls expand at compilation; an explicit `callCommonEvent(...)` still creates the
ordinary game runtime Common Event call.

The copyable [Shared Authoring Sample Workspace](../example/shared-authoring/README.md)
adds shared configuration and a transitive command-array dependency, with the complete
Check → Compile → Diff → Push sequence and a shared-change/recompile exercise. Its
source is verified through the built CLI. Compile-time options choose the emitted
commands; game-time chest state still needs pages, switches or `conditional(...)`.

Functions accept zero parameters or one options object. A named parameter supports
property reads; a shallow object pattern supports named properties and renaming,
such as `{ gold: amount }`. Parameter and return type annotations are checked in both
Compile and Check, including inside imported modules. Arrow functions may return an
expression. Block bodies contain only named `const` declarations followed by one
final `return` expression. Functions use lexical bindings and independent call locals;
function declarations are available before their source position, while const values
must be initialized before use.

Functions may return constants, configuration, references, one DSL Command or arrays
of commands. Arrays keep their nesting: use `...` to arrange fragments in the desired
order. Functions cannot return other functions or complete Event Definitions, and
function-valued options are unsupported. Defaults, rest parameters, nested
destructuring, `this`, assignments, general control flow, arithmetic, interpolated
templates, host/array methods, async functions, generators and classes are outside
this subset. Recursive calls fail with the function chain. Loaded function bodies
are checked even when unused; unimported helper files remain outside Discovery.

Function construction failures identify the shared definition and call locations.
Later reference, context and asset diagnostics keep their event identity and DSL/native
paths. `source` is the nearest reliable authored object or command location; `use`
identifies a shared value expansion, and `call NAME` with `defined` follows author
functions from the inner definition out to the event use. Repeated uses retain separate
chains even when asset findings are grouped. These coordinates identify authored
expressions, not necessarily individual parameter fields. Raw saved commands and
unresolved identities keep their available paths without claiming unknown coordinates.
After editing an implementation, re-run Compile before Diff/Push; Check validates the
new implementation without making existing output fresh. Event JavaScript inside
commands remains stored text governed by the existing Script Command Gate.

## Runtime scripts

Keep `scriptEnabled` false when event JavaScript should be rejected. Compile-time author functions do not enable event JavaScript. See [scripts, plugins and raw commands](reference/commands/extensions.md) for the gate and saved-value rules.
