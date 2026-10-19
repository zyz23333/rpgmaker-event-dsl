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

## Map Event Pages

`mapEvent({ mapId, id, name, x, y, note?, pages })` owns the complete event.
`note` defaults to `""` and preserves whitespace, CR/LF/CRLF, tags and trailing
newlines exactly. Pages retain their array order and require at least one page;
more than 20 pages produces a warning and preserves them. Event IDs have no 999
ceiling. Initial positions must fit the captured map; occupied positions warn.

`page({ conditions?, image?, movement?, priority?, options?, trigger?, commands })`
always requires `commands`, including `[]`. Optional groups accept partial objects
or `{}` and supply these fixed defaults independently:

| Field                                 | Values                                                 | Default                                         |
| ------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| image.character                       | characters `imageAsset(...)` or null                   | null                                            |
| image.characterIndex                  | integer 0..7                                           | 0                                               |
| image.tileId                          | integer 0..1023                                        | 0                                               |
| image.direction                       | down / left / right / up                               | down                                            |
| image.pattern                         | integer 0..2                                           | 0                                               |
| movement.type                         | fixed / random / approach / custom                     | fixed                                           |
| movement.speed / frequency            | integers 1..6 / 1..5                                   | 3 / 3                                           |
| movement.route                        | shared Movement Route                                  | empty, repeat true, skippable false, wait false |
| priority                              | below / same / above                                   | below                                           |
| options.walkAnimation / stepAnimation | boolean                                                | true / false                                    |
| options.directionFix / through        | boolean                                                | false / false                                   |
| trigger                               | action / playerTouch / eventTouch / autorun / parallel | action                                          |

Each Page Condition Slot carries `enabled` and its saved setting:

```ts
page({
  conditions: {
    switch1: { enabled: false, ref: switchRef({ id: 17 }) },
    variable: { enabled: true, ref: variableRef({ id: 1 }), atLeast: 3 },
    selfSwitch: { enabled: true, value: "A" },
  },
  image: { character: imageAsset({ folder: "characters", name: "People1" }), characterIndex: 2 },
  priority: "same",
  options: { directionFix: true },
  commands: [],
});
```

`switch1`, `switch2`, `item` and `actor` require `enabled` and the corresponding
`ref`; `variable` also requires integer `atLeast` from -99,999,999 to 99,999,999;
`selfSwitch` requires `enabled` and A–D `value`. Omitted slots are disabled with
saved ID 1, variable threshold 0 and self switch A. Enabled references must exist.
Only disabled explicit IDs may retain 0 or missing positive targets. Disabled name
references still resolve uniquely; DSL-owned names use actual declarations.

Image fields remain independent. Tile selection preserves the character and index;
None and big-character names (`$`, `!$`, `$!`) preserve nonzero indexes, direction
and pattern. Selecting an image never changes priority. A nonzero tile uses the
actual Snapshot Map's `tilesetId` and corresponding Tilesets entry, with B/C/D/E
bands 1..255 / 256..511 / 512..767 / 768..1023. A missing required context errors;
an empty selected group warns and preserves the tile. Assets are filename stems,
with no image-file or dimension scan.

Every saved route is validated, including fixed/random/approach pages, and route
scripts require the Script Command Gate even when empty or inactive. Decompile
emits only fields whose saved values differ from defaults and always emits commands.
Missing, mistyped or unknown owned native fields fail before source publication.
Diff reports zero-based native paths and one-based page positions. Push preserves
external Map fields and null holes; removing an event nulls its slot and uses the
existing Destructive Push guard.

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

Decompile checks the complete candidate at its final source location, then publishes
`sourceRoot/decompiled/` in one non-overwriting directory move. The entire destination
must be absent, including an empty directory or junction. All generated files must
match source discovery, and their identities must not conflict with existing source.
Existing source provides identities only; it cannot repair candidate references.

Use `"type": "module"` in the source package. Complete publication requires Windows
PowerShell, an existing source root, and source/state paths on the same filesystem.
`init` creates the default `src`; pre-create a custom source root. Unsupported paths
fail before publishing. Isolated interrupted candidates remain permanently outside
Discovery. A retry after a completed move reports that the destination already exists.

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

## Push safety

Push checks raw bytes across all 14 standard database files and every map registered
by the captured Snapshot's MapInfos, including when Diff has no changes. Plugin files
and unregistered maps stay outside this set. Diff compares parsed values and ignores
object key order, formatting and equivalent escapes; live byte changes still require
Pull and another Compile before Push. Canonical high map names such as `Map1001.json`
are supported in Diff filters and Push.

Only Affected files are backed up and written. Push checks the full original set before
the first replacement, the actual old bytes at each capture, and the full expected set
after writes before synchronization metadata is refreshed. Postwrite conflicts or
finalization failures retain Interrupted Push state and the observed live files.
Atomic non-overwriting installation/restoration preserves concurrent target arrivals;
unsupported installation fails safely. If restoration fails, the diagnostic identifies
the captured original retained in `push-staging.tmp-*/original`, which may hold unique
external bytes. These checks do not provide isolation from later external saves or a
project-wide rollback.

Only Push resolves pending state against its original target and frozen compilation
evidence. All Affected live files must match either the generated bytes (finish
recording completed writes) or the original Snapshot bytes (abandon pending and
continue). Mixed, missing or unknown live contents and contradictory evidence stop
explicitly. Recovery accepts known original/completed Snapshot bytes from a partially
finished finalization and recognizes an already committed manifest.

Backups, the complete generated output and the actual consumed bytes are verified.
Snapshot and manifest publication can be retried after interruption. Pending authority
is retired as one directory rename; a later cleanup failure may leave retired evidence
without invalidating the recorded synchronization. Recovery preserves the original
source, dependency, configuration and contract basis, including missing fields.
Ordinary Freshness and full Project Drift checks then run before any new write.

## License

MIT
