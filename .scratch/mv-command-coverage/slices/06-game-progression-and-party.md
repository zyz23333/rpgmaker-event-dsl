# Slice 06: Game Progression and Party

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 01: MV-Aligned Rename Foundation
- Slice 02: Shared Command Input Primitives
- Slice 03: Decompiler Completion Harness

## Purpose

Complete MV Game Progression and Party command families, including the range and operand semantics that motivated the plural helper rename.

## Scope

### In

- `controlSwitches` range support.
- `controlVariables` range support and all MV operand kinds.
- Script operand gating for Control Variables.
- `controlTimer`.
- `changeGold`, `changeItems`, `changeWeapons`, `changeArmors`, `changePartyMember`.
- Compile, decompile, validation, tests, and docs where public names change.

### Out

- Actor parameter/stat changes from the Actor command group.
- Raw command semantic gate changes.

## Design References

- Requirements: REQ-01, REQ-03, REQ-04, REQ-06
- Decisions: plural helper names, no old aliases, Script Input gate applies to variable script operand.
- Invariants: Project Data References resolve through Staged Data Graph; Script Input is gated.
- Completion Contract: OUT-02, OT-03, OT-06
- Canonical docs: `../mv-command-coverage-design.md`, MV `command121` through `command129`

## Code Context

Current switch and variable helpers only support single targets. Current `changeGold` and `changeItem` only support constant amounts, and `changeItem` should become `changeItems` to match MV's plural command family.

## What To Build

Implement the Game Progression and Party matrix rows with schema-first helpers, MV-compatible raw output, decompile rendering, and validation.

## Acceptance Criteria

- [ ] Switch and variable range commands compile with MV start/end IDs.
- [ ] Control Variables supports constant, variable, random, game data, and script operands.
- [ ] Control Variables script operand is blocked by Script Command Gate when disabled.
- [ ] Party inventory helpers support constant and variable operands.
- [ ] Weapons and armors support include-equipment flag.
- [ ] Decompiler renders supported shapes and falls back on malformed shapes.

## Implementation Notes

MV `operateValue` semantics are shared by gold/items/weapons/armors and actor/enemy HP-like commands. Prefer a reusable operand model that later slices can reuse.

## Suggested Task Plan

1. Add compile/decompile/validation tests for each command family.
2. Implement helper/type additions and compiler parameter builders.
3. Implement decompiler handlers and imports.
4. Update examples/docs for renamed item/control helpers.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- dsl.test.ts events.test.ts staged-graph.test.ts workflow.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
