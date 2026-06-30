# Slice 01: MV-Aligned Rename Foundation

## Status

Ready

## Type

migration

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- None

## Purpose

Establish the final MV-aligned public helper names before adding broad command coverage, so later slices do not carry temporary singular names or compatibility aliases.

## Scope

### In

- Rename `controlSwitch` to `controlSwitches`.
- Rename `controlVariable` to `controlVariables`.
- Rename related exported types and `kind` values to plural forms.
- Update compiler, decompiler, validation, tests, examples, README, and agent skill references.

### Out

- Adding new MV command families.
- Full switch or variable range support beyond what is needed to preserve current behavior.
- Compatibility aliases for old helper names.

## Design References

- Requirements: REQ-03
- Decisions: breaking rename, no alias, MV-aligned command helper names
- Invariants: Supported command helpers remain schema-first; Project Data References retain current resolution behavior.
- Completion Contract: OUT-02, DOC-02
- Canonical docs: `../mv-command-coverage-design.md`, `../../../CONTEXT.md`, ADR 0005

## Code Context

Relevant modules are `packages/rpgmaker-event-dsl/src/dsl.ts`, `events.ts`, `decompiler.ts`, `staged-graph.ts`, and `index.ts`. Existing usages appear in `packages/rpgmaker-event-dsl/test/*.test.ts`, `example/full-event/src/full-event.events.ts`, README, and `skills/rpgmaker-event-authoring`.

## What To Build

Replace the old singular control helper surface with plural MV-aligned names everywhere. Existing single-target behavior should continue through the new plural helpers, while broader range behavior can be completed in a later slice.

## Acceptance Criteria

- [ ] `controlSwitch` and `controlVariable` are not exported from the package.
- [ ] `controlSwitches` and `controlVariables` are exported with plural type names and plural `kind` values.
- [ ] Compiler output for existing single-target switch and variable operations remains MV-compatible.
- [ ] Decompiler renders `controlSwitches(...)` and `controlVariables(...)`.
- [ ] Validation resolves switch and variable references through the renamed command kinds.
- [ ] Tests, examples, README, and skill guidance contain no old helper names.

## Implementation Notes

Do not preserve compatibility aliases. The package is `0.0.0`, and ADR 0005 permits pre-release public surface cleanup without old aliases.

## Suggested Task Plan

1. Add/update tests that assert old names are absent and new names behave like the old single-target helpers.
2. Rename types, helpers, `kind` strings, exports, compiler cases, decompiler rendering, and validation cases.
3. Update examples and docs.
4. Run focused tests, then package checks.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
