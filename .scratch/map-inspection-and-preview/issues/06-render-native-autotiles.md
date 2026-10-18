# 06: Render Native MV Autotiles at a Fixed Frame

**What to build:** Map previews render native MV automatic terrain, water, wall, and roof tile shapes accurately enough to recognize the actual scene.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Native autotile sheets and shape composition produce correct representative edges, corners, interiors, walls, and roofs.
- [x] Animated native tiles use a deterministic fixed frame recorded in preview metadata.
- [x] Existing source selection, asset provenance, strict errors, artifact publication, and bounded-output behavior also apply to autotile maps.
- [x] Independent native-MV visual references and controlled fixtures verify observable composition through public rendering results.


## Verification

- Adapted native MV floor (48), wall (16), and waterfall (4) shape tables and A1–A4 atlas placement; water and waterfall choose frame zero, matching metadata.
- A2 table quarters preserve native underlay, qy=1 X remapping, and 12-pixel source overlay. Exposed only internal table-edge drawing for ticket 07 to apply neighbor/layer rules.
- Workspace rendering tests use a hand-authored pixel ledger independent of production lookup tables: 20 representative atlas/shape cases plus A2 table half-row checks, invalid wall/waterfall shape errors, generated/snapshot fixed-frame agreement, real image hashes, and strict missing-autotile-image publication invariants.
- Preserved upstream MIT notice and full permission text in THIRD_PARTY_NOTICES.md, included in published package files and verified with npm pack --dry-run.
- Validation: 23 focused map-render/autotile/architecture tests, TypeScript, lint, formatting, and package build passed.
