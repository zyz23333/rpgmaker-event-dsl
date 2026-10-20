# RPG Maker Event DSL

RPG Maker Event DSL lets you write supported RPG Maker MV game logic as TypeScript code
and compile it back into RPG Maker MV project data.

The package provides:

- A TypeScript DSL for supported switches, variables, common events, map events, troop events, pages,
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

## Audio Commands

Give each playback or system audio helper a complete payload, including None:

```ts
playBgm({
  audio: { asset: audioAsset({ folder: "bgm", name: "Theme1" }), volume: 90, pitch: 100, pan: 0 },
});
playBgs({ audio: { asset: null, volume: 1, pitch: 51, pan: -0 } });
changeVehicleBgm({ vehicle: "boat", audio: { asset: null, volume: 0, pitch: 50, pan: -100 } });
fadeoutBgm({ duration: 2 });
saveBgm();
replayBgm();
stopSe();
```

`asset`, `volume`, `pitch` and `pan` are required. The numeric fields accept
integers in 0..100, 50..150 and -100..100 respectively, including values between
the editor's arrow steps. Numeric negative zero in volume and pan survives the
round trip. Use `null` for None; a named Audio Asset Reference requires a nonempty
exact filename stem and the matching folder. BGM playback, battle BGM and vehicle
BGM use `bgm`; BGS uses `bgs`; ME playback, victory ME and defeat ME use `me`; SE
uses `se`. Vehicle BGM requires boat, ship or airship. Values are explicit and do
not inherit current project audio settings or require an asset file scan.

BGM/BGS None stops its stream in MV. ME None first stops ME and may restore BGM.
SE None leaves existing SE playing; use `stopSe()` to stop them. None retains the
three saved numeric fields in every helper. `fadeoutBgm` and `fadeoutBgs` require
an integer duration of 1..999 seconds and return without adding a wait command.
`saveBgm()`, `replayBgm()` and `stopSe()` take no arguments.

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

Map variable thresholds, disabled explicit condition IDs, and image `characterIndex`,
`tileId` and `pattern` preserve numeric `-0` through source generation, compilation and
Push. Decompile emits these values explicitly because the positive-zero defaults
cannot reconstruct their sign. Enabled condition IDs remain positive; native
priority, trigger and movement-type enums reject `-0` before named-symbol conversion.

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
The native `events` array must contain its required `null` slot zero; an empty
array fails with a located Map shape diagnostic before any candidate is published.
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

Common Events require an explicit positive `id`, exact string `name`,
`trigger: "none" | "autorun" | "parallel"`, and a `commands` array, including when
empty. Names may be empty or duplicated; a name reference requires exactly one
current Common Event declaration. Call one with
`callCommonEvent({ commonEvent: commonEventRef({ id: 1 }) })`.
Autorun and parallel require `switch: switchRef(...)`. The optional switch for none
preserves its independent native saved value; omission or explicit `undefined`
writes fixed `switchId: 1`.
Every explicit reference requires a valid System Switch slot or unique staged
Switch name. Common Events inherit invocation context without map/battle
annotations. Removing one preserves its null ID hole and needs a destructive Push.

Workspace validation resolves Animations, Tilesets, Enemy entries and maps from the
captured Snapshot, retaining empty-name IDs. Fixed targets of `showAnimation`,
`changeTileset` and `enemyTransform` are checked in formal commands, recognized raw
records and before Decompile publishes source. Runtime enemy positions and dynamic
equipment candidates retain their selector meaning. Capture database changes with
`pull` before compiling against them.

Map appearance uses explicit saved values. `changeMapNameDisplay({ enabled })`
requires a Boolean; `changeTileset({ tileset: tilesetRef({ id: 2 }) })` requires
an existing Snapshot Tileset and has no None value. `changeBattleBack({ battleback1,
battleback2 })` requires both independent slots, each an image Asset Reference in
`battlebacks1` or `battlebacks2` respectively, or explicit `null` for None.
`changeParallax({ image: null, loopX: false, loopY: true, sx: 32, sy: -32 })`
requires all five fields. Its image uses `parallaxes`; integer speeds −32..32 preserve
negative zero and remain saved with looping disabled or image None. None compiles
to an empty filename.
Empty Asset Reference names and unknown command fields fail validation. Asset
references preserve names without checking image directories or file sizes.

`changeSaveAccess`, `changeMenuAccess`, `changeEncounter` and
`changeFormationAccess` require `{ enabled: boolean }`; each encodes false as
native 0 and true as native 1. Changing encounters also resets the encounter
count. `changeWindowColor({ tone: { red: 12, green: -24, blue: 36, gray: 113 } })`
requires all four named fields. RGB components are integers −255..255 and gray
is integer 0..255. Hidden gray and numeric negative zero remain saved. Tone has
no array alias, missing-component repair or project-dependent default.

`openMenuScreen()`, `openSaveScreen()`, `gameOver()` and
`returnToTitleScreen()` take no inputs. Menu and Save open on the map even when
ordinary access is disabled and skip in battle. Game Over and Title transition
from map or battle without a dead-actor precondition or automatic save.

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
currently CommonEvents, System, Troops and all maps registered in the Snapshot's MapInfos.
Compile changes neither the Snapshot nor the Project Root.

`troopEvent({ troopId, pages })` replaces the complete ordered Battle Event Page array
of an existing Snapshot troop. Use `battlePage({ conditions?, span?, commands })`;
commands are required and `[]` emits the sole normal terminator. Conditions default to
the native fixed state, and span defaults to `"battle"` (`"turn"` and `"moment"` are
also supported). Every provided condition slot is complete: `turn: { enabled, a, b }`,
`enemy: { enabled, index, hpAtMost }`, `actor: { enabled, ref, hpAtMost }` or
`switch: { enabled, ref }`; `turnEnd` is a Boolean. Turn values are integers 0..9999,
HP thresholds 0..100 and enemy positions nonnegative integers. Optional fields set
to `undefined` mean omission; a supplied slot still requires all its fields. Inactive
saved numeric conditions preserve negative zero. Native span uses the exact enum
0/1/2 and rejects negative zero before source publication. Disabled explicit
actor/switch IDs may retain zero or missing targets;
this exception does not apply to names or commands. An enabled enemy condition
requires the actual member position and valid Enemy references for all raw members.

Troop declarations cannot change troop name, members, positions, hidden flags or
unknown carrier data. Decompile emits every actual troop, including empty-name,
empty-member and Blank events. Pages are nonempty and ordered, with no page IDs;
more than 20 pages warns while preserving the full array. Omission and an explicit
single default page produce the same exact Blank state. A nonblank-to-Blank change
is a destructive Troop Event Reset, visible in global Diff status even when filtered,
and requires `push --allow-destructive`. Two default pages or a disabled nondefault
condition still constitute a nonblank event.

Recovery can finish recording a completed pre-Troops Push whose internally consistent
original evidence uses the understood complete Common/System/Map output set. It
retains that original Compile Contract and type/source/configuration basis. A new
Compile is still required before current output is fresh; arbitrary incomplete output
sets cannot authorize recovery or ordinary Push.
Type-only imports are validated without executing modules; ordinary helper value
imports remain unsupported, and event JavaScript remains stored text. These are
explicit consistency checks; an external editor may still save after the last check.

`controlSwitches` ranges include both endpoints and reject reversed order.
`controlSwitches` and `controlSelfSwitch` require an explicit Boolean `value`;
self-switch letters are A–D. A Common Event called by a Map Event inherits its
caller identity for self switches.

## Actor resources and states

`changeHp`, `changeMp`, `changeTp`, `changeState` and `recoverAll` share the
`ActorResourceTarget` Runtime Selector:

| Target                       | Shape                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Entire party                 | `{ kind: "runtimeSelector", scope: "actor", target: "entireParty" }`                                         |
| Fixed actor                  | `{ kind: "runtimeSelector", scope: "actor", target: "actor", actor: actorRef({ id: 1 }) }`                   |
| Actor selected by a variable | `{ kind: "runtimeSelector", scope: "actor", target: "actorFromVariable", variable: variableRef({ id: 3 }) }` |

HP, MP and TP require `operation: "gain" | "lose"` and an explicit
`ActorResourceOperand`: `{ kind: "constant", value }` or
`{ kind: "variable", variable: variableRef(...) }`. Constant HP/MP quantities are
integers 1..9999; constant TP quantities are integers 1..100. HP also requires
the independent Boolean `allowDeath`, including when gaining HP:

```ts
changeHp({
  target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
  operation: "gain",
  value: { kind: "constant", value: 25 },
  allowDeath: false,
});

changeTp({
  target: {
    kind: "runtimeSelector",
    scope: "actor",
    target: "actorFromVariable",
    variable: variableRef({ id: 3 }),
  },
  operation: "lose",
  value: { kind: "variable", variable: variableRef({ id: 4 }) },
});
```

The selector and variable operand remain dynamic. A target variable whose runtime
value is 0 selects the entire party. A quantity variable may hold 0 or a negative
value; compilation preserves the variable mode and leaves MV to evaluate it.
Party iteration follows MV's execution context, including the participating
members during battle. Runtime HP/MP/TP limits and death behavior belong to MV.

Use `changeState({ target, operation: "add" | "remove", state: stateRef(...) })`
with an existing State reference, and `recoverAll({ target })` for complete
recovery. Fixed Actor and State references must exist in the Snapshot, and
Variable references must resolve to valid System slots. Explicit IDs support
existing unnamed records and slots. Every supplied field is required by its
variant; extra fields and non-data objects are rejected. Known raw actor commands
use the same exact saved-slot counts, ranges and reference checks. Native mode,
operation and actor sentinel slots reject negative zero before conversion to
named selectors.

## Actor growth, skills and classes

`changeExp`, `changeLevel`, `changeParameter` and `changeSkill` use the same
`ActorResourceTarget` variants above. EXP, level and parameter changes require
`operation: "gain" | "lose"` and an `ActorResourceOperand`. Constant EXP is an
integer in 1..9,999,999, level in 1..98, and parameter quantity in 1..9999.
Variable operands retain runtime values independently of those constant ranges.
`changeParameter` requires `parameter: "mhp" | "mmp" | "atk" | "def" | "mat" |
"mdf" | "agi" | "luk"`.

```ts
changeExp({
  target: { kind: "runtimeSelector", scope: "actor", target: "actor", actor: actorRef({ id: 1 }) },
  operation: "lose",
  value: { kind: "constant", value: 100 },
  showLevelUp: true,
});
changeSkill({
  target: { kind: "runtimeSelector", scope: "actor", target: "entireParty" },
  operation: "learn",
  skill: skillRef({ id: 2 }),
});
changeClass({ actor: actorRef({ id: 1 }), class: classRef({ id: 2 }), keepExp: false });
```

`showLevelUp` is an explicit saved Boolean for both EXP and level changes,
including loss operations. `changeSkill` requires `operation: "learn" | "forget"`
and an existing Skill reference. `changeClass` requires existing Actor and Class
references and the explicit Boolean `keepExp`. Keeping EXP transfers cumulative
EXP to the new class; the resulting level depends on that class's EXP curve.
Decompile preserves both Boolean values explicitly. Formal commands and known
raw records use identical saved-slot, value and reference validation.

## Dynamic equipment slots

```ts
changeEquipment({
  actor: actorRef({ id: 1 }),
  slotIndex: 1,
  equipment: { kind: "runtimeSelector", scope: "equipment", target: "idForSlot", id: 3 },
});
changeEquipment({ actor: actorRef({ id: 1 }), slotIndex: 6, equipment: null });
```

`slotIndex` is zero based and must fit the final `System.equipTypes.length - 1`
capacity. The native command stores `slotIndex + 1`; configurations with more
than five slots remain supported. The Actor reference must exist. Explicit
`null` means unload, while a nonempty equipment selector carries a positive safe
integer candidate ID. MV chooses Weapon or Armor from the actor's execution-time
slot type, including dual wield in the second slot. Initial Actor/Class traits
do not freeze that choice.

Missing candidates in a possible table warn with `MV-E319-CANDIDATE`; the native
operation can unload equipment. `MV-E319-RUNTIME` describes the remaining slot,
inventory and equipability uncertainty. Validation preserves the candidate and
uses no substitute from another table. An invalid final System slot is an error
(`MV-E319-SLOTS`) for formal commands, recognized raw records and Decompile.

## Timer saved slots

```ts
import { controlTimer } from "rpgmaker-event-dsl";

const commands = [
  controlTimer({ action: "start", seconds: 83 }), // [0, 83]
  controlTimer({ action: "stop" }), // [1]
  controlTimer({ action: "stop", seconds: 0 }), // [1, 0]
  controlTimer({ action: "stop", seconds: 83 }), // [1, 83]
];
```

Action is required. Start requires seconds; Stop permits omission or explicit
`undefined`, which leaves the saved seconds slot absent. Every present seconds
value is an integer in 0..5999, including numeric negative zero with its sign
preserved. Decompile writes a present Stop seconds value explicitly, including 0.
Recognized raw Timer commands use the same exact one/two-slot contract. Native
action codes 0/1 are categorical and reject negative zero. Invalid types, null,
missing Start seconds, extra slots, sparse slots and undefined array elements fail
validation before output publication or Push.

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

All 45 native movement instructions are formal `MoveRouteCommand` objects. M1–13
use `moveDown`, `moveLeft`, `moveRight`, `moveUp`, `moveLowerLeft`, `moveLowerRight`,
`moveUpperLeft`, `moveUpperRight`, `moveRandom`, `moveTowardPlayer`, `moveAwayFromPlayer`,
`moveForward`, and `moveBackward`. M16–26 use `turnDown`, `turnLeft`, `turnRight`,
`turnUp`, `turn90Right`, `turn90Left`, `turn180`, `turn90RightOrLeft`, `turnRandom`,
`turnTowardPlayer`, and `turnAwayFromPlayer`. These objects need only `kind`.

| Native code                                                                       | Formal fields in addition to `kind`    | Accepted values                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| M14 `jump`                                                                        | `x`, `y`                               | Independent integers −99..99                                       |
| M15 `wait`                                                                        | `frames`                               | Integer 1..999                                                     |
| M27/28 `switchOn` / `switchOff`                                                   | `switch`                               | A switch reference by existing ID or unique declared name          |
| M29 `changeSpeed`                                                                 | `speed`                                | Integer 1..6                                                       |
| M30 `changeFrequency`                                                             | `frequency`                            | Integer 1..5                                                       |
| M31–40 `walkAnimation`, `stepAnimation`, `directionFix`, `through`, `transparent` | `enabled`                              | Required boolean, with distinct on/off codes                       |
| M41 `changeImage`                                                                 | `character`, `characterIndex`          | Characters image asset or null; independent integer index 0..7     |
| M42 `changeOpacity`                                                               | `opacity`                              | Integer 0..255                                                     |
| M43 `changeBlendMode`                                                             | `blendMode`                            | `"normal"`, `"additive"`, `"multiply"`, `"screen"`                 |
| M44 `playSe`                                                                      | `audio: { asset, volume, pitch, pan }` | SE asset or null; integers 0..100, 50..150, −100..100 respectively |
| M45 `script`                                                                      | `script: scriptInput({ code })`        | One complete string under the Script Command Gate                  |

Every listed core field is required. None image preserves its independent index,
including index 7; big-character filenames also retain the chosen index. None SE
preserves all explicitly supplied volume, pitch and pan values. For example:

```ts
const instructions = [
  { kind: "wait", frames: 30 },
  { kind: "changeImage", character: null, characterIndex: 7 },
  { kind: "changeBlendMode", blendMode: "screen" },
  { kind: "playSe", audio: { asset: null, volume: 17, pitch: 73, pan: -41 } },
] satisfies import("rpgmaker-event-dsl").MoveRouteCommand[];
```

Saved numeric values retain negative zero for jump x/y, characterIndex, opacity,
and SE volume/pan. The symbolic blend code, movement code and finite indent forms
reject native negative zero because their formal symbols cannot reconstruct it.

M45 keeps empty text, whitespace, CR/LF/CRLF and trailing characters in one native
slot, including more than twelve lines. LF warns about the editor's single-line
input; CR warns that parameter reconfirmation needs verification. Warnings retain
the exact text. Empty, inactive and unreachable M45 instructions still require
`scriptEnabled: true` during Check and Compile.

## Control Variables

Control Variables uses a named operand and an explicit operation:

```ts
controlVariables({
  variable: variableRef({ id: 1 }),
  operation: "add",
  value: { kind: "constant", value: 1 },
});
controlVariables({
  variable: { kind: "referenceRange", from: variableRef({ id: 1 }), to: variableRef({ id: 3 }) },
  operation: "set",
  value: { kind: "variable", variable: variableRef({ id: 2 }) },
});
```

Operations are `set`, `add`, `sub`, `mul`, `div`, `mod`. Operand modes are
constant, variable, random, gameData and script. Constants and random endpoints
are integers −99,999,999..99,999,999, retaining numeric negative zero. Ranges and
random endpoints must be ordered. Runtime variable, Game Data and Script values
use native MV evaluation, including flooring when storing numbers, without
literal bounds or clamping. Random samples for each target; every other operand
is evaluated once before the range loop, including self-aliasing variable sources.

Game Data sources use `{ kind: "gameData", source, ... }`:

| source                | Required inputs                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| item / weapon / armor | matching item / weapon / armor Project Data Reference                                                                                    |
| actor                 | actorRef and value level/exp/hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                                                                       |
| enemy                 | enemy Runtime Selector (`scope: "enemy", target: "enemy", index: 0..7`) and value hp/mp/mhp/mmp/atk/def/mat/mdf/agi/luk                  |
| character             | target Runtime Selector (`scope: "character"`, player/currentEvent/event with positive id) and value mapX/mapY/direction/screenX/screenY |
| party                 | member Runtime Selector (`scope: "party", target: "member", index: 0..7`)                                                                |
| other                 | value mapId/partyMembers/gold/steps/playTime/timer/saveCount/battleCount/winCount/escapeCount                                            |

Every Runtime Selector includes `kind: "runtimeSelector"`. Enemy and party
positions retain numeric negative zero. Fixed references must resolve; unknown
Common Event runtime context is allowed. Determinable unavailable runtime targets
warn and may return native 0. Missing Enemy entries are skipped when a Troop's
runtime members are constructed; saved positions can shift or become unavailable,
and warnings preserve those positions. A hidden member still supplies Game Data.
Inventory Game Data counts exclude equipped items;
actor/enemy status sources have no TP. Script mode uses
`{ kind: "script", script: scriptInput({ code }) }`: the complete single-slot
string is preserved, including empty text, whitespace, CR/LF/CRLF and trailing
characters, without a character or line limit. LF/CR warn about parameter
reconfirmation while retaining text. Native symbolic operation/source/status
codes, character symbolic targets and unused Game Data padding reject negative
zero before conversion; supported numeric values keep it.

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

## Conditional and child bodies

```ts
import { conditional, variableRef, wait } from "rpgmaker-event-dsl";

const branch = conditional({
  condition: {
    kind: "variable",
    variable: variableRef({ id: 1 }),
    operator: "ge",
    value: { kind: "constant", value: 2 },
  },
  then: { commands: [wait(1)] },
  else: { commands: [] },
});
```

Conditional supports all 14 MV modes and seven Actor checks. `then.commands` is
required. Omitted `else` and an explicit empty body retain different native shapes.
Each body defaults `endMarker` to `"present"`; `"absent"` preserves a nonempty
body with no saved marker. Empty bodies require a marker. Combined formal and raw
output cannot duplicate or contradict the owning marker; nested raw markers retain
their own ownership.

Variable comparisons use a constant mode as above or
`{ kind: "variable", variable: variableRef(...) }`, and the six operators are
`eq/ge/le/gt/lt/ne`. Enemy conditions require
`enemy: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index }`
with index 0..7. Character conditions require a `target` Runtime Selector in the
`character` scope: player, currentEvent, or event with a positive ID. Directions
are 2/4/6/8. Weapon and Armor conditions require `includeEquipment: boolean`.

Fixed references resolve in their own category. Missing runtime positions and
inapplicable contexts warn; Common Event caller context stays unknown. Enemy
appeared uses `isAlive()` and is false while hidden or dead. Ordinary numeric
constants, timer seconds, gold amounts and enemy indices preserve negative zero;
symbolic native encodings that cannot represent its sign are rejected.

Script conditions use `script: scriptInput({ code })`. The complete string is one
saved slot, including empty input, CR/LF, trailing whitespace and long content.
CR or LF produces a reconfirmation warning independently of the Script Command
Gate. Actor name comparisons preserve exact strings without that warning.

## Choices

```ts
import { showChoices, showText } from "rpgmaker-event-dsl";

const commands = [
  showChoices({
    choices: [
      { text: "Ask about the ruins", commands: [showText({ lines: ["Follow the river."] })] },
      { text: "Leave", commands: [] },
    ],
    defaultChoice: { kind: "none" },
    cancel: { kind: "branch", commands: [showText({ lines: ["Another time, then."] })] },
    position: "right",
    background: "window",
  }),
];
```

`choices` is a required dense list of 1–6 `{ text, commands, endMarker? }` objects.
Each `commands` field is required and may be empty. Choice text preserves empty
strings, whitespace, line endings, and a final empty choice.

`defaultChoice` is `{ kind: "none" }` or `{ kind: "choice", index }` and defaults
to choice 0. `cancel` is `{ kind: "disabled" }`, `{ kind: "choice", index }`, or
`{ kind: "branch", commands, endMarker? }` and defaults to choice 1. Indices are
zero-based integers 0–5; saved indices beyond the current choice count are retained
with a warning. Numeric `index: -0` retains its saved sign through Decompile and
Push. A one-item list still saves cancel choice 1. `position` accepts
`"left"`, `"center"`, or `"right"` (default); `background` accepts `"window"`
(default), `"dim"`, or `"transparent"`.

Each choice and separate cancel branch defaults `endMarker` to `"present"`.
Use `"absent"` to preserve a nonempty Child Command Body without its trailing
Body End Marker; an empty body requires the marker. The parent produces ordered
choice branches from the same text as the choice header, an optional separate
cancel branch, and its closing record. Nested body markers retain their own
ownership, and raw records cannot supply a conflicting marker for a formal body.
Every body receives ordinary reference validation and the Script Command Gate,
including bodies the saved default or cancel setting cannot reach.

## Loop and event processing

```ts
import { breakLoop, exitEventProcessing, loop, wait } from "rpgmaker-event-dsl";

const commands = [
  loop({ body: { commands: [wait({ frames: 1 }), breakLoop()] } }),
  exitEventProcessing(),
];
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

## Screen effects, waits and movies

Use `fadeoutScreen()` and `fadeinScreen()` without arguments. MV owns their fade
speed and interpreter wait. Use `wait({ frames: 60 })` for an explicit wait;
`frames` is a required integer from 1 to 999.

```ts
import {
  tintScreen,
  flashScreen,
  shakeScreen,
  setWeatherEffect,
  playMovie,
  movieAsset,
} from "rpgmaker-event-dsl";

const effects = [
  tintScreen({ tone: { red: -68, green: -34, blue: 0, gray: 0 }, duration: 60, wait: true }),
  flashScreen({ color: { red: 255, green: 255, blue: 255, alpha: 0 }, duration: 1, wait: false }),
  shakeScreen({ power: 5, speed: 7, duration: 30, wait: false }),
  setWeatherEffect({ weather: "none", power: 9, duration: 60, wait: true }),
  playMovie({ movie: movieAsset({ name: "Ending" }) }),
  playMovie({ movie: null }),
];
```

Tint requires all four named tone components: integer RGB values from −255 to
255 and gray from 0 to 255. Flash requires integer RGBA components from 0 to
255, including explicit alpha zero. Both preserve numeric negative zero in
their accepted component fields. Shake power and speed are integers from 1 to 9. Tint, Flash, Shake and Weather require integer `duration` from 1 to 999 and
an explicit Boolean `wait`; their values remain saved when the visible effect
is inactive.

Weather is `"none"`, `"rain"`, `"storm"` or `"snow"`. Its power is always an
integer from 1 to 9, including None. In battle MV skips both the weather effect
and its wait, which produces a contextual warning. A Common Event's runtime
context remains unknown until it is called.

Movie requires a movies Asset Reference or explicit `null`. None emits the
empty native filename and continues without a video wait. `movieAsset` takes
only a nonempty filename stem, such as `"Ending"`; asset files are not scanned,
and a valid reference does not guarantee a playable file or codec.

## Picture commands

Picture commands require complete display settings:

```ts
showPicture({
  pictureId: 1,
  image: null,
  origin: "center",
  position: { kind: "direct", x: -120, y: 90 },
  scaleX: -100,
  scaleY: 100,
  opacity: 255,
  blendMode: "normal",
});
tintPicture({
  pictureId: 1,
  tone: { red: -255, green: 0, blue: 255, gray: 0 },
  duration: 30,
  wait: false,
});
```

Picture IDs 1..100 select runtime slots, including unshown slots. Show's `image`
is a `pictures` Asset Reference or explicit `null`; None retains a complete Picture.
`erasePicture({ pictureId })` erases it. Asset files and dimensions are not scanned.
Show and Move require top-level `origin` (`upperLeft` or `center`), `position`,
`scaleX`, `scaleY`, `opacity` and named `blendMode` (`normal`, `additive`, `multiply`,
`screen`). Direct coordinates are integers −9999..9999; variables mode uses two
existing variable references. Scales are integers −2000..2000, including negative
flips; opacity is integer 0..255. Numeric saved zero retains its sign.
Move has no image field and requires duration 1..999 and explicit Boolean `wait`.
Rotate speed is integer −90..90, including zero to stop. Tint requires named RGB
integers −255..255, gray 0..255, duration 1..999 and explicit Boolean `wait`.

## Enemies and battle control

Enemy resource commands use named operands and explicit saved selectors:

```ts
changeEnemyHp({
  target: { kind: "runtimeSelector", scope: "enemy", target: "all" },
  operation: "lose",
  value: { kind: "constant", value: 10 },
  allowDeath: false,
});
showBattleAnimation({
  target: { kind: "runtimeSelector", scope: "enemy", target: "enemy", index: 7 },
  animation: animationRef({ id: 1 }),
  allEnemies: true,
});
battleProcessing({
  troop: { kind: "fixed", troop: troopRef({ id: 1 }) },
  canEscape: true,
  win: { commands: [comment(["Victory"])] },
  escape: { commands: [] },
});
forceAction({
  subject: {
    kind: "runtimeSelector",
    scope: "battler",
    target: "actor",
    actor: actorRef({ id: 1 }),
  },
  skill: skillRef({ id: 1 }),
  target: { kind: "lastTarget" },
});
abortBattle();
```

Enemy positions are integers 0..7 and include hidden members in their saved order.
HP/MP/TP/State/Recover All accept `target: "all"` as well. Appear, Transform and
Animation require a single index; Animation retains it independently of its required
`allEnemies` Boolean. HP/MP constants are 1..9999, TP constants 1..100. Resource
changes require `operation: "gain" | "lose"` and either `{ kind: "constant", value }`
or `{ kind: "variable", variable: variableRef(...) }`. HP requires `allowDeath`.
State uses `operation: "add" | "remove"` with a State reference; Transform and
Animation require existing Enemy and Animation references respectively.

Battle's troop modes are `fixed` with a Troop reference, `variable` with a Variable
reference, or `{ kind: "randomEncounter" }`. Escape/Lose flags default to false.
Both false forbids result bodies; either true requires `win`, and each true flag
requires its matching `escape`/`lose` body. Bodies require `commands` and default
their `endMarker` to `"present"`; only a nonempty saved body may select `"absent"`.

Force Action's subject is one enemy position or fixed Actor reference. Its target
is `lastTarget`, `random`, or `{ kind: "index", index }` with index 0..7. Skill scope
determines its execution meaning, so the index is preserved independently of current
Troop size. Abort Battle has no inputs. Missing fixed references are errors; legal
runtime positions, unknown Common callers and incompatible map/battle contexts
produce warnings. MV skips Battle Processing in battle and Force Action outside
battle; Abort Battle can set residual aborting state outside an active battle.

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
