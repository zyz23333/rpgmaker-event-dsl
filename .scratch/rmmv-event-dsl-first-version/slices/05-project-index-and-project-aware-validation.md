# Slice 05: Project Index and Project-aware Validation

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
- Slice 04

## Purpose

Implement the project-aware safety layer that turns Event Definitions into validated plans. This slice enforces the first-version semantics around target binding, create/replace matching, script gating, explicit ID usage, and reference resolution.

## Scope

### In

- Project Index construction from MV data.
- Name resolution for project references.
- Validation of map targets, common event targets, and definition target configuration.
- Validation of create vs replace rules.
- Validation of script enablement and plugin command shape.
- Lint diagnostics and warnings.

### Out

- DSL syntax definitions.
- Command compilation.
- JSON writing.
- CLI routing.

## Design References

- Requirements:
  - R-02
  - R-03
  - R-04
  - R-05
  - R-09
  - R-10
  - R-11
  - R-17
  - R-18
  - R-19
  - R-20
  - R-21
  - R-22
  - R-23
  - R-25
  - R-26
  - R-27
  - R-28
- Decisions:
  - Map targets are config-owned
  - One run uses one mode
  - Create append-only
  - Replace unique-name exact match
  - Lint is project-aware
  - Script commands require config enablement
  - Plugin command registry is optional
- Invariants:
  - No hidden target inference from filenames
  - No merge/upsert/delete semantics
  - No raw numeric ID references
- Completion Contract:
  - OT-01
  - OT-02
  - OUT-02
- Canonical docs:
  - README.md
  - CONTEXT.md
  - docs/adr/0002-event-data-operations-create-replace.md
  - docs/adr/0003-validation-preview-and-output-strategy.md

## Code Context

The source copies in `references/` show how MV loads event data and checks conditions. This slice should codify those runtime constraints into project-aware validation rather than trusting authoring code alone.

## What To Build

Build the validation and lint layer that confirms Event Definitions are safe, resolvable, and compatible with the configured MV project before any apply path runs.

## Acceptance Criteria

- [ ] Lint can reject invalid definitions, ambiguous targets, and disallowed shapes before any write path runs.
- [ ] Create and replace plans are validated against the actual project data.
- [ ] Script gating and plugin command rules are enforced according to the locked decisions.

## Implementation Notes

This is the safety-critical slice. Keep the validation results explicit and make sure the same checks are reused by lint and apply flows.

## Suggested Task Plan

1. Build the Project Index.
2. Build the validation rules.
3. Make lint and apply consume the same validation surface.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
