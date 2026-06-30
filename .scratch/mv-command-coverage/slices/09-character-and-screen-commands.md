# Slice 09: Character and Screen Commands

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
- Slice 07: Movement Commands

## Purpose

Add the MV Character and Screen command families, including picture-related Asset Reference usage.

## Scope

### In

- Character helpers: transparency, animation, balloon, followers, gather followers.
- Screen helpers: fade, tint, flash, shake, picture, weather, and existing wait regression coverage.
- `imageAsset({ folder: "pictures", name })` use for picture commands.
- Compile, decompile, validation, and tests.

### Out

- Actor image changes from the Actor command group.
- Audio/video commands.
- Asset file scanning.

## Design References

- Requirements: REQ-01, REQ-04, REQ-05
- Decisions: Asset References are no-scan; character target model may be shared.
- Invariants: Asset References never resolve to project data entry IDs.
- Completion Contract: OT-01, OT-03, OT-05
- Canonical docs: `../mv-command-coverage-design.md`, MV `command211` through `command236`

## Code Context

`eraseEvent` and `wait` already exist. Picture and screen effect commands are missing. Character target behavior should reuse the model introduced by Movement.

## What To Build

Implement Character and Screen matrix rows with MV-compatible command parameters and decompile rendering.

## Acceptance Criteria

- [ ] Character commands compile/decompile with correct target and wait behavior.
- [ ] Screen fade/tint/flash/shake/weather commands compile/decompile with duration and wait options.
- [ ] Picture commands use `imageAsset` for picture names and support direct/variable positioning where MV supports it.
- [ ] Existing `wait` and `eraseEvent` behavior remains compatible.

## Implementation Notes

Tone and color payloads should reuse shared primitives from Slice 02. Avoid introducing per-command tone structures unless necessary.

## Suggested Task Plan

1. Add compile/decompile tests for each Character and Screen command family.
2. Add helper types and compiler handlers.
3. Add decompiler renderers and import collection.
4. Add validation where references or assets appear.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- events.test.ts workflow.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
