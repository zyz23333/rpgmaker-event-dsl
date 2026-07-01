# Full Event Example Workspace

This directory is a copyable example workspace for the RPG Maker Event DSL
compile/push model.

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

Create a local live config from the template, then set `projectRoot` to your RPG Maker MV
project:

```bash
cp rpgmaker-event-dsl.config.template.json rpgmaker-event-dsl.config.json
```

On Windows PowerShell:

```powershell
Copy-Item rpgmaker-event-dsl.config.template.json rpgmaker-event-dsl.config.json
```

`rpgmaker-event-dsl.config.json` is intentionally local-only and should not be committed.
It contains machine-specific project paths.

This example intentionally sets `scriptEnabled` to `true` because `src/full-event.events.ts`
contains Script Inputs in a Script command, a Conditional Branch script condition, and a
Set Movement Route script subcommand. Keep `scriptEnabled` disabled in workspaces that
should reject JavaScript-bearing event commands during compilation.

The example also uses Asset References such as `audioAsset(...)`, `imageAsset(...)`, and
`movieAsset(...)`. These are opaque filename-stem references; they do not scan or validate
asset files on disk.

The example is a private pnpm package that installs `rpgmaker-event-dsl` from npm. Run
`pnpm install` in this directory after copying the example or changing package metadata.

## Workflow

From this directory, install dependencies:

```bash
pnpm install
```

Then run the DSL workflow through package scripts:

```bash
pnpm run clone
pnpm run check
pnpm run compile
pnpm run diff
```

`clone` captures a Standard Project Data Snapshot. `compile --check` validates without
writing Generated Project Data. `compile` writes Generated Project Data in the workspace,
and `diff` compares it with the snapshot.

Run `push` only when the configured Project Root is safe to modify:

```bash
pnpm run push
```

If `diff` reports reviewed snapshot-only DSL-owned entries that you intentionally want to
remove, use the explicit destructive option:

```bash
pnpm exec rpgmaker-event-dsl push --allow-destructive
```

Destructive Push still enforces Generated Freshness and Project Drift checks. If the RPG
Maker MV editor changes affected project data after the snapshot was captured, run `pull`
and then `compile` again before reviewing a new `diff`.
