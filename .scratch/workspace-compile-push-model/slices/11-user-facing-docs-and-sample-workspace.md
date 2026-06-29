# Slice 11: User-Facing Docs And Sample Workspace

## Status

Completed

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 01: Command Surface And Workspace Config
- Slice 02: Workspace Data State And Standard Snapshot
- Slice 03: DSL Declarations And Source Discovery
- Slice 04: Staged Data Graph And Reference Validation
- Slice 05: Compile Check Workflow
- Slice 06: Compile Materialization And Compile Baseline
- Slice 07: Structured Diff Workflow
- Slice 08: Push Safety And Staged Writes
- Slice 09: DSL Decompilation
- Slice 10: Legacy Workflow Removal And Export Cleanup

## Purpose

Update user-facing guidance and examples so the documented workflow matches the new safe synchronization model.

## Scope

### In

- Update README or CLI help with workspace compile/push workflow.
- Update sample workspace config and source examples.
- Document explicit Entry Identity.
- Document source discovery patterns.
- Document safe push behavior, destructive push, Compile Baseline staleness, and ignored non-standard data files.

### Out

- New ADRs unless implementation reveals a new hard-to-reverse tradeoff.
- External website or package publishing docs.

## Design References

- Requirements: R-01 through R-17 as user-visible workflow context.
- Decisions: Direct create/replace/lint commands are removed; workspace compile/push is the documented workflow.
- Invariants: Push is the only Project Root write path.
- Completion Contract: DOC-03, DOC-04
- Canonical docs: `CONTEXT.md`, `../workspace-compile-push-model-prd.md`, `../workspace-compile-push-model-design.md`

## Code Context

- Check root README/package docs if present.
- Check sample workspace fixtures if present.
- CLI descriptions live in `packages/rmmv-event-dsl/src/cli.ts`.

## What To Build

Make docs and examples executable enough that a user can understand the sequence `clone -> decompile -> compile -> diff -> push -> pull` and author source files matching the new config and DSL surfaces.

## Acceptance Criteria

- [x] README or equivalent docs describe the new command sequence.
- [x] Docs explain `compile --check`.
- [x] Docs explain Generated Freshness and why Pull makes old generated data stale.
- [x] Docs explain normal Push vs Destructive Push.
- [x] Docs explain Standard Project Data Snapshot and ignored non-standard data files.
- [x] Sample config uses `sourceRoot`, `sourceInclude`, and `sourceExclude`.
- [x] Sample DSL declarations use explicit Entry Identity.
- [x] No user-facing doc recommends direct `create`, `replace`, or standalone `lint`.

## Implementation Notes

Keep docs aligned with implemented behavior, not only desired behavior. If implementation names differ from design discretion fields, document actual names.

## Suggested Task Plan

1. Completed: searched existing docs, examples, CLI descriptions, and legacy workflow terms.
2. Completed: added root README coverage for the workspace compile/push workflow.
3. Completed: updated full-event sample config and source discovery layout.
4. Completed: updated sample DSL declarations to use explicit Entry Identity.
5. Completed: updated CLI descriptions for `compile --check` and `push --allow-destructive`.
6. Completed: fixed implementation issues discovered while making the sample executable:
   - package entry exports now include `shopProcessing` and `transferPlayer`;
   - definition source evaluation preserves nested arrays instead of flattening all arrays;
   - staged graph validation distinguishes random variable operands and random encounters from references.
7. Completed: ran verification.

## Verification Commands

```bash
rg -n "create|replace|lint|definitionTargets|sourceRoot|compile --check|allow-destructive" README.md docs packages .scratch/workspace-compile-push-model
pnpm format:check
```

Actual verification:

```bash
rg -n "definitionTargets|rmmv-event-dsl (create|replace|lint)|standalone lint" README.md example packages/rmmv-event-dsl/src/cli.ts
rg -n "sourceRoot|sourceInclude|sourceExclude|compile --check|allow-destructive|Generated Freshness|Standard Project Data Snapshot|Destructive Push|Entry Identity" README.md example packages/rmmv-event-dsl/src/cli.ts
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @rmmv-event-dsl/core build
node ../../packages/rmmv-event-dsl/dist/cli.mjs clone
node ../../packages/rmmv-event-dsl/dist/cli.mjs compile --check
node ../../packages/rmmv-event-dsl/dist/cli.mjs compile
node ../../packages/rmmv-event-dsl/dist/cli.mjs diff
```

The sample workspace CLI commands were run from `example/full-event`. `push` was not run because
it writes the configured RPG Maker MV Project Root. The generated sample workspace state was
removed after verification.

## Done When

- [x] Acceptance criteria pass.
- [x] Verification commands pass or skipped reason is documented.
- [x] Design references remain satisfied.
- [x] No unrelated scope was added.
