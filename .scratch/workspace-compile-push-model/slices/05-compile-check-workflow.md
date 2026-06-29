# Slice 05: Compile Check Workflow

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

- Slice 04: Staged Data Graph And Reference Validation

## Purpose

Provide the read-only validation workflow that replaces standalone lint and proves source discovery plus Staged Data Graph validation work end to end.

## Scope

### In

- Implement `compile --check`.
- Require an existing Project Data Snapshot.
- Discover DSL declaration files from source config.
- Evaluate declarations.
- Build and validate the Staged Data Graph.
- Report validation success/failure without writing Workspace Data State.

### Out

- Writing Generated Project Data.
- Updating Sync Manifest generated/freshness fields.
- Diff or push behavior.

## Design References

- Requirements: R-03, R-05, R-07
- Decisions: Compile Check is read-only and does not create Generated Freshness.
- Invariants: Compile Check never mutates Workspace Data State; Compile never mutates Project Root or Project Data Snapshot.
- Completion Contract: OT-04 partial, OUT-02, OUT-03
- Canonical docs: `CONTEXT.md`, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/workflow.ts` currently conflates lint/create/replace.
- New workflow functions may be clearer than stretching `runWorkflow`.
- Existing workflow tests already use temporary workspaces and MV-like projects.

## What To Build

Implement a read-only compile validation path that exercises the new workspace compilation pipeline without producing Generated Project Data.

## Acceptance Criteria

- [x] `compile --check` fails before source evaluation when no Project Data Snapshot exists.
- [x] `compile --check` discovers configured DSL declaration files.
- [x] It validates same-run DSL-owned references.
- [x] It rejects duplicate Entry Identity.
- [x] It rejects ambiguous name references.
- [x] It rejects missing Explicit ID References.
- [x] It enforces Script Command Gate.
- [x] It writes no Generated Project Data.
- [x] It does not update Sync Manifest generated or freshness metadata.

## Implementation Notes

This slice should create the core compile orchestration seam used by normal `compile` later. Keep materialization optional or in-memory only when needed for validation.

## Suggested Task Plan

1. Add workflow tests for `compile --check`.
2. Add a compile orchestration module or refactor `workflow.ts` into new command-specific functions.
3. Wire CLI `compile --check` to the new read-only path.
4. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts cli.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Verification Result

Completed with:

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts cli.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
pnpm --filter @rmmv-event-dsl/core test
pnpm lint
pnpm format:check
```

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
