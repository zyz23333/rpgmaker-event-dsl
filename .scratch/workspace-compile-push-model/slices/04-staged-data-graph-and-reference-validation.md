# Slice 04: Staged Data Graph And Reference Validation

## Status

Done

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 02: Workspace Data State And Standard Snapshot
- Slice 03: DSL Declarations And Source Discovery

## Purpose

Build the Staged Data Graph and validation model that makes workspace compilation project-aware without relying on live Project Root data or first-win name indexes.

## Scope

### In

- Build staged indexes for DSL-owned declarations.
- Build external reference indexes from the Standard Project Data Snapshot.
- Validate required Entry Identity fields.
- Validate duplicate Entry Identity, including map-scoped Map Event identity.
- Validate name-based reference uniqueness.
- Validate Explicit ID Reference existence.
- Keep Raw DSL Command parameters semantically unchecked.

### Out

- Materializing Generated Project Data.
- Structured Diff Report output.
- Push behavior.
- Decompile output.

## Design References

- Requirements: R-03, R-04, R-05, R-14
- Decisions: Map Event identity is `{ mapId, eventId }`; DSL-owned domains do not fall back to snapshot entries; Explicit ID References must exist in visible scope.
- Invariants: External Project Data References do not imply ownership of their Data Domains.
- Completion Contract: OUT-02, OUT-03
- Canonical docs: `CONTEXT.md`, ADR-0004, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/project.ts` currently builds `Map<string, number>` indexes that silently first-win duplicate names.
- `packages/rmmv-event-dsl/src/events.ts` currently resolves references directly through `ProjectIndex`.
- `packages/rmmv-event-dsl/test/project.test.ts` and `events.test.ts` cover existing reference behavior.

## What To Build

Create the Staged Data Graph as an explicit compile-time model with duplicate-aware name indexes and visible reference scopes. Compilation and validation should use this model instead of live `ProjectIndex` first-win behavior.

## Acceptance Criteria

- [x] Duplicate Common Event, Variable, and Switch IDs fail.
- [x] Duplicate Map Event identity fails only when both `mapId` and `eventId` match.
- [x] Same event ID on different maps is allowed.
- [x] Duplicate Display Names are allowed when not referenced by name.
- [x] Name-based references fail when no visible target exists.
- [x] Name-based references fail when more than one visible target exists.
- [x] Explicit ID References fail when the target ID is absent from visible scope.
- [x] References to DSL-Owned Project Data domains do not fall back to snapshot entries.
- [x] External references resolve against Standard Project Data Snapshot indexes.
- [x] Raw DSL Command parameters are not inspected as Project Data References.

## Implementation Summary

- Added `packages/rmmv-event-dsl/src/staged-graph.ts` as the explicit staged compile-time model.
- Added duplicate-aware name indexing and snapshot reference input extraction for external reference scopes.
- Added DSL-owned identity indexes for Map Events, Common Events, Switch Definitions, and Variable Definitions.
- Added staged graph validation for required positive identities, duplicate Entry Identity, missing references, ambiguous name references, and missing explicit ID references.
- Kept DSL-owned domains isolated from snapshot fallback while resolving external data domains against snapshot-derived reference indexes.
- Introduced a `ReferenceResolver` abstraction and adapted event compilation/validation to use it while keeping the legacy `ProjectIndex` path compatible.
- Added focused staged graph tests covering identity, name ambiguity, same-run DSL-owned references, external snapshot references, and raw command escape hatch behavior.

## Implementation Notes

Avoid extending the old `ProjectIndex` shape if it makes ambiguity invisible. A new index shape that stores all matching IDs per name is safer. Compiler functions may need a reference resolver abstraction instead of direct `ProjectIndex` access.

## Suggested Task Plan

1. Add focused staged graph tests for identity and references.
2. Add duplicate-aware snapshot index helpers.
3. Add staged graph construction from declarations and snapshot.
4. Replace validation reference resolution with staged resolver.
5. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- staged-graph.test.ts events.test.ts project.test.ts workflow.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
pnpm lint
pnpm exec oxfmt --check packages/rmmv-event-dsl/src/events.ts packages/rmmv-event-dsl/src/staged-graph.ts packages/rmmv-event-dsl/src/index.ts packages/rmmv-event-dsl/test/staged-graph.test.ts
```

Verification completed:

- `pnpm --filter @rmmv-event-dsl/core test -- staged-graph.test.ts events.test.ts project.test.ts workflow.test.ts` passed.
- `pnpm --filter @rmmv-event-dsl/core typecheck` passed.
- `pnpm lint` passed with existing warnings in unrelated files:
  - `packages/rmmv-event-dsl/test/workflow.test.ts`: unused `resolve`
  - `packages/rmmv-event-dsl/src/definitions.ts`: unused `EventDefinition`
- Focused format check for touched code/test files passed.
- Full `pnpm format:check` still fails on pre-existing formatting in `packages/rmmv-event-dsl/test/definitions.test.ts`, which is outside this slice's changes.

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
