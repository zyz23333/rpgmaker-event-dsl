# Slice 13: Full Coverage Verification Gate

## Status

Ready

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 01: MV-Aligned Rename Foundation
- Slice 02: Shared Command Input Primitives
- Slice 03: Decompiler Completion Harness
- Slice 04: Message Commands
- Slice 05: Flow Control Completion
- Slice 06: Game Progression and Party
- Slice 07: Movement Commands
- Slice 08: Set Movement Route Subcommands
- Slice 09: Character and Screen Commands
- Slice 10: Audio, Video, System, and Map Commands
- Slice 11: Scene Control, Actor, Enemy, and Advanced Commands
- Slice 12: Coverage Documentation and Example Workspace Refresh

## Purpose

Prove the command coverage change satisfies the design's completion contract and does not leave stale or contradictory coverage claims.

## Scope

### In

- Full repo verification.
- Coverage matrix audit against implementation.
- Optional machine-readable/test-backed coverage assertion if practical.
- Final stale-name and raw-fallback checks.

### Out

- Adding new command coverage beyond the design.
- Revising locked decisions.
- Solving deferred security or asset validation ideas.

## Design References

- Requirements: all requirements
- Decisions: all locked decisions
- Invariants: all invariants
- Completion Contract: all Observable Truths and Required Design Outcomes
- Canonical docs: `../mv-command-coverage-design.md`

## Code Context

Verification uses package scripts from root `package.json` and package `package.json`: `pnpm check`, `pnpm -r test`, `pnpm -r typecheck`, `pnpm lint`, and `pnpm format:check`.

## What To Build

Add any final coverage audit test or report that is practical, then run full verification and reconcile the design matrix with implementation status.

## Acceptance Criteria

- [ ] All repo checks pass or skipped commands have documented reasons.
- [ ] Every top-level MV editor command family in the design matrix has implemented helper, compile, decompile, validation, tests, and docs, or is explicitly deferred by a design update.
- [ ] Move Route subcommands satisfy the nested matrix.
- [ ] `rawDslCommand(...)` script-gate bypass remains documented as deferred and is not accidentally represented as safe.
- [ ] No stale helper names or contradictory docs remain.

## Implementation Notes

If a machine-readable coverage assertion is added, keep it lightweight and maintainable. Do not block completion on over-engineering a coverage generator if direct tests and matrix audit are clearer.

## Suggested Task Plan

1. Run stale-name and coverage matrix searches.
2. Add or update a final coverage assertion if practical.
3. Run `pnpm check`.
4. Update design only if implementation revealed a legitimate design mismatch.
5. Report final verification status.

## Verification Commands

```bash
rg "controlSwitch|controlVariable" README.md example skills packages
pnpm check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
