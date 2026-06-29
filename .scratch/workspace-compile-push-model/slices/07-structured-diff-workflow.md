# Slice 07: Structured Diff Workflow

## Status

Ready

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

- [ ] `diff` fails when Generated Project Data is missing.
- [ ] `diff` fails when Generated Freshness does not match the current Compile Baseline.
- [ ] `diff` does not read live Project Root files.
- [ ] Diff report groups changes by Data Domain.
- [ ] Diff report groups changes by Entry Identity.
- [ ] Diff report classifies generated-only, snapshot-only, changed, unchanged, and non-owned-carried entries.
- [ ] Snapshot-only DSL-owned entries are reported as Destructive Changes.
- [ ] CLI output is human-readable and stable enough for tests.
- [ ] No stable machine-readable JSON output is added.

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
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
