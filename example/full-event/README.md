# Full Event Example Workspace

This directory is a repository fixture that mirrors a Workspace layout for the
workspace compile/push model.

`src/full-event.events.ts` intentionally demonstrates representative RPG Maker MV 1.6.1
command families rather than every helper. It includes message, flow control, switches,
variables, party, movement, screen, audio, map, battle, actor, enemy, plugin, script, and
raw fallback examples.

## Config

`rpgmaker-event-dsl.config.template.json` shows the required config shape. It uses
source discovery:

- `sourceRoot`: `src`
- `sourceInclude`: `["**/*.events.ts", "**/*.dsl.ts"]`
- `sourceExclude`: `["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]`

The live `rpgmaker-event-dsl.config.json` points at `../../references/rmmv-test-project` in
this repository layout. If your local RPG Maker MV test project lives somewhere else,
update only `projectRoot`.

This example intentionally sets `scriptEnabled` to `true` because `src/full-event.events.ts`
contains Script Inputs in a Script command, a Conditional Branch script condition, and a
Set Movement Route script subcommand. Keep `scriptEnabled` disabled in workspaces that
should reject JavaScript-bearing event commands during compilation.

The example also uses Asset References such as `audioAsset(...)`, `imageAsset(...)`, and
`movieAsset(...)`. These are opaque filename-stem references; they do not scan or validate
asset files on disk.

The example is a private pnpm workspace package so TypeScript can resolve
`rpgmaker-event-dsl` from the declaration source. Run `pnpm install` at the repository
root after changing workspace package metadata.

## Workflow

From this directory, the built CLI can be run with Node:

```bash
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs clone
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs compile --check
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs compile
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs diff
```

`clone` captures a Standard Project Data Snapshot. `compile --check` validates without
writing Generated Project Data. `compile` writes Generated Project Data in the workspace,
and `diff` compares it with the snapshot.

Run `push` only when the configured Project Root is safe to modify:

```bash
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs push
```

If `diff` reports reviewed snapshot-only DSL-owned entries that you intentionally want to
remove, use the explicit destructive option:

```bash
node ../../packages/rpgmaker-event-dsl/dist/cli.mjs push --allow-destructive
```

Destructive Push still enforces Generated Freshness and Project Drift checks. If the RPG
Maker MV editor changes affected project data after the snapshot was captured, run `pull`
and then `compile` again before reviewing a new `diff`.
