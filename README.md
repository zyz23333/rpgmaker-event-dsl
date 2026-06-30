# RPG Maker Event DSL

Schema-first TypeScript tooling for RPG Maker MV event data. The current workflow is a
workspace compile/push model: DSL source is compiled into local Generated Project Data
first, then reviewed and pushed to the RPG Maker MV project only after synchronization
checks pass.

## Workflow

Initialize a workspace next to an RPG Maker MV project:

```bash
rpgmaker-event-dsl init --project-root ../Game
```

Then use the workspace commands in this order:

```bash
rpgmaker-event-dsl clone
rpgmaker-event-dsl decompile
rpgmaker-event-dsl compile --check
rpgmaker-event-dsl compile
rpgmaker-event-dsl diff
rpgmaker-event-dsl push
```

- `clone` captures the initial Standard Project Data Snapshot from the configured
  RPG Maker MV project. It does not write DSL source or Project Root files.
- `decompile` generates non-destructive DSL source from the Project Data Snapshot.
  Existing decompile output is not overwritten.
- `compile --check` validates discovered DSL source without writing Generated Project Data
  or freshness metadata.
- `compile` validates discovered DSL source and writes Generated Project Data in the
  workspace. It does not write Project Root files or mutate the Project Data Snapshot.
- `diff` compares Generated Project Data with the Project Data Snapshot.
- `push` is the only command that writes Project Root data. It requires fresh Generated
  Project Data and no Project Drift.
- `pull` refreshes the Project Data Snapshot from the Project Root after editor-side
  changes. Pulling a changed snapshot makes old Generated Project Data stale, so run
  `compile` again before `diff` or `push`.

## Workspace Config

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

## Snapshot And Safety Model

The Standard Project Data Snapshot captures standard RPG Maker MV database files plus
every `Map###.json` referenced by `MapInfos.json`. Non-standard custom `data/*.json`
files are ignored by snapshot, freshness, drift, and push checks in the first workflow
version.

Generated Freshness is checked before `diff` and `push`. Generated Project Data becomes
stale when discovered source files, relevant workspace config fields, or the Project Data
Snapshot baseline differ from the baseline used by the last `compile`.

Project Drift is checked before `push` for affected Project Data files. If the RPG Maker
MV editor changed an affected Project Root file after the current snapshot was captured,
`push` fails and instructs you to run `pull` first.

Normal `push` rejects Destructive Changes, such as snapshot-only entries in DSL-owned
domains. After reviewing `diff`, use the explicit destructive option only when those
removals are intended:

```bash
rpgmaker-event-dsl push --allow-destructive
```

Destructive Push does not bypass Generated Freshness, Generated Project Data integrity,
or Project Drift checks.

## Example

See `example/full-event` for a sample workspace using source discovery and explicit Entry
Identity.
