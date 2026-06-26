# Slice 07: CLI Workflows for Lint, Create, Replace, Preview, and Diff

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
- Slice 05
- Slice 06

## Purpose

Expose the first-version tool as a practical CLI workflow that drives lint, create, replace, preview, and diff from the shared project-aware validation and compilation surfaces.

## Scope

### In

- CLI entrypoints for lint, create, replace, dry-run, and diff.
- Mode routing and run-level behavior.
- Read-only preview output.
- No-partial-write behavior across write paths.
- Summary and diff reporting.

### Out

- DSL semantics.
- Compiler internals.
- Project index building.
- Golden-sample authoring.

## Design References

- Requirements:
  - R-02
  - R-03
  - R-06
  - R-07
  - R-11
  - R-12
  - R-13
  - R-32
- Decisions:
  - One mode per run
  - Dry-run and diff are read-only
  - Validation must happen before write
- Invariants:
  - No partial writes
  - No merge/upsert/delete semantics
- Completion Contract:
  - OT-01
  - OT-02
  - OT-03
- Canonical docs:
  - README.md
  - CONTEXT.md
  - docs/adr/0003-validation-preview-and-output-strategy.md

## Code Context

There is no CLI implementation yet. This slice composes the earlier foundation, validation, and compiler slices into a user-facing command surface.

## What To Build

Implement the CLI workflows and make sure they route through the project-aware safety layer and stable compiler/output pipeline.

## Acceptance Criteria

- [ ] Lint reports project-aware validation results without writing files.
- [ ] Create and replace write only after all validation passes.
- [ ] Dry-run and diff do not write files.
- [ ] Failed runs do not leave partial outputs behind.

## Implementation Notes

This slice should not invent new semantics. Its job is to expose the locked workflow in a direct, predictable way.

## Suggested Task Plan

1. Wire the CLI surface to the validation and compiler layers.
2. Add read-only preview behavior.
3. Add the write path and no-partial-write enforcement.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
