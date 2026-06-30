# Slice 07: Movement Commands

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

Complete the top-level Movement command families and fix the existing `transferPlayer` variable designation model.

## Scope

### In

- Correct `transferPlayer` direct and variable designation shapes.
- `setVehicleLocation`.
- `setEventLocation`.
- `scrollMap`.
- `getOnOffVehicle`.
- Shared character target model needed by this slice and later movement/character slices.

### Out

- `setMovementRoute` nested route commands, handled by Slice 08.
- Character presentation commands, handled by Slice 09.

## Design References

- Requirements: REQ-01, REQ-04
- Decisions: Direct-vs-variable modes may use discriminated unions.
- Invariants: Project Data References resolve through Staged Data Graph; raw output stays MV-compatible.
- Completion Contract: OT-01, OT-03
- Canonical docs: `../mv-command-coverage-design.md`, MV `command201` through `command206`

## Code Context

Current `transferPlayer` variable target uses `ReferenceValue<"map">` for `variableMap`, but MV variable designation expects variable IDs for map, x, and y.

## What To Build

Implement Movement matrix rows except `Set Movement Route`, using schema-first targets and direct/variable designation models.

## Acceptance Criteria

- [ ] `transferPlayer` variable designation uses variable references for map, x, and y variable IDs.
- [ ] Direct and variable designation compile correctly for transfer and vehicle location.
- [ ] Set Event Location supports direct, variable, and exchange modes.
- [ ] Character target references validate where applicable.
- [ ] Decompiler renders supported movement commands.

## Implementation Notes

Be careful with MV character target IDs: player, current event, followers, and map events have special target encodings. Do not use Project Data References where MV expects runtime character selectors.

## Suggested Task Plan

1. Add tests for transfer bug/fix and each movement command.
2. Implement target primitives and command helpers.
3. Update compiler, decompiler, and validation.
4. Update sample usage if transfer signature changes.

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
