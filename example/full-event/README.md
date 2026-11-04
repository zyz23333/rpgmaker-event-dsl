# Full Event Example Workspace

This directory is a repository Sample Workspace for the RPG Maker Event DSL
compile/push model.

`src/full-event.events.ts` intentionally demonstrates representative RPG Maker MV 1.6.1
command families rather than every helper. It includes message, flow control, switches,
variables, party, movement, screen, audio, map, battle, actor, enemy, plugin, script, and
explicit raw command examples.

Timer Start requires seconds in 0..5999. Stop without seconds preserves an absent
saved slot; the example also shows an explicit saved Stop value. Keep that value
when decompiling even though Stop does not consume it during game execution.

System access commands use an explicit `enabled` Boolean. Their native flag is
false→0/true→1, including `changeEncounter`, which also resets the encounter
count. The window color example supplies all four named Tone components,
including the independently saved gray field. Scene helpers take no inputs;
Open Menu and Open Save skip in battle and do not require ordinary access to be
enabled on a map. Game Over and Title can transition from either context.

It also defines a Troop Event for the existing troop ID 1. Its ordered pages run a
message at turn zero once per battle. `troopEvent` replaces only the complete page
list; the troop's name, members, positions and other carrier fields stay external.
Adjust the existing troop ID before using the example in your project.

## Setup

This sample uses the current checkout through a `workspace:*` dependency. Its source
uses APIs beyond the old npm 0.1.1 release. With Windows, Node.js 22 and pnpm 10.33.0,
run these commands from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm --filter rpgmaker-event-dsl build
pnpm install --frozen-lockfile
```

The second install refreshes executable links after the build creates the CLI.
Then enter `example/full-event` and configure a disposable MV project as described
below. This sample requires matching database entries and assets; it is not a
self-contained game fixture.

When copying the sample outside this monorepo, replace `workspace:*` with a built
local package path or a released version that supports its API. See the
[installation guide](../../docs/getting-started.md#use-the-current-checkout).

## Config

`rpgmaker-event-dsl.config.template.json` shows the required config shape. It uses
source discovery:

- `sourceRoot`: `src`
- `sourceInclude`: `["**/*.events.ts", "**/*.dsl.ts"]`
- `sourceExclude`: `["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]`
- `assetCheckExceptions`: `[]`; exact reasoned authoring exceptions belong to the compilation policy.

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
`movieAsset(...)`. Their helpers preserve the exact filename stem. Compile and Check
validate the current event's supported native file relationships under your Project Root.
For the direct media examples, supply ordinary `audio/bgm/Battle1.ogg`,
`audio/bgm/Theme6.ogg`, `audio/se/Cursor2.ogg` and `movies/Intro.webm` files with exact
names and case. M4A, MP4 and encrypted suffixes do not replace these editing files.
None needs no file; its independently saved numeric controls remain unchanged.

The Force Action example selects Snapshot Skill 1. A positive saved animation ID
requires that Animation's named PNG sheets and timing OGG effects. A negative ID
selects the runtime default-attack path and reports an unchecked relationship; the
checker does not infer Animation 1, weapons or System attack audio. Zero selects no
Animation assets. Common Events are independent asset roots; Skill effects do not
add asset caller relationships. See the [asset reference](../../docs/reference/assets.md)
for the complete retained scope.

## Workflow

After Setup and Config, run the DSL workflow from this directory through package scripts:

```bash
pnpm run clone
pnpm run check
pnpm run compile
pnpm run diff
```

`clone` captures a Standard Project Data Snapshot. `compile --check` validates without
writing Generated Project Data. `compile` writes Generated Project Data in the workspace,
and `diff` compares it with the snapshot.

The source represents complete owned domains. Existing troops omitted from source
receive one exact default Battle Event Page. A nonblank-to-Blank change is reported
as a destructive Troop Event Reset, including when a file filter hides its details.
To use selected examples in an existing game, first set up a separate Workspace and
Decompile its complete data, then copy the desired commands or declarations into it.
Choose unused IDs and retain its other imported entries. Decompiling directly into
this sample can collide with its predeclared IDs; see [Getting started](../../docs/getting-started.md).

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
Maker MV editor changes any captured standard project data after the snapshot was
captured, run `pull`, reconcile affected source declarations, and then `compile`
before reviewing a new `diff`. Pull does not merge changes into source.
