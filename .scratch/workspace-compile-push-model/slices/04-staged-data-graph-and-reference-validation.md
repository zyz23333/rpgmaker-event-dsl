# Slice 04: Staged Data Graph And Reference Validation

## Status

Ready

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
- Canonical docs: `CONTEXT.md`, ADR-0006, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/project.ts` currently builds `Map<string, number>` indexes that silently first-win duplicate names.
- `packages/rmmv-event-dsl/src/events.ts` currently resolves references directly through `ProjectIndex`.
- `packages/rmmv-event-dsl/test/project.test.ts` and `events.test.ts` cover existing reference behavior.

## What To Build

Create the Staged Data Graph as an explicit compile-time model with duplicate-aware name indexes and visible reference scopes. Compilation and validation should use this model instead of live `ProjectIndex` first-win behavior.

## Acceptance Criteria

- [ ] Duplicate Common Event, Variable, and Switch IDs fail.
- [ ] Duplicate Map Event identity fails only when both `mapId` and `eventId` match.
- [ ] Same event ID on different maps is allowed.
- [ ] Duplicate Display Names are allowed when not referenced by name.
- [ ] Name-based references fail when no visible target exists.
- [ ] Name-based references fail when more than one visible target exists.
- [ ] Explicit ID References fail when the target ID is absent from visible scope.
- [ ] References to DSL-Owned Project Data domains do not fall back to snapshot entries.
- [ ] External references resolve against Standard Project Data Snapshot indexes.
- [ ] Raw DSL Command parameters are not inspected as Project Data References.

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
pnpm --filter @rmmv-event-dsl/core test -- project.test.ts events.test.ts workflow.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
