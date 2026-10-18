# 02: Observe Generated Maps with Verified Source Routing

**What to build:** An author or agent can explicitly observe generated map lists and summaries, verify current compilation state, and distinguish generated map content from baseline supporting definitions.

**Blocked by:** [01: Select a Map and Inspect Its Snapshot Summary](01-inspect-snapshot-map-summary.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Generated listing and summary reads require Generated Freshness and generated-file integrity, including failures for missing, stale, altered, or interrupted state.
- [x] Generated map/event carriers remain authoritative; baseline-snapshot map-directory and tileset definitions supply non-generated supporting data.
- [x] Generated system definitions and common events are selected where related detail requires them, and every actual data input reports its source and content hash.
- [x] No failure falls back to snapshot map/event content, implicitly Compiles, Pulls, Pushes, or executes Definition Source.
- [x] CLI and Workspace behavior agree, with integration tests for source selection, routing, explicit identity, and unchanged synchronization state.

## Verification

- Reused the existing generated-file integrity and Compile Baseline freshness guards for every generated map operation. Observation discovers and hashes source files without evaluating Definition Source. Missing generated files and snapshot inputs produce corrective workflow errors.
- Added the typed internal `MapObservationContext` and `readWorkspaceMapDataInput` routing helper: generated map carriers, `System.json`, and `CommonEvents.json` use Generated Project Data; map-directory, tileset, and other supporting definitions use the baseline snapshot. Every returned input includes its actual source, absolute path, and byte hash, verified against the relevant generated or baseline manifest entry after reading. Ticket 03 can use this helper when related event details need System/Common Event definitions.
- Exercised real compilation and observation through the public Workspace seam. Verified generated event-domain replacement, preserved snapshot content, duplicate map identities, source-specific provenance, missing generated state/carriers, changed source/config/snapshot inputs, altered map/System/Common Event files, missing supporting inputs, and pending Interrupted Push. Successful and failing observations preserve all authoritative Workspace bytes.
- Exercised generated source selection and integrity failure through a real CLI subprocess, including clean JSON stdout on success and empty stdout on failure.
- `pnpm check` passed: typecheck, lint, format, and all 16 test files / 136 tests.
- `pnpm build` passed.
