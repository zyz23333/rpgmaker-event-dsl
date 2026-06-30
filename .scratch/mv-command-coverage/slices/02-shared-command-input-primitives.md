# Slice 02: Shared Command Input Primitives

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 01: MV-Aligned Rename Foundation

## Purpose

Create reusable input models for repeated MV command shapes so later command-family slices can stay consistent and avoid duplicating ad hoc unions.

## Scope

### In

- Shared range, operand, target, position, tone/color, and audio payload types.
- Opaque Asset References with `audioAsset`, `imageAsset`, and `movieAsset`.
- Shared Script Input detection for non-top-level script-bearing command inputs.
- Generic validation traversal support for nested Project Data References, Asset References, Runtime Selectors, and Script Inputs in future command shapes.
- Public exports for new reference helpers and types where appropriate.

### Out

- File-system asset scanning.
- Project Data Reference behavior changes.
- Eagerly adding every future Project Data Reference Scope.
- Implementing broad command families that only need these primitives.

## Design References

- Requirements: REQ-04, REQ-05, REQ-06
- Decisions: Asset References are no-scan; Script Inputs are all gated; Project Data References are separate from Asset References; Runtime Selectors are separate from Project Data References.
- Invariants: Asset References never resolve to project data IDs; Runtime Selectors never resolve through the Staged Data Graph; Script Input is gated regardless of command family.
- Completion Contract: OUT-03, OT-05, OT-06, DOC-01
- Canonical docs: `../mv-command-coverage-design.md`, `CONTEXT.md`

## Code Context

Current shared model lives mostly in `dsl.ts`, with validation in `staged-graph.ts` and exports in `index.ts`. Current `ReferenceValue` is only for Project Data References and should not be reused for assets or Runtime Selectors.

## What To Build

Introduce common schema-first TypeScript types and helpers for ranges, operation operands, MV targets, asset references, runtime selectors, and script-bearing inputs. Make validation traversal capable of detecting Project Data References and Script Inputs recursively in future command shapes.

This slice establishes the reusable mechanism and naming boundary for future Project Data Reference Scopes, but it should not eagerly add every scope needed by later command families. A later slice that introduces a new scope must add the corresponding `xxxRef` helper, `ReferenceKind`, snapshot extraction, validation/name-id tests, and decompiler import rendering in the same slice.

## Acceptance Criteria

- [ ] `audioAsset({ folder, name })`, `imageAsset({ folder, name })`, and `movieAsset({ name })` exist and are exported.
- [ ] Asset Reference values are distinct from Project Data Reference values.
- [ ] Asset Reference validation is limited to shape/namespace checks, with no file-system reads.
- [ ] Runtime Selector primitives are distinct from Project Data Reference and Asset Reference values.
- [ ] Shared Script Input detection can be reused by future conditional, variable, and move route commands.
- [ ] Future nested command validation can traverse Project Data References without treating Asset References or Runtime Selectors as Staged Data Graph references.
- [ ] Existing commands still compile and validate unchanged except for the Slice 01 rename.

## Implementation Notes

Keep helper names category-level, not per-folder. `audioAsset.folder` should cover MV `audio` namespaces; `imageAsset.folder` should cover MV `img` namespaces; `movieAsset` has no folder because MV movies use the fixed `movies` namespace.

Do not create `xxxRef` helpers for runtime target concepts such as player/current event, enemy troop member index, actor target mode, vehicle selector, picture slot, or equip slot. Those should be schema-first Runtime Selector or command-local enum values.

## Suggested Task Plan

1. Add DSL helper/type tests for new asset helpers and primitive shapes.
2. Implement shared types/helpers in `dsl.ts` and exports in `index.ts`.
3. Add validation utilities without changing raw command behavior.
4. Add guard tests or type tests that Asset References and Runtime Selectors are not accepted as Project Data References.
5. Run focused tests and typecheck.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- dsl.test.ts staged-graph.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
