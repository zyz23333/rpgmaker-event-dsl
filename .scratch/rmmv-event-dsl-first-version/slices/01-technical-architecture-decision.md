# Slice 01: Technical Architecture and Dependency Stack Decision

## Status

Ready

## Type

decision

## Tracker

External issue: none

## Parent Change

- Design: `../rmmv-event-dsl-first-version-design.md`
- PRD: `../rmmv-event-dsl-first-version-prd.md`

## Blocked By

- None

## Purpose

Choose the project’s core technical stack and dependency boundaries before implementation begins. This slice exists to prevent later slices from assuming the wrong runtime, CLI framework, test harness, or file-system strategy.

## Scope

### In

- Select the TypeScript and runtime baseline.
- Select the CLI implementation style.
- Select the test framework and assertion style.
- Select the JSON/file handling approach.
- Define the top-level module and package boundaries needed by later slices.

### Out

- Event DSL implementation.
- Project-aware validation rules.
- MV schema extraction.
- Command compilation.

## Design References

- Requirements:
  - R-01
  - R-02
  - R-06
  - R-07
  - R-08
  - R-09
  - R-10
- Decisions:
  - Schema-first DSL
  - Project-aware validation
  - MV-style JSON writing
  - Script command enablement
- Invariants:
  - No hidden project-level default overrides
  - No merge or upsert semantics
  - No partial write after failed validation
- Completion Contract:
  - OT-01
  - OT-03
  - OT-04
- Canonical docs:
  - README.md
  - CONTEXT.md
  - docs/adr/0001-schema-first-dsl-entry-model.md
  - docs/adr/0003-validation-preview-and-output-strategy.md

## Code Context

The repository currently has no implementation package or CLI entrypoint. This slice establishes the technical foundations that all later implementation slices will depend on.

## What To Build

Document and settle the implementation stack so that later slices can assume a stable runtime, module format, testing approach, and CLI toolchain.

## Acceptance Criteria

- [ ] The technical stack choice is recorded in a way that later slices can depend on it.
- [ ] The selected stack is sufficient to implement the first-version CLI, DSL, validation, compiler, and writer.
- [ ] No later slice needs to reopen the core runtime or CLI framework choice.

## Implementation Notes

This is a decision slice, not a build slice. It should resolve the stack before any implementation work starts and should not drift into module scaffolding.

## Suggested Task Plan

1. Document the stack decision.
2. Confirm it satisfies the first-version scope.
3. Preserve the result as the dependency baseline for later slices.

## Verification Commands

```bash
# decision slice; no build verification yet
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
