# 07: Render Upper Layers, Shadows, and Parallax

**What to build:** Map previews preserve native-static layering, overhead tiles, shadows, and parallax so entrances and structures are visually interpretable.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Ordinary tile layering and upper-display flags follow native-static order rather than flattening layers incorrectly.
- [ ] Native shadow data and parallax assets contribute at the appropriate placement and layer, with separate actual asset provenance.
- [ ] Missing required parallax imagery follows strict asset errors without silent blank substitution.
- [ ] Public rendering and independent native-MV visual checks verify representative overlap, transparency, shadow, and parallax scenes while leaving project scripts unexecuted.
