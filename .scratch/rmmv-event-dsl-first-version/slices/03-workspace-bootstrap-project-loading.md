# Slice 03: Workspace Bootstrap and Project Loading

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../rmmv-event-dsl-first-version-design.md`
- PRD: `../rmmv-event-dsl-first-version-prd.md`

## Blocked By

- Slice 01
- Slice 02

## Purpose

Provide the shared runtime foundation for later slices: project/config loading, workspace path resolution, and tool entry surfaces. This slice should make it possible for later work to read a project, locate definitions, and access reference data consistently.

## Scope

### In

- Load tool configuration.
- Resolve the MV project root and data directory.
- Create a shared project-loading surface for later validation and compilation slices.
- Establish the minimum CLI or library entry points needed by subsequent slices.

### Out

- DSL collection.
- Project-aware validation rules.
- Compilation of event nodes.
- JSON writing.

## Design References

- Requirements:
  - R-01
  - R-02
  - R-03
  - R-06
  - R-07
- Decisions:
  - Map targets come from configuration
  - One run uses one operation mode
  - Lint is project-aware by default
- Invariants:
  - No silent target inference from filenames
  - No partial write after failed validation
- Completion Contract:
  - OT-01
  - OT-02
  - OUT-01
- Canonical docs:
  - README.md
  - CONTEXT.md
  - docs/adr/0003-validation-preview-and-output-strategy.md

## Code Context

The repository currently lacks a runtime package and project-loading code. Later slices need a stable place to read config and project data from before they can validate or compile definitions.

## What To Build

Establish the workspace and project-loading foundation used by lint, create, replace, and preview flows.

## Acceptance Criteria

- [ ] The project root and data directory can be resolved from configuration.
- [ ] Later slices can depend on a shared project-loading surface.
- [ ] The foundation does not yet implement DSL semantics or write paths.

## Implementation Notes

This is a foundation slice, so it should stay small and reusable. It should not absorb validation rules or compiler logic.

## Suggested Task Plan

1. Add the shared loading surface.
2. Wire up config/path resolution.
3. Keep the surface narrow enough for later slices to reuse cleanly.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
