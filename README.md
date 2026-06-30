# RPG Maker Event DSL

RPG Maker Event DSL lets you write RPG Maker MV game logic as TypeScript code.

Instead of creating every event through repeated clicks in the RPG Maker MV editor, you
can describe supported switches, variables, common events, and map events in source
files. The tool turns those files into RPG Maker MV project data after you review what
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
commands: [showText(["Welcome."])]
```

That single DSL command compiles into the raw command list above. `code: 101` starts the
text message, `code: 401` stores the text line, and `code: 0` terminates the command
list.

The same mapping applies to larger RPG Maker MV structures:

- `commonEvent(...)` becomes an entry in `CommonEvents.json`.
- `mapEvent(...)` becomes an event inside a `Map###.json` file.
- `page(...)` becomes an RPG Maker MV event page.
- `switchDefinition(...)` and `variableDefinition(...)` describe named project IDs.
- References such as `switchRef({ id: 1 })` compile back to the numeric IDs that RPG
  Maker MV expects.

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
  commands: [showText(["Welcome."])],
});
```

When compiled, `introCommonEvent` becomes a `CommonEvents.json` entry, and its
`showText(...)` command becomes RPG Maker MV's raw text command records.

DSL source files are discovered from the workspace config. By default, files under `src/`
are treated as DSL declaration files when they match names like `**/*.events.ts` or
`**/*.dsl.ts`.

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

Before `push`, the CLI checks that Generated Project Data is fresh and that affected
Project Root files have not changed since the current snapshot.

## Quick Start

Choose the path that matches how you are starting.

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

`decompile` is non-destructive. It does not overwrite existing decompile output. It also
decompiles on a best-effort basis: when an RPG Maker MV command cannot yet be expressed
as a dedicated DSL helper, it is preserved as a raw command in the DSL output.

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

Generate RPG Maker MV data from the TypeScript source files:

```bash
rpgmaker-event-dsl compile
```

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
  commands: [showText(["Welcome."])],
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
        switch1: switchRef({ id: 1 }),
      },
      commands: [
        showText(["The door is open."]),
        callCommonEvent(commonEventRef({ id: 1 })),
      ],
    }),
  ],
});
```

## Command Reference

| Command | Writes to Project Root? | Purpose |
| --- | --- | --- |
| `clone` | No | Captures the initial Standard Project Data Snapshot from the configured RPG Maker MV project. |
| `decompile` | No | Generates non-destructive DSL source from the Project Data Snapshot without overwriting existing output. |
| `compile --check` | No | Validates discovered DSL source without writing Generated Project Data or freshness metadata. |
| `compile` | No | Validates discovered DSL source and writes Generated Project Data in the workspace. |
| `diff` | No | Compares Generated Project Data with the Project Data Snapshot. |
| `pull` | No | Refreshes the Project Data Snapshot from the Project Root after editor-side changes. |
| `push` | Yes | Writes reviewed Generated Project Data back to the RPG Maker MV project after safety checks pass. |

`diff` emits a Structured Diff Report and lists the Affected Project Data Files that a
later `push` would write if Project Drift checks pass. Use `diff --short` for a summary
without entry details, or `diff --file <relativePath>` to filter the structured view by
one Project Data File.

## Detailed Safety Model

### What Gets Snapshotted

The Standard Project Data Snapshot captures standard RPG Maker MV database files plus
every `Map###.json` referenced by `MapInfos.json`. Non-standard custom `data/*.json`
files are ignored by snapshot, freshness, drift, and push checks in the first workflow
version.

### Generated Freshness

Generated Freshness is checked before `diff` and `push`. Generated Project Data becomes
stale when discovered source files, relevant workspace config fields, or the Project Data
Snapshot baseline differ from the baseline used by the last `compile`.

### Project Drift

Project Drift is checked before `push` for affected Project Data files. If the RPG Maker
MV editor changed an affected Project Root file after the current snapshot was captured,
`push` fails and instructs you to run `pull` first.

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
