# Slice 11: Scene Control, Actor, Enemy, and Advanced Commands

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

Complete the remaining high-level MV command groups: Scene Control, Actor, Enemy, and Advanced.

## Scope

### In

- Complete `battleProcessing` branch behavior and troop target modes.
- Complete `shopProcessing` goods continuation model.
- Add name input processing.
- Add actor and enemy command families.
- Add menu/save/game-over/title commands.
- Make `script` schema-first and keep it gated.
- Keep `pluginCommand` MV-native without required registry validation.

### Out

- Plugin-specific command schemas.
- Raw command script detection.
- RPG Maker MZ behavior.

## Design References

- Requirements: REQ-01, REQ-02, REQ-04, REQ-06, REQ-09
- Decisions: Plugin coverage is MV native only; Script Input is gated; battle result branches are parent-owned continuations.
- Invariants: Script Input is gated; continuation commands are parent-owned.
- Completion Contract: OT-01, OT-02, OT-03, OT-06
- Canonical docs: `../mv-command-coverage-design.md`, MV `command301` through `command356`

## Code Context

`battleProcessing`, `shopProcessing`, `script`, and `pluginCommand` already exist but are partial. Actor/enemy commands and scene control commands are missing.

## What To Build

Implement the Scene Control, Actor, Enemy, and Advanced matrix rows with schema-first helpers, compile/decompile support, validation, and tests.

## Acceptance Criteria

- [ ] `battleProcessing` supports direct troop, variable troop, random encounter, and win/escape/lose branches.
- [ ] `shopProcessing` models goods entries and continuation goods.
- [ ] Actor and enemy helpers compile/decompile supported MV raw shapes.
- [ ] Scene commands compile/decompile no-parameter scene transitions.
- [ ] `script` uses schema-first Script Input and remains blocked when script is disabled.
- [ ] `pluginCommand` remains MV-native and does not require plugin registry validation.

## Implementation Notes

Actor/enemy HP/MP/TP and related commands should reuse operand models from earlier slices. Be precise about actor target modes and enemy troop index behavior because MV uses special values for all actors/enemies.

## Suggested Task Plan

1. Add tests for each existing partial helper expansion and representative actor/enemy commands.
2. Implement helpers/types and compiler/decompiler handlers.
3. Add validation for references and Script Inputs.
4. Update examples/docs if signatures changed.

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
