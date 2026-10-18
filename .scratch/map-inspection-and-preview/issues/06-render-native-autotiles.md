# 06: Render Native MV Autotiles at a Fixed Frame

**What to build:** Map previews render native MV automatic terrain, water, wall, and roof tile shapes accurately enough to recognize the actual scene.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Native autotile sheets and shape composition produce correct representative edges, corners, interiors, walls, and roofs.
- [ ] Animated native tiles use a deterministic fixed frame recorded in preview metadata.
- [ ] Existing source selection, asset provenance, strict errors, artifact publication, and bounded-output behavior also apply to autotile maps.
- [ ] Independent native-MV visual references and controlled fixtures verify observable composition through public rendering results.
