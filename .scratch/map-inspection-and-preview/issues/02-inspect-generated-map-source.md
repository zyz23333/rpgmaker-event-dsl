# 02: Observe Generated Maps with Verified Source Routing

**What to build:** An author or agent can explicitly observe generated map lists and summaries, verify current compilation state, and distinguish generated map content from baseline supporting definitions.

**Blocked by:** [01: Select a Map and Inspect Its Snapshot Summary](01-inspect-snapshot-map-summary.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Generated listing and summary reads require Generated Freshness and generated-file integrity, including failures for missing, stale, altered, or interrupted state.
- [ ] Generated map/event carriers remain authoritative; baseline-snapshot map-directory and tileset definitions supply non-generated supporting data.
- [ ] Generated system definitions and common events are selected where related detail requires them, and every actual data input reports its source and content hash.
- [ ] No failure falls back to snapshot map/event content, implicitly Compiles, Pulls, Pushes, or executes Definition Source.
- [ ] CLI and Workspace behavior agree, with integration tests for source selection, routing, explicit identity, and unchanged synchronization state.
