# Slice 02: Workspace Data State And Standard Snapshot

## Status

Done

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 01: Command Surface And Workspace Config

## Purpose

Make `clone` and `pull` create the Standard Project Data Snapshot and initial Sync Manifest state that every later workflow depends on.

## Scope

### In

- Define Workspace Data State paths for snapshots and manifest.
- Implement Standard Project Data Snapshot file enumeration.
- Implement `clone` and `pull` workflow behavior.
- Hash snapshot files and write Sync Manifest snapshot entries.
- Ignore non-standard `data/*.json` files.
- Fail when `MapInfos.json` references a missing `Map###.json`.

### Out

- Generated Project Data.
- Compile Baseline metadata beyond snapshot hashes.
- Diff, push, and decompile behavior.
- Supporting plugin/custom data files.

## Design References

- Requirements: R-07
- Decisions: Clone and Pull capture a Standard Project Data Snapshot; non-standard project data files are ignored.
- Invariants: Pull never mutates DSL source or Generated Project Data.
- Completion Contract: OT-02, OUT-08
- Canonical docs: `CONTEXT.md`, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/project.ts` already parses `MapInfos.json` and common events.
- `packages/rmmv-event-dsl/src/workspace.ts` already resolves Workspace Root, Project Root, and data directory.
- `packages/rmmv-event-dsl/test/workflow.test.ts` has fixture patterns for temporary MV-like projects.
- Runtime reference data exists under `references/rmmv-local-runtime-1.6.1/data`.

## What To Build

Add the first real workspace compile/push workflow behavior: snapshot capture. `clone` and `pull` should copy the standard MV data files from Project Root into tool-maintained Workspace Data State and record deterministic hashes in Sync Manifest.

## Acceptance Criteria

- [x] `clone` copies standard database files:
  - `Actors.json`
  - `Animations.json`
  - `Armors.json`
  - `Classes.json`
  - `CommonEvents.json`
  - `Enemies.json`
  - `Items.json`
  - `MapInfos.json`
  - `Skills.json`
  - `States.json`
  - `System.json`
  - `Tilesets.json`
  - `Troops.json`
  - `Weapons.json`
- [x] `clone` copies every `Map###.json` referenced by `MapInfos.json`.
- [x] `pull` refreshes the same snapshot files and hashes.
- [x] Non-standard `data/*.json` files are ignored.
- [x] Missing referenced map files fail clone/pull before writing an incomplete snapshot.
- [x] Sync Manifest records snapshot file hashes.
- [x] Clone and Pull do not write DSL source or Project Root files.

## Implementation Notes

Use deterministic relative paths in manifest entries so hashes are stable across machine-specific absolute workspace paths. Consider writing snapshot files to a temporary state location before replacing existing snapshot state on pull, so a failed pull does not leave a mixed snapshot.

- Workspace Data State is stored under `.rmmv-event-dsl/` with `project-data-snapshot/` and `sync-manifest.json`.
- Clone and Pull now capture the standard MV database set plus `Map###.json` files referenced by `MapInfos.json`.
- Non-standard `data/*.json` files remain outside the snapshot and are ignored by the workflow.
- Snapshot writes and manifest writes use temporary paths before replacement to reduce mixed-state risk on failure.

## Suggested Task Plan

1. Completed: workflow tests for clone/pull snapshot capture.
2. Completed: state path helpers and manifest read/write helpers.
3. Completed: Standard Project Data Snapshot enumeration from `MapInfos.json`.
4. Completed: clone/pull commands.
5. Completed: focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts workspace.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.

## Verification

```bash
pnpm --filter @rmmv-event-dsl/core typecheck
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts workspace.test.ts
pnpm format:check
```
