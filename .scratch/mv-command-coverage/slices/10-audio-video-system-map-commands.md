# Slice 10: Audio, Video, System, and Map Commands

## Status

Ready

## Type

vertical

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 02: Shared Command Input Primitives
- Slice 03: Decompiler Completion Harness

## Purpose

Complete MV Audio & Video, System Settings, and Map command families, including asset-bearing command inputs.

## Scope

### In

- Audio/video helpers: BGM, BGS, ME, SE, movie.
- System setting helpers: battle/victory/defeat/vehicle audio and access toggles.
- Map helpers: map name display, tileset, battleback, parallax, location info.
- Asset Reference compilation/decompilation for audio, image, and movie payloads.
- Tileset Project Data Reference support for `Change Tileset`.

### Out

- Asset scanning.
- Plugin-specific audio/image behavior.
- Actor/Enemy/Scene Control command families.
- Runtime Selector modeling beyond the minimum needed for map location and picture-position commands.

## Design References

- Requirements: REQ-01, REQ-04, REQ-05
- Decisions: use `audioAsset`, `imageAsset`, `movieAsset`; assets are no-scan; `tilesetRef` is the Project Data Reference for `Change Tileset`.
- Invariants: Asset References never resolve to project data IDs; Runtime Selectors do not resolve through the Staged Data Graph; Project Data References still resolve through normal graph.
- Completion Contract: OUT-03, OT-05
- Canonical docs: `../mv-command-coverage-design.md`, MV `command132` through `command140`, `command241` through `command285`

## Code Context

No asset reference helpers exist yet before Slice 02. `buildSnapshotReferenceInput` already supports some database references but not tilesets; this slice must add `tilesetRef` support and the corresponding snapshot extraction if the standard project data already includes `Tilesets.json`.

## What To Build

Implement these command families with correct MV parameter shapes, no-scan asset references, and decompile rendering.

## Acceptance Criteria

- [ ] Audio commands compile/decompile with MV AudioFile objects.
- [ ] Movie command uses `movieAsset` and compiles to the MV filename stem.
- [ ] System setting commands compile/decompile access toggles and audio settings.
- [ ] Map commands compile/decompile display, tileset, battleback, parallax, and location info behavior.
- [ ] No implementation scans audio/img/movie directories.
- [ ] `tilesetRef` is the only project data reference used for `Change Tileset`.

## Implementation Notes

If a command needs a Project Data Reference kind not currently present, add only the reference kind needed by the MV command and corresponding snapshot extraction if the standard data file is already part of the snapshot model. Do not model runtime target selectors or asset names as Project Data References.

## Suggested Task Plan

1. Add tests for representative audio, video, system, and map commands.
2. Add any missing reference kinds and asset payload helpers required by this slice.
3. Implement compiler/decompiler handlers.
4. Add validation for references and asset namespaces.

## Verification Commands

```bash
pnpm --filter rpgmaker-event-dsl test -- events.test.ts staged-graph.test.ts workflow.test.ts
pnpm --filter rpgmaker-event-dsl typecheck
pnpm lint
pnpm format:check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
