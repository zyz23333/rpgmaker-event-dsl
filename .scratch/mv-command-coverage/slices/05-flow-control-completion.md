# Slice 05: Flow Control Completion

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 02: Shared Command Input Primitives
- Slice 03: Decompiler Completion Harness

## Purpose

Complete Flow Control behavior, especially Conditional Branch, which currently has a narrow and incorrect compilation shape.

## Scope

### In

- Full MV Conditional Branch condition taxonomy.
- Script condition as gated Script Input.
- Else continuation ownership through `411`.
- Regression protection for existing loop, comment, labels, common event, break, and exit helpers.

### Out

- Page Condition Slots redesign.
- Raw command semantic validation.
- Battle result branches, which belong to `battleProcessing`.

## Design References

- Requirements: REQ-01, REQ-02, REQ-04, REQ-06
- Decisions: Script Input is broader than top-level script command.
- Invariants: Script Input is gated; continuation indentation is derived from structure.
- Completion Contract: OT-02, OT-03, OT-06
- Canonical docs: `../mv-command-coverage-design.md`, MV `command111`, `command411`, `command112`, `command413`

## Code Context

`conditional` currently takes `PageConditions` and compiler emits a fixed switch condition parameter list. `staged-graph.ts` validates page conditions and nested commands.

## What To Build

Replace the narrow condition model with a schema-first MV conditional condition model that supports switch, variable, self switch, timer, actor, enemy, character, gold, item, weapon, armor, button, script, and vehicle cases.

## Acceptance Criteria

- [ ] Conditional Branch compiles each MV condition kind to correct `111` parameters.
- [ ] `else` compiles/decompiles via `411`.
- [ ] Script condition fails validation when `scriptEnabled` is false.
- [ ] Project Data References inside conditions are validated.
- [ ] Existing loop/comment/label/common-event helpers remain green.

## Implementation Notes

Do not conflate map page conditions with command-list Conditional Branch conditions. They are different MV concepts even when they share some reference types.

## Suggested Task Plan

1. Add tests for each condition category and script-gate failure.
2. Add condition discriminated union and helper updates.
3. Update compile/decompile/validation.
4. Run focused and package tests.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- events.test.ts staged-graph.test.ts workflow.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
