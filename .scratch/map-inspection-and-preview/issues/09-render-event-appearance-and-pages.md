# 09: Render Event Images, Markers, and Preview Pages

**What to build:** An author or agent can locate visible and invisible events, inspect selected event appearances, and distinguish those preview choices from runtime activation.

**Blocked by:** [03: Inspect Map Event Pages and Commands](03-inspect-event-pages-and-commands.md); [07: Render Upper Layers, Shadows, and Parallax](07-render-map-layers-and-parallax.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Render character and tile event images at definition positions using correct native-static layering and chosen page definitions.
- [x] Default each event to page one and support repeated explicit per-event overrides, rejecting invalid or duplicate choices.
- [x] Event-ID markers are enabled by default, remain available for image-free events, and can be hidden without hiding actual event images.
- [x] Metadata records Preview Page choices without claiming runtime page activation or simulating switches and variables.
- [x] Generated images and markers reflect compiled content without snapshot merging or inherited appearance; public/visual tests cover these differences.

## Verification

- Public `renderWorkspaceMap` pixel tests use synthetic source images and independently prescribed native MV source rectangles, positions, opacity, and composition results. No renderer helper generates expected pixels.
- Native cases cover ordinary 12-by-8 and single-character 3-by-4 sheets, character index/direction/pattern, leading `!` and `$` in both orders, punctuation inside a normal filename, bottom-center positioning, ordinary six-pixel shift, tile events, z1/z3/z5 priority, bottom-Y and equal-Y creation ordering, and twelve-pixel bush opacity with object/below-priority controls.
- A large object sprite originating outside a crop retains the visible image portions at original map coordinates. Event markers are clipped to the map-content rectangle and omitted for event origins outside the crop.
- First-page defaults, repeated explicit overrides, duplicate/nonexistent/nonpositive/fractional choices, marker defaults and hiding, exact generated events with no borrowed snapshot appearance, live image provenance, and strict/explicitly incomplete character-asset failures are checked at the Workspace seam.
- A real CLI test verifies repeated `--event-page eventID:page`, `--no-grid`, and `--no-events`, retained event images, clean JSON stdout, duplicate rejection, and malformed argument rejection.
- Shared image validation is used by event inspection and rendering. Event images use the ticket 10 asset loader; all drawing honors the ticket 08 native-coordinate viewport. Raster/image-library objects remain private.
- Full repository package tests: 26 suites / 232 tests passed. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm build` passed. Project scripts and Definition Source are not executed by observation; authoritative files remain unchanged apart from preview artifacts.
