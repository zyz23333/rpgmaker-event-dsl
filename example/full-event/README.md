# Full Event Example Workspace

This directory is a repository fixture that mirrors a Workspace layout for the
workspace compile/push model.

## Config

`rmmv-event-dsl.config.template.json` shows the required config shape. It uses
source discovery:

- `sourceRoot`: `src`
- `sourceInclude`: `["**/*.events.ts", "**/*.dsl.ts"]`
- `sourceExclude`: `["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]`

The live `rmmv-event-dsl.config.json` points at `../../references/rmmv-test-project` in
this repository layout. If your local RPG Maker MV test project lives somewhere else,
update only `projectRoot`.

This example intentionally sets `scriptEnabled` to `true` because `src/full-event.events.ts`
contains a Script command. Keep `scriptEnabled` disabled in workspaces that should reject
Script commands during compilation.

The example is a private pnpm workspace package so TypeScript can resolve
`@rmmv-event-dsl/core` from the declaration source. Run `pnpm install` at the repository
root after changing workspace package metadata.

## Workflow

From this directory, the built CLI can be run with Node:

```bash
node ../../packages/rmmv-event-dsl/dist/cli.mjs clone
node ../../packages/rmmv-event-dsl/dist/cli.mjs compile --check
node ../../packages/rmmv-event-dsl/dist/cli.mjs compile
node ../../packages/rmmv-event-dsl/dist/cli.mjs diff
```

`clone` captures a Standard Project Data Snapshot. `compile --check` validates without
writing Generated Project Data. `compile` writes Generated Project Data in the workspace,
and `diff` compares it with the snapshot.

Run `push` only when the configured Project Root is safe to modify:

```bash
node ../../packages/rmmv-event-dsl/dist/cli.mjs push
```

If `diff` reports reviewed snapshot-only DSL-owned entries that you intentionally want to
remove, use the explicit destructive option:

```bash
node ../../packages/rmmv-event-dsl/dist/cli.mjs push --allow-destructive
```

Destructive Push still enforces Generated Freshness and Project Drift checks. If the RPG
Maker MV editor changes affected project data after the snapshot was captured, run `pull`
and then `compile` again before reviewing a new `diff`.
