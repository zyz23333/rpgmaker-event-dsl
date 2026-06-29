# Slice 07: Structured Diff Workflow

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

- Slice 06: Compile Materialization And Compile Baseline

## Purpose

Replace raw direct-write preview diffs with a Structured Diff Report over Generated Project Data and Project Data Snapshot.

## Scope

### In

- Implement `diff` command behavior.
- Enforce Generated Freshness before diff.
- Compare only Generated Project Data and Project Data Snapshot.
- Build internal structured report grouped by Data Domain and Entry Identity.
- Render human-readable CLI output.
- Classify Snapshot-Only Owned Entries as Destructive Changes.

### Out

- Stable JSON diff output.
- Push behavior.
- Full semantic command diff beyond initial reconciliation hints.

## Design References

- Requirements: R-08, R-09, R-11
- Decisions: Structured Diff Report has internal structured model and human-readable CLI output; stable JSON contract is deferred.
- Invariants: Structured Diff Report must be derivable without reading live Project Root state.
- Completion Contract: OT-05, OT-06
- Canonical docs: `CONTEXT.md`, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/workflow.ts` has an old `buildDiffReport` full-file unified diff helper that compares preview output.
- Generated Project Data and snapshot state from Slice 06 provide the inputs.

## What To Build

Add structured comparison logic and a CLI `diff` workflow that gives users a safe review step before push.

## Acceptance Criteria

- [x] `diff` fails when Generated Project Data is missing.
- [x] `diff` fails when Generated Freshness does not match the current Compile Baseline.
- [x] `diff` does not read live Project Root files.
- [x] Diff report groups changes by Data Domain.
- [x] Diff report groups changes by Entry Identity.
- [x] Diff report classifies generated-only, snapshot-only, changed, unchanged, and non-owned-carried entries.
- [x] Snapshot-only DSL-owned entries are reported as Destructive Changes.
- [x] CLI output is human-readable and stable enough for tests.
- [x] No stable machine-readable JSON output is added.

## Implementation Notes

CLI output may omit unchanged entries by default, but the internal report model should be able to represent them. Keep report shape focused on data-domain and entry-level changes before adding command-level reconciliation hints.

## Suggested Task Plan

1. Add focused diff classification tests.
2. Add workflow tests for stale/missing generated data.
3. Implement report model and renderer.
4. Wire CLI `diff`.
5. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts
pnpm --filter @rmmv-event-dsl/core test -- structured-diff.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
pnpm lint
pnpm format:check
pnpm --filter @rmmv-event-dsl/core test
```

## Implementation Summary

- Added `packages/rmmv-event-dsl/src/structured-diff.ts` with an internal Structured Diff Report model and stable human-readable renderer.
- Wired `diffWorkspace` to require Generated Project Data, verify generated output hashes, enforce Compile Baseline freshness, and compare only Generated Project Data against Project Data Snapshot.
- Updated the CLI `diff` command to print the rendered Structured Diff Report.
- Added focused classification tests and workflow tests for missing generated output, stale generated output, and Project Root independence.

## Verification Results

- `pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts`: passed, 16 tests.
- `pnpm --filter @rmmv-event-dsl/core test -- structured-diff.test.ts`: passed, 2 tests.
- `pnpm --filter @rmmv-event-dsl/core typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm format:check`: passed.
- `pnpm --filter @rmmv-event-dsl/core test`: passed, 11 test files and 46 tests.

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
