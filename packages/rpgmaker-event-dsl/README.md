# RPG Maker Event DSL

RPG Maker Event DSL lets you write supported RPG Maker MV game logic as TypeScript code
and compile it back into RPG Maker MV project data.

The package provides:

- A TypeScript DSL for supported switches, variables, common events, map events, pages,
  references, assets, and RPG Maker MV event commands.
- A CLI for snapshot-based workflows: `init`, `clone`, `pull`, `decompile`, `compile`,
  `diff`, and `push`.
- Read-only `map list`, `map inspect`, and `map render` commands for map discovery,
  targeted cell/event detail, and native-static PNG previews with provenance.
- Safety checks for generated freshness, project drift, and reviewed destructive changes.

The root package export is the Event DSL authoring surface. Programmatic Workspace
operations are available from `rpgmaker-event-dsl/workspace`; the CLI remains the primary
Workspace workflow interface.

This project is in early development. The TypeScript API, DSL syntax, CLI workflow,
generated output, and workspace format may change before `1.0.0`.

## Install

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

Before placing a Map Event, discover its map and inspect an overview and local detail:

```bash
rpgmaker-event-dsl map list --json
rpgmaker-event-dsl map render --map 1 --json
rpgmaker-event-dsl map render --map 1 --crop 2,1,3,3 --json
rpgmaker-event-dsl map inspect --map 1 --cell 3,2 --json
```

Use the selected numeric map ID and bounds that exist in that map. Observation defaults
to `snapshot`; crop coordinates remain original-map coordinates. Rendering returns
absolute PNG/metadata paths, with grid labels and event-ID markers enabled by default.
`--no-grid` hides grid/labels; `--no-events` hides markers while retaining event images.
The first page supplies each event's appearance; repeat options such as
`--event-page 1:2 --event-page 3:1` to choose one-based Preview Pages independently of
runtime activation.

After editing DSL source, validate, compile, review generated placement, and inspect Diff:

```bash
rpgmaker-event-dsl compile --check
rpgmaker-event-dsl compile
rpgmaker-event-dsl map inspect --map 1 --source generated --json
rpgmaker-event-dsl map render --map 1 --source generated --json
rpgmaker-event-dsl diff
```

Generated observation requires fresh, intact compiled output and represents image-free
compiler pages faithfully. Map-data provenance and live Project Root image paths/hashes
are reported separately. Missing required images fail normally; explicit
`--allow-missing-assets` renders diagnostic placeholders with a visible incomplete
notice, `complete: false`, and warnings. Structured inspection needs no images.

Previews target native RPG Maker MV static appearance at frame zero. Plugin visuals,
runtime page activation, final passability, and trigger behavior are outside this
observation. It does not implicitly Pull, Compile, or Push. Use `map <subcommand> --help`
for options. Programmatic observation functions `listWorkspaceMaps`,
`inspectWorkspaceMap`, and `renderWorkspaceMap` are available from
`rpgmaker-event-dsl/workspace`.

Run `rpgmaker-event-dsl push` only when the user explicitly requests writing the reviewed
result to Project Root. Confirm the destructive entries shown by Diff before allowing
`push --allow-destructive`.

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

## License

MIT
