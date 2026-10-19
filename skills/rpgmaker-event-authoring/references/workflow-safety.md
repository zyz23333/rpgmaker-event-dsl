# Workflow Safety

Read this before Workspace setup, synchronization, Diff, or Project Root writes.

Read `cli-commands.md` before choosing command flags or when installed CLI behavior is
uncertain.

## Starting Point

If the current directory is not a Workspace, find or ask for the RPG Maker MV Project Root before running `init`.

For an existing RPG Maker MV project takeover, use `init`, then `clone`, then `decompile` so the agent starts from current Project Data Snapshot and editable Definition Source.

For an existing Workspace, read `rpgmaker-event-dsl.config.json` before changing source. Use its source root and include/exclude patterns to identify Definition Source.

## Package Integration

Definition Source imports DSL helpers from `rpgmaker-event-dsl`, so the Workspace must be
able to resolve that package and run its CLI.

Check `package.json` before authoring. If package metadata is missing, create it with the
user's package manager. If `rpgmaker-event-dsl` is missing from dependencies or
devDependencies, add it before writing Definition Source.

Prefer the package manager already used by the Workspace. For example:

- npm: `npm install --save-dev rpgmaker-event-dsl`
- pnpm: `pnpm add -D rpgmaker-event-dsl`
- yarn: `yarn add -D rpgmaker-event-dsl`

Use the command form that actually resolves in the Workspace, such as
`rpgmaker-event-dsl`, `npx rpgmaker-event-dsl`, `pnpm exec rpgmaker-event-dsl`, or an
existing package script.

## Normal Review Loop

After editing Definition Source:

1. Run `rpgmaker-event-dsl compile --check`.
2. Run `rpgmaker-event-dsl compile`.
3. Run `rpgmaker-event-dsl diff`.

Use the command form available in the Workspace when the binary is invoked through a package manager or local script.

## Synchronization

Run Workspace commands sequentially. If any command reports `Workspace is busy`,
retry after the active operation finishes; Check and Diff share the same lock as
writing commands. Keep `.rpgmaker-event-dsl/operation.lock` in place. Windows releases
the owner's handle after a normal exit or crash, independently of pending Interrupted
Push state. A pending Interrupted Push remains for Push to resolve.

Snapshot and Compile Baseline bind to the canonical Project Root path. After an
intentional `projectRoot` change, run an explicit Pull and compile again. A junction
alias to the same target retains its identity. When Interrupted Push is pending,
restore the original target and run Push there before switching projects. Preserve
unknown, incomplete or inconsistent pending evidence for manual correction.

If Clone or Pull reports an input/configuration change during capture, rerun after
the external edit finishes. Invalid MapInfos collections, missing registered maps,
malformed carriers and undecodable UTF-8 need correction before capture can succeed.

If the user changed data in the RPG Maker MV editor, run `rpgmaker-event-dsl pull`, then compile, then Diff.

If Diff or Push reports stale Generated Freshness, run compile again before retrying.

If Push reports Project Drift, stop. Refresh with Pull only when the user wants to bring editor-side changes into the Workspace.

## Project Root Writes

`push` writes Generated Project Data to the Project Root. Run it only when the user explicitly asks to apply, push, or write reviewed data to the RPG Maker MV project.

Do not treat "compile", "check", "preview", "show diff", or "prepare" as Push approval.

Run `push --allow-destructive` only after the user explicitly confirms the destructive entries shown by Diff.
