# Slice 04: Schema-first DSL Surface and Event AST

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../rmmv-event-dsl-first-version-design.md`
- PRD: `../rmmv-event-dsl-first-version-prd.md`

## Blocked By

- Slice 03

## Purpose

Create the developer-facing Event Definition surface and the intermediate AST that later slices will validate, compile, and write. This slice establishes the DSL shape without committing to CLI behaviors or output handling.

## Scope

### In

- Named-export Event Definitions.
- `mapEvent`, `commonEvent`, `page`, and command helper inputs.
- `xxxRef` reference helper surface.
- Event Node AST shape.

### Out

- Project-aware validation rules.
- Command compilation.
- JSON output writing.
- CLI command routing.

## Design References

- Requirements:
  - R-01
  - R-08
  - R-09
  - R-10
  - R-21
  - R-22
  - R-23
  - R-24
  - R-25
  - R-26
  - R-27
  - R-29
- Decisions:
  - Schema-first DSL
  - Named exports only
  - Page conditions as fixed slots
  - Empty command lists allowed
  - Function-style command helpers
  - Script input uses `code`
  - Plugin command input uses schema-first object form
- Invariants:
  - No default export collection
  - No bare numeric ID references
  - Map page lists are non-empty
- Completion Contract:
  - OT-01
  - OUT-01
  - OUT-02
- Canonical docs:
  - README.md
  - CONTEXT.md
  - docs/adr/0001-schema-first-dsl-entry-model.md

## Code Context

There is no DSL implementation yet. This slice is the first concrete developer-facing surface and should stay aligned with the glossary terms already established.

## What To Build

Define the first-version DSL types and helpers for authoring map events, common events, pages, references, and command nodes.

## Acceptance Criteria

- [ ] Event Definitions can be expressed as named TypeScript exports.
- [ ] `mapEvent`, `commonEvent`, `page`, and command helpers accept schema-first object inputs.
- [ ] The AST captures the first-version DSL concepts without exposing raw MV command construction directly.

## Implementation Notes

The DSL should reflect the schema-first shape already agreed in the PRD and ADRs. Keep the surface readable and explicit rather than introducing positional overloads.

## Suggested Task Plan

1. Define the public DSL types.
2. Define the AST.
3. Ensure the DSL surface lines up with the locked glossary terms.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
