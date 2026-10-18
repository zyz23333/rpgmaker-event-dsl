# 04: Inspect Map Cells, Areas, and Tile Flags

**What to build:** An agent can inspect exact cells and rectangular areas to obtain nearby events, tile layers, and readable map flags before choosing a placement.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Cell results report per-layer tile IDs, Region ID, Terrain Tag, raw flags, and readable directional/upper-layer/ladder/bush/counter/damage meanings.
- [ ] Area results include requested cells and events whose definition positions lie inside the rectangle, using original zero-based map coordinates.
- [ ] Out-of-bounds or invalid geometry and incompatible event/cell/area selectors fail explicitly rather than clamp or wrap.
- [ ] Both data sources use the verified routing contract, and image files are not required.
- [ ] CLI and Workspace tests verify boundary coordinates and source-dependent data without final passability, reachability, or invented semantic labels.
