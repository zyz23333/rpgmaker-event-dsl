# Slice 06: Compile Materialization And Compile Baseline

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../workspace-compile-push-model-design.md`
- PRD: `../workspace-compile-push-model-prd.md`

## Blocked By

- Slice 05: Compile Check Workflow

## Purpose

Make normal `compile` produce complete Generated Project Data and Sync Manifest metadata that later diff and push can trust.

## Scope

### In

- Materialize complete carrier output for Event Data Store and System Data variable/switch domains.
- Carry forward non-owned domains from Project Data Snapshot.
- Represent Snapshot-Only Owned Entries as destructive absence in generated output.
- Produce dense MV ID arrays with explicit hole values.
- Write Generated Project Data into Workspace Data State.
- Write generated output hashes and Compile Baseline metadata to Sync Manifest.

### Out

- Human-readable diff output.
- Push Project Root writes.
- Decompile source generation.

## Design References

- Requirements: R-06, R-09, R-11, R-13, R-14
- Decisions: Generated Project Data is complete carrier output; Compile Baseline includes sources, config, and snapshot hashes.
- Invariants: Compile never mutates Project Root or Project Data Snapshot; Generated Project Data never uses sparse MV ID arrays.
- Completion Contract: OT-04, OT-06, OUT-04, OUT-05, OUT-06
- Canonical docs: `CONTEXT.md`, ADR-0005, ADR-0006, `../workspace-compile-push-model-design.md`

## Code Context

- `packages/rmmv-event-dsl/src/events.ts` compiles individual map/common events but currently receives `nextId`.
- `packages/rmmv-event-dsl/src/writer.ts` writes stable JSON.
- `packages/rmmv-event-dsl/src/project.ts` parses project data needed for carrier files.

## What To Build

Implement normal `compile` as source-to-generated-state materialization. It should create whole carrier files for the DSL-owned domains, compute Compile Baseline metadata, and leave Project Root and snapshot untouched.

## Acceptance Criteria

- [ ] `compile` fails when no Project Data Snapshot exists.
- [ ] `compile` writes Generated Project Data carrier files for all DSL-Owned Project Data domains.
- [ ] Generated map carrier output covers every map referenced by `MapInfos.json`.
- [ ] Generated `CommonEvents.json` writes entries by explicit ID.
- [ ] Generated `System.json` writes variable/switch names by explicit ID.
- [ ] Non-owned domains in carrier files are copied from snapshot.
- [ ] Event/CommonEvents arrays are dense and use `null` holes.
- [ ] System variable/switch arrays are dense and use `""` holes.
- [ ] Sync Manifest records generated file hashes.
- [ ] Sync Manifest records Compile Baseline hashes for discovered source files, relevant config fields, and snapshot input files.
- [ ] Changing source, config, or snapshot makes generated output stale.

## Implementation Notes

Be explicit about array lengths: preserve at least snapshot length and extend to highest generated ID plus one. Do not rely on JavaScript sparse array serialization.

## Suggested Task Plan

1. Add workflow and pure materialization tests.
2. Add carrier materialization helpers for maps, common events, and system data.
3. Add Compile Baseline hashing.
4. Wire normal `compile` and manifest updates.
5. Run focused verification.

## Verification Commands

```bash
pnpm --filter @rmmv-event-dsl/core test -- workflow.test.ts events.test.ts project.test.ts
pnpm --filter @rmmv-event-dsl/core typecheck
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
