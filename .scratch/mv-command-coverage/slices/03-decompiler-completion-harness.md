# Slice 03: Decompiler Completion Harness

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 01: MV-Aligned Rename Foundation
- Slice 02: Shared Command Input Primitives

## Purpose

Make decompiler expansion systematic before many new command families are added, because Supported Event Command completion requires decompile rendering as well as compile support.

## Scope

### In

- A testable decompiler rendering seam for command lists.
- Import collection that can grow with new helpers and reference helpers.
- Continuation-aware parsing structure for command families.
- Raw fallback behavior for malformed or unsupported command shapes.

### Out

- Completing every command family in this slice.
- Changing non-destructive decompile file layout.
- Removing `rawDslCommand(...)` fallback.

## Design References

- Requirements: REQ-02, REQ-04
- Decisions: continuation commands are parent-owned; malformed raw shapes may fall back.
- Invariants: Continuation indentation is derived from parent command structure.
- Completion Contract: OT-02, OT-03
- Canonical docs: `../mv-command-coverage-design.md`

## Code Context

`decompiler.ts` currently contains private rendering functions and decompile behavior is mostly tested through `workflow.test.ts`. Existing rendering supports a subset of simple commands and raw fallback.

## What To Build

Refactor or expose a focused internal test seam so command-list rendering can be tested directly, while preserving public workflow behavior. Prepare extension points for parent-owned continuation command groups.

## Acceptance Criteria

- [ ] Decompiler command rendering can be tested without constructing full workspace fixtures for every command family.
- [ ] Existing workflow decompile tests still pass.
- [ ] `rawDslCommand(...)` fallback remains the default for unsupported or malformed command shapes.
- [ ] Import collection remains deterministic and includes helpers required by rendered commands.
- [ ] Text and comment continuation rendering still works.

## Implementation Notes

Keep public API minimal. If exporting a test seam is undesirable, use module-internal structure and higher-level tests. Do not silently revise coverage decisions while refactoring.

## Suggested Task Plan

1. Add focused decompiler tests around existing supported commands and raw fallback.
2. Refactor rendering into clearer command-family handlers.
3. Keep workflow decompile tests green.
4. Document any intentionally private test seam choice in code only if needed.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- workflow.test.ts
pnpm --filter rpgmaker-event-dsl test
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
