# 04: Inspect Map Cells, Areas, and Tile Flags

**What to build:** An agent can inspect exact cells and rectangular areas to obtain nearby events, tile layers, and readable map flags before choosing a placement.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Cell results report per-layer tile IDs, Region ID, Terrain Tag, raw flags, and readable directional/upper-layer/ladder/bush/counter/damage meanings.
- [x] Area results include requested cells and events whose definition positions lie inside the rectangle, using original zero-based map coordinates.
- [x] Out-of-bounds or invalid geometry and incompatible event/cell/area selectors fail explicitly rather than clamp or wrap.
- [x] Both data sources use the verified routing contract, and image files are not required.
- [x] CLI and Workspace tests verify boundary coordinates and source-dependent data without final passability, reachability, or invented semantic labels.

## Verification

- Public Workspace red/green slices in `test/map-cells.test.ts` cover four visible tile planes, raw flags and all requested meanings, shadow data, numeric Region ID, native topmost nonzero Terrain Tag, boundary coordinates, row-major area cells, definition-position event filtering, looping-map geometry rejection, strict selector combinations, and unavailable flag entries.
- Image-free temporary Workspaces verify snapshot/generated event-domain replacement, generated map input provenance with baseline-snapshot supporting definitions, generated integrity guards, and unchanged authoritative files.
- Focused CLI coverage in `test/map-cells-cli.test.ts` verifies `--cell X,Y`, `--area X,Y,width,height`, snapshot/generated source selection, readable numeric tile information, invalid tuples and mutually exclusive selectors with empty JSON stdout.
- After merging the integration branch's event and basic-preview work, the eight focused map observation/generated/event/cell/preview/architecture suites pass (58 tests). Workspace typecheck, changed-file lint, formatting, and `git diff --check` pass. CLI checks also cover event/cell/area mutual exclusions and command detail with a cell selector.
