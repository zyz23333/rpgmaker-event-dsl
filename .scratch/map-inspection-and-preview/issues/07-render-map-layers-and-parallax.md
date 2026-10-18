# 07: Render Upper Layers, Shadows, and Parallax

**What to build:** Map previews preserve native-static layering, overhead tiles, shadows, and parallax so entrances and structures are visually interpretable.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Ordinary tile layering and upper-display flags follow native-static order rather than flattening layers incorrectly.
- [x] Native shadow data and parallax assets contribute at the appropriate placement and layer, with separate actual asset provenance.
- [x] Missing required parallax imagery follows strict asset errors without silent blank substitution.
- [x] Public rendering and independent native-MV visual checks verify representative overlap, transparency, shadow, and parallax scenes while leaving project scripts unexecuted.

## Verification

- `renderWorkspaceMap` tests use synthetic PNGs and a hand-authored pixel ledger grounded in native MV `Tilemap._paintTiles`, `_drawShadow`, `_drawTableEdge`, and parallax setup. Expected pixels never call the renderer's layout helpers.
- Representative scenes cover four visual planes, upper-display flags, transparent/opaque overlaps, all four shadow quadrants, later-plane coverage, A2 table-edge shapes and suppression, and all four map loop settings. Cropped table-neighbor coverage is part of ticket 08's original-coordinate viewport work.
- Parallax tests verify bitmap repetition from fixed map origin/time zero, transparency over the bitmap, actual live image paths/hashes, unchanged Compile Baseline and synchronization state, strict missing/undecodable asset failures without partial artifacts, and unexecuted project scripts.
- Focused rendering suites: `map-layers`, `map-autotile`, and `map-render` — 28 tests passed. Architecture suite — 2 tests passed. `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
- Composition retains explicit native z1/z3 and z5 positions for event rendering in ticket 09. Ticket 08 bounds viewport/parallax work for large maps and crops.
