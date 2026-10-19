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

Clone, Pull, Decompile, Compile (including `--check`), Diff, Push and the Workspace
API's freshness query share a per-Workspace lock. Contention immediately reports
`Workspace is busy`; retry after the active operation finishes. Different Workspaces
operate independently. Windows releases the lock when its owner exits or crashes.
The persistent `.rpgmaker-event-dsl/operation.lock` file stays in place; its existence
does not indicate a live owner. Lock release preserves pending Interrupted Push state,
which only Push can resolve.

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

Workspace validation resolves Animations, Tilesets, Enemy entries and maps from the
captured Snapshot, retaining empty-name IDs. Fixed targets of `showAnimation`,
`changeTileset` and `enemyTransform` are checked in formal commands, recognized raw
records and before Decompile publishes source. Runtime enemy positions and dynamic
equipment candidates retain their selector meaning. Capture database changes with
`pull` before compiling against them.

Clone and Pull capture exact UTF-8 file bytes, their hashes and the map collection
selected by the same MapInfos input. Invalid collections, missing registered maps,
malformed carriers and undecodable bytes fail explicitly. An observed input or
configuration change before publication requires a rerun. A manifest installation
failure during publication restores the previous Snapshot and manifest.

Snapshot and Compile Baseline bind to the canonical Project Root path. Changing
`projectRoot` requires an explicit `pull`, then a new compile; ordinary commands reject
the old binding. Junction aliases to the same target are accepted. A pending Interrupted
Push must first be recovered by Push against its original target. Unknown, incomplete
or inconsistent pending state is preserved for manual correction.

Compile captures discovered source bytes and the TypeScript host's actual validation
inputs, including declaration files, package metadata, module-resolution candidates
that are currently missing, and relevant directory listings. They join the relevant
Workspace Config, complete Snapshot file set and content, canonical target and a
tool-maintained Compile Contract Version in the Compile Baseline. Changing a type
dependency, adding a higher-priority declaration, or changing these assumptions makes
Generated Project Data stale; Diff and Push require another successful Compile.
Missing or mismatched contract metadata also requires Compile. Type validation uses
the Workspace directory consistently through both the API and CLI.

Validation, source evaluation, generated data and hashes use the same captured source
and Snapshot bytes. Compile, `compile --check` and Decompile recheck observed content,
source discovery, configuration and target before publication and fail with a rerun
diagnostic when they change. Check is read-only and creates no Generated Freshness.
Check constructs, validates and serializes the same complete in-memory Compile
Output as Compile, including command structure, references and the Script Command
Gate, without writing candidate files. Compile validation failure publishes nothing.
A publication I/O error or process interruption can leave local generated data
unusable; an explicit successful Compile restores it. Diff and Push verify actual
file bytes and the complete owned output set independently of the manifest's list:
currently CommonEvents, System and all maps registered in the Snapshot's MapInfos.
Compile changes neither the Snapshot nor the Project Root.
Type-only imports are validated without executing modules; ordinary helper value
imports remain unsupported, and event JavaScript remains stored text. These are
explicit consistency checks; an external editor may still save after the last check.

`controlSwitches` ranges include both endpoints and reject reversed order.
`controlSwitches` and `controlSelfSwitch` require an explicit Boolean `value`;
self-switch letters are A–D. A Common Event called by a Map Event inherits its
caller identity for self switches.

## Movement Routes

```ts
import { setMovementRoute } from "rpgmaker-event-dsl";

const routeCommand = setMovementRoute({
  target: { kind: "runtimeSelector", scope: "character", target: "player" },
  route: {
    commands: [{ kind: "turnDown" }, { kind: "jump", x: 0, y: 1, savedShape: { indent: "null" } }],
    repeat: false,
    wait: true,
  },
});
```

The shared `MovementRoute` type requires `commands`, including an empty array.
Its flags default to repeat=true, skippable=false and wait=false. Each instruction's
optional `savedShape.indent` is `"absent"` by default, `"null"` for native null,
or `"zero"` for native numeric 0. Parameterless instructions omit parameters.
The route's `terminator.parameters` is `"empty"` by default or `"absent"`;
its sole final M0 has no indent and produces no 505. Empty saved descriptors and
optional undefined fields use these defaults. Set Movement Route owns all 505
continuations and validates their complete ordered objects, preserving missing keys,
null, zero and nested audio values. Conflicting mirrors, unknown movement codes,
extra fields and unsupported envelopes fail. Recognized raw routes retain switch
reference and Script Command Gate validation.

Map Event Pages use `movement: { type?, speed?, frequency?, route? }`. Type is
`"fixed"` (default), `"random"`, `"approach"` or `"custom"`; speed is integer 1..6,
frequency is integer 1..5, and both default to 3. The route shares `MovementRoute`
and defaults to `{ commands: [] }`. Its saved flags, instructions and envelope states
remain preserved and validated in every movement mode. A saved script in a fixed
Page route still requires the Script Command Gate.

## Raw commands and the Script Command Gate

`rawDslCommand({ code, indent?, parameters })` carries one event command. Explicit
indent 0 is absolute. Decompile preserves genuinely unknown event codes with warnings,
provided the native envelope, strict JSON parameters and owning structure are valid.
Known malformed or currently unrepresented saved variants fail before source publication.
Known raw codes receive the same supported parameter, reference, continuation and
mirror validation as formal commands.

Strict JSON accepts finite numbers including negative zero, exact strings, null, dense
ordinary arrays and ordinary own-data objects. It preserves own `__proto__` keys, key
presence and empty containers. Undefined, holes, non-finite numbers, custom prototypes,
accessors, cycles and extra native record fields are rejected.

The Gate checks every recognizable script location, including empty or unreachable
355/655 records, script conditions and variable operands, route scripts, 505 mirrors
and saved Page routes even outside custom movement. When `scriptEnabled` is false,
Decompile warns while producing source; Check and Compile reject actual current source
containing scripts. Removing those scripts permits compilation without replacing the
old Snapshot. Plugin command argument semantics remain external.

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
