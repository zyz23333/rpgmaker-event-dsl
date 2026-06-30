# Slice 04: Message Commands

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

Complete the MV Message command group so common dialogue and input flows can be authored and decompiled without raw command escapes.

## Scope

### In

- Expand `showText` to support face image, background, and position.
- Complete `showChoices` branch ownership for `402` and `403`.
- Add `inputNumber`, `selectItem`, and `showScrollingText`.
- Compile and decompile message continuations `401` and `405`.

### Out

- Full Conditional Branch taxonomy.
- Plugin-specific message extensions.
- Asset scanning for face images.

## Design References

- Requirements: REQ-01, REQ-02, REQ-04
- Decisions: continuation commands are represented through parent helpers.
- Invariants: Raw Event Commands remain MV-compatible; malformed shapes fall back through decompile.
- Completion Contract: OT-01, OT-02, OT-03
- Canonical docs: `../mv-command-coverage-design.md`, MV `Game_Interpreter.command101` through `command105`

## Code Context

Current `showText` emits fixed parameters and `401` lines. `showChoices` exists but is partial. `inputNumber`, `selectItem`, and `showScrollingText` are missing.

## What To Build

Implement schema-first helpers and compiler/decompiler behavior for the Message matrix rows.

## Acceptance Criteria

- [ ] `showText` supports face image, background, position, and line continuations.
- [ ] `showChoices` owns choice and cancel branches with correct indentation.
- [ ] `inputNumber` compiles/decompiles `103`.
- [ ] `selectItem` compiles/decompiles `104`.
- [ ] `showScrollingText` compiles/decompiles `105` and `405`.
- [ ] Supported malformed raw shapes decompile to `rawDslCommand(...)`.

## Implementation Notes

MV permits `Show Text` to be followed by choices, number input, or item selection. Preserve MV-compatible command ordering and indentation when modeling those relationships.

## Suggested Task Plan

1. Add tests for compile and decompile behavior for each Message command.
2. Add/extend helpers and types.
3. Implement compiler and decompiler handlers.
4. Update docs/examples if helper signatures change.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- dsl.test.ts events.test.ts workflow.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
