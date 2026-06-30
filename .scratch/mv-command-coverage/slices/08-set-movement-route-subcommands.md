# Slice 08: Set Movement Route Subcommands

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
- Slice 07: Movement Commands

## Purpose

Support MV's nested Move Route command model under `Set Movement Route` without polluting top-level `DslCommand` with route-only commands.

## Scope

### In

- `setMovementRoute` event command helper.
- Nested move route command model for route codes `1`-`45`.
- Route-local asset and switch references.
- Route-local Script Input gating.
- Compile/decompile support for move route objects.

### Out

- Making route commands valid top-level Event Commands.
- Adding route behavior beyond MV 1.6.1 route codes.

## Design References

- Requirements: REQ-08, REQ-05, REQ-06
- Decisions: Move Route subcommands are nested; route script is gated.
- Invariants: Move route subcommands do not become top-level DSL commands; Script Input is gated.
- Completion Contract: OT-04, OT-06
- Canonical docs: `../mv-command-coverage-design.md`, MV `command205`

## Code Context

Map event page defaults already include a move route object, but there is no command helper for forced movement route. `events.ts` needs to compile `code: 205` with nested route list and terminator.

## What To Build

Implement `setMovementRoute` with route target, repeat/skippable/wait options, and nested route command list covering the design's subcommand matrix.

## Acceptance Criteria

- [ ] `setMovementRoute` compiles to `code: 205` with an MV-compatible route object.
- [ ] Route movement, jump, wait, turn, switch, speed/frequency/toggle/image/blend, SE, and script commands compile.
- [ ] Route script command is blocked by Script Command Gate when disabled.
- [ ] Decompiler renders supported move route objects.
- [ ] Route commands are not accepted as top-level `DslCommand` values.

## Implementation Notes

Route helper shape may use nested object discriminants rather than one exported helper per route command. Keep import ergonomics clear and avoid collisions with top-level `wait`.

## Suggested Task Plan

1. Add focused tests for route compile/decompile and script-gate behavior.
2. Implement route command types and compiler route serialization.
3. Add validation traversal for route references and script inputs.
4. Add decompiler route rendering.

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
