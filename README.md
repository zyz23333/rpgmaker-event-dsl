# RPG Maker Event DSL

RPG Maker Event DSL lets you write RPG Maker MV game logic as TypeScript code.

Windows is the supported platform for the current stage. Node.js 22 is the runtime
and CI baseline.

Instead of creating every event through repeated clicks in the RPG Maker MV editor, you
can describe supported switches, variables, common events, and map events in source
files, including troop battle events. The tool turns those files into RPG Maker MV project data after you review what
will change.

This makes RPG Maker MV logic easier to search, copy, review, refactor, and reuse. It
also gives AI agents a code-based way to inspect and change game behavior, instead of
trying to operate the editor directly.

The RPG Maker MV editor still remains part of the workflow. You can keep using it for
visual map work and database edits, then bring those editor-side changes back into the
code workflow before continuing.

## What This Is

RPG Maker MV saves game data as JSON files under the project's `data/` directory. Those
files are generated for the editor, so they are difficult to read, review, and maintain by
hand.

This tool gives you a readable source format for supported RPG Maker MV logic. You write
TypeScript source files, the CLI generates RPG Maker MV-compatible output, and nothing is
written back to the real game project until you explicitly run `push`.

That makes common developer tasks easier:

- Copy, refactor, and review event logic as code.
- Search game behavior across source files.
- Use TypeScript types and validation before writing generated data.
- Let AI agents propose, inspect, and update RPG Maker MV logic through source files.
- Keep editor-authored changes in the loop by bringing them back with `pull`.

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
commands: [showText({ lines: ["Welcome."] })];
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

Troop Event ownership covers the complete `pages` array. Compilation always emits
`Troops.json`, retaining each actual troop's ID, name, members, positions, hidden flags
and other carrier data. An omitted Troop Event declaration produces one exact default
page, just like `troopEvent({ troopId, pages: [battlePage({ commands: [] })] })`.
Replacing a nonblank Troop Event with that state is a destructive **Troop Event Reset**
and requires `push --allow-destructive` after review. Deleting some pages while leaving
a nonblank event is an ordinary content edit. A troop itself is never removed by this
ownership model.

Battle pages accept `span: "battle" | "turn" | "moment"` (default `"battle"`).
Optional condition slots are `turnEnd`, `turn: { enabled, a, b }`,
`enemy: { enabled, index, hpAtMost }`, `actor: { enabled, ref, hpAtMost }` and
`switch: { enabled, ref }`. Provided slots are complete objects. Saved values remain
validated and preserved while a slot is disabled. Disabled explicit actor/switch IDs
may retain zero or a missing target; names still resolve normally. Enabled enemy
conditions use the raw member position and validate every member's Enemy reference,
including hidden and nonselected members. Pages stay nonempty and in authored order;
more than 20 pages warns and preserves all pages.

Switch and variable IDs can refer to unnamed System slots. Their final capacity is
the larger of the Snapshot capacity and the highest ID declared by
`switchDefinition(...)` or `variableDefinition(...)`. Removing a declaration clears
its name while retaining the Snapshot capacity. A numeric reference does not create
or extend a slot. Name references to switches and variables resolve only against
unique DSL declarations; Snapshot names do not provide a fallback. Other database
references can use an existing numeric ID even when that entry's name is empty.

Workspace reference validation uses the captured Snapshot, including Animations,
Tilesets and empty-name maps. `showAnimation`, `changeTileset` and `enemyTransform`
require an existing fixed target in both formal and recognized raw commands;
Decompile checks these targets before publishing source. Runtime enemy positions
and equipment candidates remain selectors rather than database references. The
Snapshot retains complete troop member order, including hidden members and missing
Enemy IDs, and the complete System equipment slot configuration for contextual
validation. Use `pull` to capture subsequent editor-side database changes.

`controlSwitches(...)` accepts one switch reference or an inclusive
`{ kind: "referenceRange", from: switchRef({ id: 1 }), to: switchRef({ id: 3 }) }`.
Both endpoints must exist in the final capacity; unnamed intermediate slots are
valid. Reversed ranges fail validation. Both switch commands require an explicit
Boolean `value`. `controlSelfSwitch({ selfSwitch: "A", value: true })` accepts A–D
and uses the executing Map Event's identity. A Common Event called from a Map Event
inherits that identity, so its self switch can affect the caller.

The DSL does not replace RPG Maker MV's event system. It is a readable source format for
producing normal RPG Maker MV project data, so the RPG Maker MV editor can continue to
work with the generated result.

## Writing Your First DSL File

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
  commands: [showText({ lines: ["Welcome."] })],
});
```

When compiled, `introCommonEvent` becomes a `CommonEvents.json` entry, and its
`showText(...)` command becomes RPG Maker MV's raw text command records.

DSL source files are discovered from the workspace config. By default, files under `src/`
are treated as DSL declaration files when they match names like `**/*.events.ts` or
`**/*.dsl.ts`.

## Agent Event Authoring Skill

This repository includes a distributable agent skill under
`skills/rpgmaker-event-authoring`. It helps agents take over RPG Maker MV event
authoring from Workspace setup through Event DSL source creation, validation, diff
review, and optional push.

```bash
npx skills add https://github.com/zyz23333/rpgmaker-event-dsl/skills --skill rpgmaker-event-authoring
```

## Safety Model In One Minute

The workflow uses three copies of project data:

1. Project Root

   The real RPG Maker MV project.

2. Project Data Snapshot

   A workspace copy of project data captured by `clone` or `pull`.

3. Generated Project Data

   Data produced by `compile` from your DSL source.

Most commands only write inside the workspace. `push` is the only command that writes to
the RPG Maker MV project.

Before every `push`, including a no-op, the CLI checks that Generated Project Data is
fresh and that all captured standard Project Root files still match the Snapshot bytes.

## Quick Start

Choose the path that matches how you are starting.

### Integrate The Package Into The Workspace

An Event DSL Workspace should also be a Node package so Definition Source files can import
`rpgmaker-event-dsl` and the CLI can run from the workspace.

Create package metadata if the workspace does not already have it, then install the tool:

```bash
npm init -y
npm pkg set type=module
npm install --save-dev rpgmaker-event-dsl
```

After that, run the CLI through your package manager, such as:

```bash
npx rpgmaker-event-dsl compile --check
```

The command examples below use `rpgmaker-event-dsl` directly. If the binary is not on
your `PATH`, use your package manager's exec form instead, such as
`npx rpgmaker-event-dsl` or `pnpm exec rpgmaker-event-dsl`.

### If You Already Have A Game Project

Use this path when you already have an RPG Maker MV project with maps, events, switches,
variables, or database entries that should become the starting point for DSL work.

Create a DSL workspace next to the game project:

```bash
rpgmaker-event-dsl init --project-root ../Game
```

Copy the current RPG Maker MV project data into the workspace. This is called `clone`
because it captures a workspace snapshot without changing the project:

```bash
rpgmaker-event-dsl clone
```

Generate starter TypeScript DSL files from that snapshot. This is called `decompile`
because it turns RPG Maker MV JSON data into editable source files:

```bash
rpgmaker-event-dsl decompile
```

`decompile` validates the complete generated batch at its final dependency location,
then publishes it once to `sourceRoot/decompiled/`. That entire destination must be
absent, including an empty directory, file or junction. Existing discovered source
is read only to identify declarations and reject identity conflicts; it cannot supply
missing candidate references. Every generated file must match your source discovery
rules. A failure leaves the original source and Snapshot intact. If the directory was
published before the process reported success, retry reports that it already exists.

Complete publication currently requires Windows PowerShell and an existing
`sourceRoot` on the same filesystem as the Workspace state. `init` creates the default
`src` directory; create a custom source root before running `decompile`. Unsupported
arrangements fail before publishing. Isolated crash remnants under
`.rpgmaker-event-dsl/decompile-candidates/` remain outside Discovery, including through
junction aliases and broad include patterns.

Supported RPG Maker MV
command shapes render as DSL helpers. A genuinely unknown event code is preserved as
one `rawDslCommand(...)` with a warning when its complete record and surrounding
structure are valid. Malformed known commands, unsupported known saved variants,
orphan continuations and conflicting mirrors fail before any source is published.

### If You Are Starting Fresh

Use this path when the RPG Maker MV project does not yet contain meaningful event logic,
or when you want the DSL source files to be the first place where supported logic is
written.

Create a DSL workspace next to the game project:

```bash
rpgmaker-event-dsl init --project-root ../Game
```

Capture the current project data as the baseline for future safety checks:

```bash
rpgmaker-event-dsl clone
```

Then create DSL source files under `src/`, such as `src/system.dsl.ts` or
`src/maps/Map001.events.ts`, and write declarations like the examples above.

After either path, use the daily workflow whenever you edit DSL source.

## Daily Workflow

After editing DSL source, use this loop:

1. Check whether the source is valid.
2. Generate RPG Maker MV data in the workspace.
3. Review what would change.
4. Write the reviewed result back to the game project.

Validate the source without writing generated data:

```bash
rpgmaker-event-dsl compile --check
```

Check constructs and serializes the same complete in-memory Compile Output as Compile,
including command structure, references and the Script Command Gate. It writes no
candidate files, changes no business state and does not make Generated Project Data
fresh. A successful Check still requires Compile before reviewing new output.

Generate RPG Maker MV data from the TypeScript source files:

```bash
rpgmaker-event-dsl compile
```

Validation failure publishes nothing. A filesystem error or process interruption
during publication can leave local generated data unusable; run Compile again to
restore it. Diff and Push verify freshness, actual file bytes and the complete owned
output file set independently of the manifest's list. The current set contains
`CommonEvents.json`, `System.json` and every map registered in the Snapshot's
`MapInfos.json`. Compile preserves the Snapshot and Project Root.

Review what would change:

```bash
rpgmaker-event-dsl diff
```

Useful diff variants:

```bash
rpgmaker-event-dsl diff --short
rpgmaker-event-dsl diff --file Map001.json
```

Push reviewed changes back to the RPG Maker MV project:

```bash
rpgmaker-event-dsl push
```

## When The RPG Maker Editor Changes Data

If you change maps, events, switches, variables, or database entries in the RPG Maker MV
editor, refresh the workspace snapshot before pushing DSL changes:

```bash
rpgmaker-event-dsl pull
rpgmaker-event-dsl compile
rpgmaker-event-dsl diff
```

`pull` updates the Project Data Snapshot from the Project Root. If the snapshot changes,
previous Generated Project Data becomes stale, so run `compile` again before `diff` or
`push`.

## Workspace Config

Clone, Pull, Decompile, Compile, Check, Diff and Push acquire one shared lock per
Workspace before reading configuration or data. The Workspace API's freshness query
uses the same lock. Concurrent calls report `Workspace is busy` immediately; retry
after the active operation finishes. Separate Workspaces can run independently.

The persistent `.rpgmaker-event-dsl/operation.lock` file is tool-maintained state.
Windows releases its exclusive handle when the owner exits, including a crash; file
existence alone does not mean the Workspace is busy. Keep this file in place. Lock
release never clears a pending Interrupted Push, which only Push can resolve.

The workspace config tells the CLI where the RPG Maker MV project is and which
TypeScript files should be treated as DSL declaration files.

Workspace config uses source discovery instead of per-file target bindings:

```json
{
  "projectRoot": "../Game",
  "scriptEnabled": false,
  "sourceRoot": "src",
  "sourceInclude": ["**/*.events.ts", "**/*.dsl.ts"],
  "sourceExclude": ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]
}
```

Files under `sourceRoot` are evaluated as DSL declaration files when they match
`sourceInclude` and do not match `sourceExclude`. The default patterns include event
declarations such as `src/maps/Map001.events.ts` and system declarations such as
`src/system.dsl.ts`. Ordinary helper modules should use names outside those include
patterns unless they are intended to export DSL-owned declarations.
Directory exclusions also apply to their descendants. Empty `sourceInclude` selects
all ordinary files. Discovery always excludes the reserved Decompile isolation
directory by physical location and deduplicates physical file aliases. The source
package must use `"type": "module"` for the generated TypeScript imports and exports.

Keep `scriptEnabled` set to `false` for workspaces that should reject JavaScript-bearing
event commands. Set it to `true` only when Script Inputs are intentional and reviewed.

## Event Command Coverage

The public command helpers target the RPG Maker MV 1.6.1 editor event command surface.
Use MV-aligned helper names such as `controlSwitches(...)`, `controlVariables(...)`,
`showScrollingText(...)`, `setMovementRoute(...)`, `playBgm(...)`, `changeHp(...)`, and
`forceAction(...)` instead of hand-writing raw command records.

Continuation commands are represented by their parent helper. For example, `showText(...)`
owns MV text continuation records, `showChoices(...)` owns choice branches,
`battleProcessing(...)` owns battle result branches, `shopProcessing(...)` owns goods
continuations, and `setMovementRoute(...)` owns nested move route commands.

`setMovementRoute({ target, route: { commands, repeat?, skippable?, wait?, terminator? } })`
uses the shared `MovementRoute` model. `commands` is required and may be empty;
the route defaults are `repeat: true`, `skippable: false`, and `wait: false`.
Each movement instruction may carry `savedShape: { indent: "absent" | "null" | "zero" }`,
defaulting to absent. Parameterless instructions omit the native `parameters` key;
parameterized instructions retain their complete array. The route owns its sole final
M0 through `terminator: { parameters: "absent" | "empty" }`, defaulting to empty;
M0 always omits indent. Decompile makes null, numeric zero and an absent M0 parameter
key explicit. E205 owns one E505 for each nonterminal instruction and compares the
complete mirrored object, including nested values and key presence. Unknown movement
codes and unsupported route shapes fail before source publication. Recognized raw
routes receive the same mirror, switch-reference and Script Command Gate checks.

Map Event Pages accept `movement: { type?, speed?, frequency?, route? }`.
`type` is `"fixed"`, `"random"`, `"approach"` or `"custom"` (default `"fixed"`);
`speed` is an integer from 1 to 6 and `frequency` from 1 to 5 (both default 3).
`route` uses the same `MovementRoute` model and defaults to an empty route.
The saved route is preserved and checked even when the Page selects fixed, random
or approach movement. Its `wait` flag remains saved data; interpreter waiting applies
when a route is used by Set Movement Route.

Project data references use helpers such as `switchRef(...)`, `variableRef(...)`,
`actorRef(...)`, `skillRef(...)`, and `tilesetRef(...)`. Asset parameters use no-scan
Asset References instead: `audioAsset(...)`, `imageAsset(...)`, and `movieAsset(...)`
compile to MV filename stems without checking the filesystem or resolving database IDs.

JavaScript-bearing inputs are explicit Script Inputs and are gated by the workspace
`scriptEnabled` setting. The Gate scans every saved script position, including empty
or unreachable Script/continuation records, script conditions, Control Variables
script operands, Set Movement Route records and mirrors, and saved Page routes in
every movement mode. Recognized raw commands receive the same checks. With the Gate
closed, Decompile produces source with warnings; Check and Compile reject the current
declarations until those scripts are removed or the Gate is enabled. `pluginCommand(...)`
carries MV's native plugin command string; plugin-specific argument semantics remain
outside validation.

`rawDslCommand({ code, indent?, parameters })` carries one event record. An explicit
`indent: 0` is absolute and remains explicit after Decompile. Parameters must be dense,
finite JSON data: strings retain CR/CRLF, and values such as null, empty arrays, own
`__proto__` keys and negative zero are preserved. Missing required fields, undefined,
array holes, non-finite numbers, accessors, custom prototypes and extra envelope fields
are rejected. Known raw codes still receive supported parameter, reference, structure
and Script Command Gate checks. Every complete event list requires its final terminator;
the owning helper supplies continuations, branch markers and route mirrors.

## Entry Identity

DSL-owned entries use explicit RPG Maker MV IDs. Display names are for humans and
name-based references; they are not identity. Duplicate display names are allowed, but
name-based references must resolve to exactly one visible entry.

Map Event identity is `mapId` plus event `id`. Common Events, Switch Definitions, and
Variable Definitions use their explicit `id` in their data domain.

```ts
import {
  callCommonEvent,
  commonEvent,
  commonEventRef,
  mapEvent,
  page,
  showText,
  switchDefinition,
  switchRef,
  variableDefinition,
} from "rpgmaker-event-dsl";

export const hasKey = switchDefinition({
  id: 1,
  name: "Has Key",
});

export const doorState = variableDefinition({
  id: 2,
  name: "Door State",
});

export const introCommonEvent = commonEvent({
  id: 1,
  name: "Intro",
  trigger: "none",
  commands: [showText({ lines: ["Welcome."] })],
});

export const doorEvent = mapEvent({
  mapId: 1,
  id: 3,
  name: "Door",
  x: 10,
  y: 8,
  pages: [
    page({
      conditions: {
        switch1: { enabled: true, ref: switchRef({ id: 1 }) },
      },
      commands: [
        showText({ lines: ["The door is open."] }),
        callCommonEvent(commonEventRef({ id: 1 })),
      ],
    }),
  ],
});
```

## Command Reference

Map Events retain exact `note` text and complete ordered pages. A page accepts
`conditions`, `image`, `movement`, `priority`, `options`, `trigger`, and required
`commands`. Omitted fields use fixed native blank-page defaults; selecting an image
keeps priority `below` unless explicitly changed. Disabled conditions and noncustom
saved routes retain their settings. See the package's [complete Map Event page
reference](packages/rpgmaker-event-dsl/README.md#map-event-pages) for fields, ranges,
defaults, reference exceptions, and tile context validation.

| Command           | Writes to Project Root? | Purpose                                                                                                  |
| ----------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `clone`           | No                      | Captures the initial Standard Project Data Snapshot from the configured RPG Maker MV project.            |
| `decompile`       | No                      | Generates non-destructive DSL source from the Project Data Snapshot without overwriting existing output. |
| `compile --check` | No                      | Validates discovered DSL source without writing Generated Project Data or freshness metadata.            |
| `compile`         | No                      | Validates discovered DSL source and writes Generated Project Data in the workspace.                      |
| `diff`            | No                      | Compares Generated Project Data with the Project Data Snapshot.                                          |
| `pull`            | No                      | Refreshes the Project Data Snapshot from the Project Root after editor-side changes.                     |
| `push`            | Yes                     | Writes reviewed Generated Project Data back to the RPG Maker MV project after safety checks pass.        |

`diff` emits a Structured Diff Report and lists the Affected Project Data Files that a
later `push` would write if Project Drift checks pass. Use `diff --short` for a summary
without entry details, or `diff --file <relativePath>` to filter the structured view by
one Project Data File, including canonical high map names such as `Map1001.json`.
Diff compares parsed JSON values: object key order, formatting and equivalent escapes
do not create changes. Key presence, array length/order, exact strings and negative
zero remain significant.

## Detailed Safety Model

### What Gets Snapshotted

The Standard Project Data Snapshot captures standard RPG Maker MV database files plus
every `Map###.json` referenced by `MapInfos.json`. Non-standard custom `data/*.json`
files are ignored by snapshot, freshness, drift, and push checks in the first workflow
version.

Clone and Pull copy the exact captured UTF-8 file bytes and hash those same bytes.
MapInfos determines the complete map collection; invalid or duplicate map identities,
missing registered files, malformed carriers and undecodable UTF-8 fail explicitly.
If the project files or Workspace Config change during capture, the operation fails
before publication and asks you to rerun. A manifest installation failure during
Snapshot publication restores the previous Snapshot and synchronization metadata.

Snapshot and Compile Baseline retain the canonical Project Root path. After changing
`projectRoot` in Workspace Config, run an explicit `pull` to establish the new target,
then compile again. Clone, Check, Decompile, Diff and Push reject an old target binding.
Directory junction aliases to the same Project Root keep the same binding. If an
Interrupted Push is pending, restore the original configured target and run Push there
first. Unknown, incomplete or inconsistent recovery evidence stops without being
deleted or migrated.

### Generated Freshness

Generated Freshness is checked before `diff` and `push`. Generated Project Data becomes
stale when discovered source files, relevant workspace config fields, or the Project Data
Snapshot baseline differ from the baseline used by the last `compile`.

### Project Drift

Every `push`, including a no-op, checks the original bytes of all 14 standard database
files and every map registered by the captured Snapshot's `MapInfos.json`. Missing or
replaced files and byte changes such as whitespace or equivalent JSON escapes count
as Project Drift. Non-standard plugin files and unregistered maps remain outside this
check. Run `pull`, review and compile again after external standard data changes.

Push backs up and writes only semantic Affected Project Data Files. It rechecks the
complete original set immediately before replacements, verifies each captured old
file, then checks the complete final set before refreshing Snapshot and manifest.
Written files must match generated bytes; every other captured file must still match
its original Snapshot bytes. A detected prewrite change prevents replacements.
Failure after writes begin preserves an Interrupted Push and the observed live state.

Installation and restoration use an atomic non-overwriting filesystem operation.
Unsupported installation fails safely. A concurrently arriving file, directory or
junction is preserved. If a captured original cannot be restored, the diagnostic gives
its retained path under `push-staging.tmp-*/original`; those bytes may contain an
external edit absent from the Snapshot backup. These checkpoints do not isolate the
project from later editor saves or provide a project-wide rollback.

### Interrupted Push

Push alone resolves an Interrupted Push using the original target binding and frozen
compilation evidence. If every Affected live file has the generated bytes, it finishes
recording those writes. Snapshot files may still have original bytes, completed bytes,
or a mixture from an interrupted finalization; each must match that operation's known
content. A fully committed manifest is also recognized on retry. If every Affected
live file has the original Snapshot bytes, Push abandons the pending operation and
continues its ordinary checks. Mixed, missing or unknown live content and inconsistent
recovery evidence require explicit restoration and preserve pending state.

Recovery verifies the original backups and complete generated output before consuming
their bytes. Snapshot files and the manifest are published through temporary files;
repeated interruption leaves enough evidence to resume. The complete pending directory
is retired by one rename only after synchronization is recorded or abandonment is
proved. A later cleanup failure can leave a retired evidence directory, which carries
no pending authority. It does not invalidate the completed synchronization.

Finishing an older compilation preserves its original source, dependency, configuration
and contract basis, including absent metadata. It never marks old output current.
Ordinary Generated Freshness and complete Project Drift checks still run before a new
write, even after recovery has successfully recorded completed writes.

### Destructive Changes

Normal `push` rejects Destructive Changes, such as snapshot-only entries in DSL-owned
domains. After reviewing `diff`, use the explicit destructive option only when those
removals are intended:

```bash
rpgmaker-event-dsl push --allow-destructive
```

Destructive Push does not bypass Generated Freshness, Generated Project Data integrity,
or Project Drift checks.

## Example Project

See `example/full-event` for a sample workspace using source discovery and explicit Entry
Identity.

## License

This repository's original source code and the published `rpgmaker-event-dsl` package are
licensed under the MIT License. See `LICENSE` and `packages/rpgmaker-event-dsl/LICENSE`.
