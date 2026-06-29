# Slice 08: Push Safety And Staged Writes

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

- Slice 07: Structured Diff Workflow

## Purpose

Implement the only Project Root write path with freshness, drift, destructive-change, and staged-write safety gates.

## Scope

### In

- Implement `push` command behavior.
- Enforce Generated Freshness and generated output integrity.
- Derive Affected Project Data Files from generated-vs-snapshot differences.
- Check Project Drift only for Affected Project Data Files.
- Reject Destructive Changes unless `--allow-destructive` is set.
- Stage writes before replacing Project Root files.
- Refresh affected snapshot files and manifest only after all replacements succeed.

### Out

- Force push.
- Automatic merge with editor changes.
- Rollback guarantees after partial replacement failure.

## Design References

- Requirements: R-09, R-10, R-12, R-17
- Decisions: Push writes only Affected Project Data Files; Destructive Push does not bypass freshness or drift.
- Invariants: Push is the only command that writes Project Root data; normal Push never applies Destructive Changes.
- Completion Contract: OT-06, OT-07, OT-08, OT-09
- Canonical docs: `CONTEXT.md`, ADR-0003, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/workflow.ts` currently writes Project Root files directly for create/replace.
- `packages/rmmv-event-dsl/src/writer.ts` provides stable JSON writing.
- Manifest and Generated Project Data from Slice 06 supply preflight data.
- Structured diff from Slice 07 supplies destructive and affected-file classification.

## What To Build

Implement `push` as the guarded synchronization operation from Generated Project Data to Project Root.

## Acceptance Criteria

- [ ] `push` fails when Generated Project Data is missing.
- [ ] `push` fails when Generated Freshness does not match current Compile Baseline.
- [ ] `push` fails when generated output file hashes do not match Sync Manifest.
- [ ] `push` checks drift only for Affected Project Data Files.
- [ ] Changes to non-standard `data/*.json` files do not block push.
- [ ] Changes to unaffected standard files do not block push.
- [ ] Normal `push` rejects Destructive Changes.
- [ ] `push --allow-destructive` applies Destructive Changes without bypassing freshness or drift.
- [ ] Push stages all affected file writes before replacing Project Root files.
- [ ] Snapshot and Manifest refresh only after all affected Project Root replacements succeed.
- [ ] Staging failure leaves Project Root, snapshot, and manifest unchanged.
- [ ] Partial replacement failure reports written files and leaves snapshot/manifest unchanged.

## Implementation Notes

Avoid claiming full filesystem transaction semantics. The required contract is staged writes plus honest partial-failure reporting. Use same-filesystem staging paths so replacement behavior is as predictable as possible.

## Suggested Task Plan

1. Add push workflow tests for freshness, drift, destructive gate, and write success.
2. Add failure-path tests for staging failure and partial replacement where feasible.
3. Implement affected-file derivation and drift checks.
4. Implement staged write/replace and post-success snapshot/manifest refresh.
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
