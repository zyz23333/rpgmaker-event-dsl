# Slice 09: DSL Decompilation

## Status

Done

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 02: Workspace Data State And Standard Snapshot
- Slice 03: DSL Declarations And Source Discovery

## Purpose

Provide a non-destructive brownfield starting point by turning the Project Data Snapshot into compilable DSL source with explicit Entry Identities.

## Scope

### In

- Implement `decompile` command behavior.
- Read from Project Data Snapshot.
- Write fixed source layout under `src/decompiled/`.
- Preflight all target output paths before writing.
- Emit Map Event, Common Event, Variable Definition, and Switch Definition declarations.
- Use raw escape hatches for unsupported commands.
- Ignore empty variable/switch slots.

### Out

- Perfect high-level DSL round-tripping.
- Overwrite mode.
- Source formatting beyond repository formatter.
- Decompiling non-owned data domains.

## Design References

- Requirements: R-15
- Decisions: Decompile output layout is fixed; existing output files cause failure before writing.
- Invariants: Decompile does not write Project Root.
- Completion Contract: OT-03
- Canonical docs: `CONTEXT.md`, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/events.ts` contains command compilation logic but no decompilation.
- `packages/rmmv-event-dsl/src/dsl.ts` defines helper names that generated source should import.
- `packages/rmmv-event-dsl/src/definitions.ts` limits what generated source can contain if it should compile immediately.

## What To Build

Generate usable DSL source from snapshot carrier files in a deterministic, non-destructive layout.

## Acceptance Criteria

- [x] `decompile` fails when no Project Data Snapshot exists.
- [x] `decompile` writes:
  - `src/decompiled/maps/Map###.events.ts`
  - `src/decompiled/common-events.events.ts`
  - `src/decompiled/system.dsl.ts`
- [x] Decompile preflights all target paths and fails before writing if any target exists.
- [x] Map Event declarations include `mapId` and event `id`.
- [x] Common Event declarations include `id`.
- [x] Variable/Switch declarations include `id` and non-empty `name`.
- [x] Empty variable/switch name slots are not emitted.
- [x] Unsupported event commands are emitted through `rawDslCommand`.
- [x] Generated source matches Definition Source Discovery include patterns.

## Implementation Notes

Keep generated TypeScript inside the evaluator-supported subset. Export names are non-semantic; derive readable names from Display Names and add ID suffixes when needed.

## Suggested Task Plan

1. Add workflow tests for decompile layout and non-destructive failure.
2. Add command decompilation helpers for supported commands and raw fallback.
3. Implement source rendering for maps, common events, and system definitions.
4. Wire CLI `decompile`.
5. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts definitions.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

Additional verification run during implementation:

```bash
pnpm format:check
pnpm lint
pnpm --filter @rmmv-event-dsl/core test
```

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
