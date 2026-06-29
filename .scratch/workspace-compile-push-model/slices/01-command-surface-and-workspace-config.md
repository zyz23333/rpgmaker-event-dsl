# Slice 01: Command Surface And Workspace Config

## Status

Ready

## Type

foundation

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- None

## Purpose

Establish the public command surface and Workspace Config shape for the workspace compile/push model before deeper workflow behavior is implemented.

## Scope

### In

- Replace public CLI command declarations with `init`, `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- Remove public `lint`, `create`, and `replace` commands.
- Add `compile --check` and `push --allow-destructive` command options.
- Change Workspace Config schema from `definitionTargets` to source discovery fields.
- Update `init` defaults to write source discovery config and create `src/`.
- Keep command handlers thin and allowed to call not-yet-implemented workflow functions with clear errors if later slices have not landed.

### Out

- Implementing actual clone/pull/compile/diff/push/decompile behavior.
- Implementing source discovery itself beyond config shape.
- Migrating old workflow internals.

## Design References

- Requirements: R-01, R-02
- Decisions: Workspace Config uses `sourceRoot`, `sourceInclude`, and `sourceExclude`; direct public `create`/`replace`/`lint` commands are removed.
- Invariants: Push is the only command that writes Project Root data; Compile Check never mutates Workspace Data State.
- Completion Contract: OT-01, OUT-01, OUT-07
- Canonical docs: `CONTEXT.md`, ADR-0003, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/cli.ts` currently declares `init`, `lint`, `create`, and `replace`.
- `packages/rmmv-event-dsl/src/workspace.ts` currently validates `definitionTargets`.
- `packages/rmmv-event-dsl/test/cli.test.ts` asserts the old command surface.
- `packages/rmmv-event-dsl/test/workspace.test.ts` asserts the old config shape and duplicate binding validation.

## What To Build

Introduce the new command/config shell while keeping behavior intentionally narrow. This slice should make the public entrypoints and config contract match the design so later slices can attach workflow implementations without changing CLI semantics again.

## Acceptance Criteria

- [ ] `createCli()` exposes exactly `init`, `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- [ ] `createCli()` does not expose public `lint`, `create`, or `replace`.
- [ ] `compile` accepts `--check`.
- [ ] `push` accepts `--allow-destructive`.
- [ ] `workspaceConfigSchema` accepts `projectRoot`, `scriptEnabled`, `sourceRoot`, `sourceInclude`, and `sourceExclude`.
- [ ] `workspaceConfigSchema` no longer requires `definitionTargets`.
- [ ] `initWorkspace` writes default source discovery config:
  - `sourceRoot: "src"`
  - `sourceInclude: ["**/*.events.ts", "**/*.dsl.ts"]`
  - `sourceExclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]`
- [ ] Existing project root validation still requires `.rpgproject` and `data/`.

## Implementation Notes

Preserve `projectRoot` resolution relative to Workspace Root. Avoid silently supporting both old and new config shapes unless explicitly needed for tests; the design is a breaking change. If workflow handlers are placeholders, they should fail with clear unimplemented errors rather than performing old direct-write behavior.

## Suggested Task Plan

1. Update CLI command tests to assert the new command surface and options.
2. Update workspace config tests for source discovery config.
3. Change `cli.ts` command declarations and handler wiring.
4. Change `workspace.ts` schema and init defaults.
5. Run focused tests.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- cli.test.ts workspace.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
