# Slice 03: DSL Declarations And Source Discovery

## Status

Completed

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 01: Command Surface And Workspace Config

## Purpose

Expand the authoring surface and source collection model so workspace compilation can discover all DSL-owned declarations across a source root.

## Scope

### In

- Add explicit Entry Identity fields to Map Event and Common Event DSL helpers/types.
- Add `switchDefinition` and `variableDefinition` helpers/types.
- Export new helpers and types from the public package entrypoint.
- Replace event-only collection with collection of all DSL-owned declarations.
- Add source discovery using `sourceRoot`, `sourceInclude`, and `sourceExclude`.
- Ensure evaluator helper namespace supports new helpers.

### Out

- Staged Data Graph validation.
- Compile materialization.
- Decompile generation.
- Supporting arbitrary local helper imports.

## Design References

- Requirements: R-02, R-03, R-14, R-16
- Decisions: DSL-owned entries declare Entry Identity; variables/switches are `System.json` name entries; source discovery does not evaluate every TypeScript file.
- Invariants: Entry Identity uniqueness is enforced later by the Staged Data Graph.
- Completion Contract: OUT-02, OUT-07
- Canonical docs: `CONTEXT.md`, ADR-0004, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/dsl.ts` defines `EventDefinition`, helpers, refs, and collection.
- `packages/rmmv-event-dsl/src/definitions.ts` evaluates DSL source and has a hard-coded helper allowlist.
- `packages/rmmv-event-dsl/src/index.ts` exports public DSL helpers/types.
- Tests: `dsl.test.ts`, `definitions.test.ts`.

## What To Build

Introduce the DSL declaration shape required by the workspace compile model and source discovery that selects declaration files from a workspace instead of relying on `definitionTargets`.

## Acceptance Criteria

- [x] `mapEvent` input requires `mapId` and `id`.
- [x] `commonEvent` input requires `id`.
- [x] `switchDefinition({ id, name })` produces a DSL-owned declaration.
- [x] `variableDefinition({ id, name })` produces a DSL-owned declaration.
- [x] Variable/switch IDs are positive integers and names are non-empty at the declaration validation layer or staged validation layer.
- [x] Source evaluator recognizes and collects Map Events, Common Events, Variable Definitions, and Switch Definitions.
- [x] Source discovery includes default `**/*.events.ts` and `**/*.dsl.ts` files under `sourceRoot`.
- [x] Source discovery excludes default test/spec/declaration files.
- [x] Ordinary helper `.ts` files not matching include patterns are not evaluated.

## Implementation Notes

The existing evaluator intentionally rejects many TypeScript constructs. Keep that constraint; this slice changes file selection and declaration kinds, not the supported TypeScript subset. Prefer a new `DslOwnedDeclaration` union over overloading `EventDefinition`.

## Suggested Task Plan

1. Update DSL tests for explicit IDs and variable/switch definitions.
2. Update definitions tests for collecting all DSL-owned declarations.
3. Add source discovery tests around include/exclude behavior.
4. Update `dsl.ts`, `definitions.ts`, and `index.ts`.
5. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- dsl.test.ts definitions.test.ts workspace.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
