# RPG Maker Event DSL

RPG Maker Event DSL lets you write supported RPG Maker MV game logic as TypeScript code
and compile it back into RPG Maker MV project data.

The package provides:

- A TypeScript DSL for supported switches, variables, common events, map events, pages,
  references, assets, and RPG Maker MV event commands.
- A CLI for snapshot-based workflows: `init`, `clone`, `pull`, `decompile`, `compile`,
  `diff`, and `push`.
- Safety checks for generated freshness, project drift, and reviewed destructive changes.

The root package export is the Event DSL authoring surface. Programmatic Workspace
operations are available from `rpgmaker-event-dsl/workspace`; the CLI remains the primary
Workspace workflow interface.

This project is in early development. The TypeScript API, DSL syntax, CLI workflow,
generated output, and workspace format may change before `1.0.0`.

## Install

The current stage supports Windows, with Node.js 22 as the runtime and CI baseline.

```bash
npm install --save-dev rpgmaker-event-dsl
```

## Basic Workflow

Create a DSL workspace next to an RPG Maker MV project:

```bash
rpgmaker-event-dsl init --project-root ../Game
rpgmaker-event-dsl clone
```

If you already have event data in the RPG Maker MV project, generate starter DSL source:

```bash
rpgmaker-event-dsl decompile
```

After editing DSL source, validate, compile, review, and push:

```bash
rpgmaker-event-dsl compile --check
rpgmaker-event-dsl compile
rpgmaker-event-dsl diff
rpgmaker-event-dsl push
```

## Example

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
  commands: [showText({ lines: ["Welcome."] })],
});
```

See the repository README for the full workflow, safety model, command coverage, and
example project:

https://github.com/zyz23333/rpgmaker-event-dsl

Switch and variable references by ID accept unnamed slots within the final System
capacity: the larger of Snapshot capacity and the highest DSL declaration ID.
Removing a name retains that capacity; referencing an ID does not expand it.
Switch and variable names resolve only from unique DSL declarations. Existing
database entries with empty names remain referenceable by ID.

`controlSwitches` ranges include both endpoints and reject reversed order.
`controlSwitches` and `controlSelfSwitch` require an explicit Boolean `value`;
self-switch letters are A–D. A Common Event called by a Map Event inherits its
caller identity for self switches.

## Loop and event processing

```ts
import { breakLoop, exitEventProcessing, loop, wait } from "rpgmaker-event-dsl";

const commands = [loop({ body: { commands: [wait(1), breakLoop()] } }), exitEventProcessing()];
```

Each Loop requires `body.commands`, which can be empty. Its optional `endMarker`
is `"present"` by default or `"absent"` for a nonempty body whose native saved
shape has no trailing Body End Marker. Empty bodies require the marker. The
body marker, Repeat Above record, and final event-list terminator have separate
ownership; markers inside nested bodies retain their own indentation and state.
Formal and raw commands are checked together, so a raw tail marker cannot
contradict `endMarker` or duplicate it. Valid nested raw structures remain usable.

`breakLoop()` exits the enclosing Loop. Outside a Loop it remains compilable
with a warning: MV searches for a matching Repeat Above record and can skip
the remaining event commands. `exitEventProcessing()` ends the current
interpreter. When a called Common Event exits, its caller continues after the
call. Loop children receive the same Script Command Gate and reference checks
as the containing event.

Complete Workspace command lists require exact structural records, indentation,
and one final event terminator. Malformed recognized flow commands fail before
Decompile publishes source; their diagnostic identifies the event and native
list position. Internal command-family renderers also accept command fragments,
which are not complete saved event lists.

## License

MIT
