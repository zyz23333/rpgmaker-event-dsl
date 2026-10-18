# 09: Render Event Images, Markers, and Preview Pages

**What to build:** An author or agent can locate visible and invisible events, inspect selected event appearances, and distinguish those preview choices from runtime activation.

**Blocked by:** [03: Inspect Map Event Pages and Commands](03-inspect-event-pages-and-commands.md); [07: Render Upper Layers, Shadows, and Parallax](07-render-map-layers-and-parallax.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Render character and tile event images at definition positions using correct native-static layering and chosen page definitions.
- [ ] Default each event to page one and support repeated explicit per-event overrides, rejecting invalid or duplicate choices.
- [ ] Event-ID markers are enabled by default, remain available for image-free events, and can be hidden without hiding actual event images.
- [ ] Metadata records Preview Page choices without claiming runtime page activation or simulating switches and variables.
- [ ] Generated images and markers reflect compiled content without snapshot merging or inherited appearance; public/visual tests cover these differences.
