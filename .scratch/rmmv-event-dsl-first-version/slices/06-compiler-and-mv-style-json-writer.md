# Slice 06: Compiler and MV-style JSON Writer

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

- Slice 02
- Slice 04
- Slice 05

## Purpose

Turn validated Event Definitions into MV-compatible raw data structures and stable output files. This slice is the main transformation engine of the first version.

## Scope

### In

- DSL node compilation into raw Event Commands.
- Page compilation into full MV page structures.
- Common event and map event compilation into output-ready data.
- Built-in compiler defaults for omitted optional input fields.
- Stable MV-style JSON writing for changed files.

### Out

- CLI argument parsing.
- Project-aware validation logic.
- Golden-sample comparison harnesses.
- Merge/upsert or delete behavior.

## Design References

- Requirements:
  - R-04
  - R-07
  - R-08
  - R-14
  - R-15
  - R-16
  - R-24
  - R-29
  - R-30
- Decisions:
  - MV-style JSON writer
  - Compiler defaults are built in
  - Empty command lists allowed
  - Map page lists non-empty
- Invariants:
  - Output must remain valid for MV runtime readers
  - No silent inheritance from replaced entries
- Completion Contract:
  - OT-04
  - OUT-01
  - OUT-02
- Canonical docs:
  - README.md
  - CONTEXT.md
  - references/rmmv-local-runtime-1.6.1/data/CommonEvents.json
  - references/rmmv-local-runtime-1.6.1/data/Map001.json

## Code Context

The reference JSON samples show the stable output style the first version should approximate. This slice should turn the DSL and validation results into output-ready event data that the CLI can write.

## What To Build

Implement the compiler pipeline and the stable JSON writer that together produce MV-compatible changed files.

## Acceptance Criteria

- [ ] Known DSL nodes compile into the expected raw command structures.
- [ ] Event pages and event entries compile into valid MV-compatible output shapes.
- [ ] The writer produces stable output for changed files.

## Implementation Notes

The writer should remain deterministic and reviewable. Keep the compiler aligned with the canonical schema catalogue from Slice 02.

## Suggested Task Plan

1. Implement node compilation.
2. Implement page and entry compilation.
3. Implement MV-style writing.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
