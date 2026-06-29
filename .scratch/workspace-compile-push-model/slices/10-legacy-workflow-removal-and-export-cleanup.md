# Slice 10: Legacy Workflow Removal And Export Cleanup

## Status

Ready

## Type

migration

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 05: Compile Check Workflow
- Slice 06: Compile Materialization And Compile Baseline
- Slice 07: Structured Diff Workflow
- Slice 08: Push Safety And Staged Writes

## Purpose

Remove old direct-write workflow surfaces after the new compile/push workflow is available, so users and tests cannot accidentally depend on legacy create/replace behavior.

## Scope

### In

- Remove or internalize legacy `runWorkflow` create/replace/lint paths.
- Remove old direct-write workflow tests or rewrite them around the new commands.
- Clean public exports to reflect the new DSL helpers and workflow APIs.
- Ensure no public CLI or documented API path writes Project Root outside `push`.

### Out

- Rewriting historical ADRs.
- Maintaining compatibility aliases for old commands.
- Additional feature behavior beyond cleanup.

## Design References

- Requirements: R-01
- Decisions: `create`, `replace`, and standalone `lint` are removed from public CLI.
- Invariants: Push is the only command that writes Project Root data.
- Completion Contract: OT-01, DOC-03, DOC-04
- Canonical docs: ADR-0005, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/workflow.ts` currently implements `lint`, `create`, and `replace`.
- `packages/rmmv-event-dsl/test/workflow.test.ts` currently asserts direct writes.
- `packages/rmmv-event-dsl/src/index.ts` exports old config types and DSL helpers.

## What To Build

Clean up old surfaces once the new workflow has enough coverage that removing old behavior does not leave the package without functional command paths.

## Acceptance Criteria

- [ ] No public CLI path invokes old create/replace behavior.
- [ ] No public API encourages `definitionTargets` as the workspace-level compilation model.
- [ ] Old direct-write tests are removed or rewritten for new command behavior.
- [ ] Public exports include `switchDefinition`, `variableDefinition`, and new declaration types.
- [ ] Public exports do not expose removed workflow concepts as preferred APIs.
- [ ] A repository search finds no user-facing docs recommending `create`, `replace`, or standalone `lint`.

## Implementation Notes

This is deliberately late because deleting the old workflow too early may make intermediate slices harder to verify. Keep any legacy helpers only if they are private and still useful to the new implementation.

## Suggested Task Plan

1. Search for legacy command/config usage.
2. Remove or rewrite old tests.
3. Clean exports and any stale documentation snippets.
4. Run package tests and typecheck.

## Verification Commands

```bash
rg -n "definitionTargets|\\bcreate\\b|\\breplace\\b|\\blint\\b" packages docs README.md
pnpm --filter @rmmv-event-dsl/core test
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
