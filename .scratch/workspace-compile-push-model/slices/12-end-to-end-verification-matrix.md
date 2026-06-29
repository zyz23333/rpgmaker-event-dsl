# Slice 12: End-To-End Verification Matrix

## Status

Ready

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 01: Command Surface And Workspace Config
- Slice 02: Workspace Data State And Standard Snapshot
- Slice 03: DSL Declarations And Source Discovery
- Slice 04: Staged Data Graph And Reference Validation
- Slice 05: Compile Check Workflow
- Slice 06: Compile Materialization And Compile Baseline
- Slice 07: Structured Diff Workflow
- Slice 08: Push Safety And Staged Writes
- Slice 09: DSL Decompilation
- Slice 10: Legacy Workflow Removal And Export Cleanup
- Slice 11: User-Facing Docs And Sample Workspace

## Purpose

Close the change by verifying every Observable Truth, Required Design Outcome, and high-risk invariant across tests, typechecking, linting, formatting, and documentation consistency.

## Scope

### In

- Audit workflow tests against the design completion contract.
- Add missing high-level tests for gaps left by earlier slices.
- Add pure-logic tests for hashing, source discovery ordering, diff classification, materialization, and entry removal representation where not already covered.
- Run package and root verification commands.
- Document skipped verification reasons if any command cannot run.

### Out

- New feature behavior.
- Refactors unrelated to passing the design contract.

## Design References

- Requirements: R-01 through R-17
- Decisions: All Locked Decisions
- Invariants: All Invariants
- Completion Contract: OT-01 through OT-09, OUT-01 through OUT-08, DOC-01 through DOC-04
- Canonical docs: `CONTEXT.md`, ADR-0005, ADR-0006, `../workspace-compile-push-model-design.md`

## Code Context

- Root scripts in `package.json`: `pnpm check`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`.
- Package scripts in `packages/rmmv-event-dsl/package.json`: `test`, `typecheck`, `build`.
- Existing tests live under `packages/rmmv-event-dsl/test/`.

## What To Build

Add only the missing tests or docs needed to prove the completed implementation satisfies the design. This slice should not introduce new behavior unless it exposes an implementation gap that belongs to an earlier slice.

## Acceptance Criteria

- [ ] CLI command surface test covers all public commands and removed commands.
- [ ] Workflow tests cover clone, pull, decompile, compile check, compile, diff, push, destructive push.
- [ ] Tests cover Compile Baseline staleness from source, config, and snapshot changes.
- [ ] Tests cover Standard Project Data Snapshot inclusion/exclusion.
- [ ] Tests cover source discovery include/exclude behavior.
- [ ] Tests cover Entry Identity and reference validation.
- [ ] Tests cover dense hole arrays.
- [ ] Tests cover staged push success and failure paths.
- [ ] Docs and examples align with implemented commands and config.
- [ ] Root `pnpm check` passes, or any skipped command has a concrete documented reason.

## Implementation Notes

If verification exposes missing production behavior, fix the responsible earlier slice scope rather than masking it in verification-only tests.

## Suggested Task Plan

1. Map existing tests to OT/OUT/DOC items.
2. Add missing tests only for uncovered contract items.
3. Run focused package checks.
4. Run root checks.
5. Record verification results in the final implementation report.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test
pnpm --filter @rmmv-event-dsl/core typecheck
pnpm check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
