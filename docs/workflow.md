# Workspace workflow and recovery

[Documentation](README.md)

Use [Getting started](getting-started.md) for initial setup and the [CLI reference](reference/cli.md) for syntax and configuration. This guide explains data ownership, synchronization and failure handling. Run the examples from the Workspace using its installed CLI.

- [Three data states](#three-data-states)
- [Daily Workflow](#daily-workflow)
- [When The RPG Maker Editor Changes Data](#when-the-rpg-maker-editor-changes-data)
- [Decompile publication](#decompile-publication)
- [What Gets Snapshotted](#what-gets-snapshotted)
- [Generated Freshness](#generated-freshness)
- [Project Drift](#project-drift)
- [Interrupted Push](#interrupted-push)
- [Destructive Changes](#destructive-changes)
- [Asset checks during Push and recovery](#asset-checks-during-push-and-recovery)
- [Recovery of older output](#recovery-of-older-output)
- [Concurrent operations](#concurrent-operations)

## Three data states

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

## Daily Workflow

After editing DSL source, use this loop:

1. Check whether the source is valid.
2. Generate RPG Maker MV data in the workspace.
3. Review what would change.
4. Write the reviewed result back to the game project.

Validate the source without writing generated data:

```powershell
npx rpgmaker-event-dsl compile --check
```

Check constructs and serializes the same complete in-memory Compile Output as Compile,
including command structure, references and the Script Command Gate. It writes no
candidate files, changes no business state and does not make Generated Project Data
fresh. A successful Check still requires Compile before reviewing new output.

Generate RPG Maker MV data from the TypeScript source files:

```powershell
npx rpgmaker-event-dsl compile
```

Validation failure publishes nothing. A filesystem error or process interruption
during publication can leave local generated data unusable; run Compile again to
restore it. Diff and Push verify freshness, actual file bytes and the complete owned
output file set independently of the manifest's list. The current set contains
`CommonEvents.json`, `System.json`, `Troops.json` and every map registered in the
Snapshot's `MapInfos.json`. Compile preserves the Snapshot and Project Root.

Review what would change:

```powershell
npx rpgmaker-event-dsl diff
```

Useful diff variants:

```powershell
npx rpgmaker-event-dsl diff --short
npx rpgmaker-event-dsl diff --file Map001.json
```

Push reviewed changes back to the RPG Maker MV project:

```powershell
npx rpgmaker-event-dsl push
```

## When The RPG Maker Editor Changes Data

If you change maps, events, switches, variables, or database entries in the RPG Maker MV
editor, refresh the workspace snapshot before pushing DSL changes:

```powershell
npx rpgmaker-event-dsl pull
npx rpgmaker-event-dsl compile
npx rpgmaker-event-dsl diff
```

`pull` updates the Project Data Snapshot from the Project Root. If the snapshot changes,
previous Generated Project Data becomes stale, so run `compile` again before `diff` or
`push`.

Pull does not merge editor changes into Definition Source. Review changes to DSL-owned entries and update your declarations before compiling; otherwise the next output still describes the old source. For a fresh import without existing identity conflicts, decompile in a separate Workspace and reconcile the resulting source.

## Decompile publication

Decompile checks the complete candidate at its final source location, then publishes
`sourceRoot/decompiled/` in one non-overwriting directory move. The entire destination
must be absent, including an empty directory or junction. All generated files must
match source discovery, and their identities must not conflict with existing source.
Existing source provides identities only; it cannot repair candidate references.

Existing sources may import shared constants and use the supported command functions.
Identity analysis follows only the values needed to identify declarations, including
shared object fields and spreads, using the same local module containment rules as
Compile. It captures those dependency bytes and resolution observations and rejects
changes before publication. Unrelated command payloads, function bodies and type
errors are not fully validated, and a closed Script Command Gate remains compatible
with Decompile. An indeterminate identity or a collision still prevents the complete
candidate from being published. Common Event references and commands are helper
values rather than declarations; declaration-shaped objects carry `commands` or
`trigger` in addition to their `kind` and explicit ID.

Use `"type": "module"` in the source package. Complete publication requires Windows
PowerShell, an existing source root, and source/state paths on the same filesystem.
`init` creates the default `src`; pre-create a custom source root. Unsupported paths
fail before publishing. Isolated interrupted candidates remain permanently outside
Discovery. A retry after a completed move reports that the destination already exists.

arrangements fail before publishing. Isolated crash remnants under
`.rpgmaker-event-dsl/decompile-candidates/` remain outside Discovery, including through
junction aliases and broad include patterns.

Supported RPG Maker MV
command shapes render as DSL helpers. A genuinely unknown event code is preserved as
one `rawDslCommand(...)` with a warning when its complete record and surrounding
structure are valid. Malformed known commands, unsupported known saved variants,
orphan continuations and conflicting mirrors fail before any source is published.

## What Gets Snapshotted

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

## Generated Freshness

Compile captures discovered and imported shared source bytes and the TypeScript host's actual validation
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

## Project Drift

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

## Interrupted Push

Push alone resolves an Interrupted Push using the original target binding and frozen
compilation evidence. If every Affected live file has the generated bytes, it finishes
recording those writes. Snapshot files may still have original bytes, completed bytes,
or a mixture from an interrupted finalization; each must match that operation's known
content. A fully committed manifest is also recognized on retry. If every Affected
live file has the original Snapshot bytes, Push abandons the pending operation and
continues its ordinary checks. Mixed, missing or unknown live content and inconsistent
recovery evidence require explicit restoration and preserve pending state.

Recovery verifies the original backups, complete generated output and actual consumed
bytes. Snapshot files and the manifest are published through temporary files;
repeated interruption leaves enough evidence to resume. The complete pending directory
is retired by one rename only after synchronization is recorded or abandonment is
proved. A later cleanup failure can leave a retired evidence directory, which carries
no pending authority. It does not invalidate the completed synchronization.

Finishing an older compilation preserves its original source, dependency, configuration
and contract basis, including absent metadata. It never marks old output current.
Ordinary Generated Freshness and complete Project Drift checks still run before a new
write, even after recovery has successfully recorded completed writes.

## Destructive Changes

Normal `push` rejects Destructive Changes, such as snapshot-only entries in DSL-owned
domains. After reviewing `diff`, use the explicit destructive option only when those
removals are intended:

```powershell
npx rpgmaker-event-dsl push --allow-destructive
```

Destructive Push does not bypass Generated Freshness, Generated Project Data integrity,
or Project Drift checks.

Destructive Changes also include a nonblank-to-Blank Troop Event Reset. Omitting a Troop Event and explicitly declaring its one native default page both request that state. See [Troop Events](reference/events.md#troop-events-and-battle-event-pages).

## Asset checks during Push and recovery

Push rebuilds asset uses from verified Generated Project Data and its complete
captured Snapshot, with every current Common Event as an independent root.
It does not reevaluate Definition Source or rely on an earlier asset report. One
current-file check runs after staging and before pending state or the first
replacement. A data-identical Push also checks current assets. An asset error at
this gate leaves no new pending state or replacement; repairing media permits a
retry while the existing Compile Baseline remains current. Source, validation
dependencies, configuration, exceptions, Snapshot, generated bytes and target
binding must still match before the first replacement, no-write completion, and
normal bookkeeping after all replacements. A postwrite input conflict keeps the
installed data and original pending evidence without refreshing synchronization
metadata. No further asset-file check runs after replacements: media changes alone
permit normal bookkeeping, and the next Push checks those current facts even when
data has no differences. Media never enters the Snapshot or pending backups.

Missing media does not prevent recording data writes that are already complete.
Recovery can finish and clear pending even when the following no-diff Push fails
its current asset check; that failure does not recreate pending. An all-old attempt
can likewise be abandoned before the ordinary checks decide whether to start a new
Push. Recovery retains an older configuration's omitted policy fields and its
original contract, source, dependency and target basis. A changed current policy or
stale contract can still prohibit new writes after recovery; completing bookkeeping
does not certify current assets or upgrade old generated output.

The supported relationships, file rules and exception policy are in the [asset reference](reference/assets.md).

## Recovery of older output

Recovery can finish recording a completed pre-Troops Push whose internally consistent
original evidence uses the understood complete Common/System/Map output set. It
retains that original Compile Contract and type/source/configuration basis. A new
Compile is still required before current output is fresh; arbitrary incomplete output
sets cannot authorize recovery or ordinary Push.

## Concurrent operations

Clone, Pull, Decompile, Compile (including `--check`), Diff, Push and the Workspace
API's freshness query share a per-Workspace lock. Contention immediately reports
`Workspace is busy`; retry after the active operation finishes. Different Workspaces
operate independently. Windows releases the lock when its owner exits or crashes.
The persistent `.rpgmaker-event-dsl/operation.lock` file stays in place; its existence
does not indicate a live owner. Lock release preserves pending Interrupted Push state,
which only Push can resolve.
