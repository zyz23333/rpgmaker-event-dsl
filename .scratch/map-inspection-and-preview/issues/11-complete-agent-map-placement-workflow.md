# 11: Deliver the Agent Map Placement Workflow and Acceptance

**What to build:** An author can give an entrance-placement task to an agent, have it observe the scene and inspect precise coordinates, then review compiled placement and Diff using the documented workflow.

**Blocked by:** [04: Inspect Map Cells, Areas, and Tile Flags](04-inspect-map-cells-and-areas.md); [06: Render Native MV Autotiles at a Fixed Frame](06-render-native-autotiles.md); [08: View Crops and Bounded Overviews with Coordinates](08-render-crops-and-coordinate-overlays.md); [09: Render Event Images, Markers, and Preview Pages](09-render-event-appearance-and-pages.md); [10: Render Explicitly Incomplete Previews for Unavailable Assets](10-render-explicit-incomplete-previews.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Update the existing Agent Event Authoring Skill and user-facing guidance to match delivered commands, sources, page choices, and incomplete-output handling.
- [ ] Complete an end-to-end controlled entrance-placement scenario using map discovery, overview/crop and targeted detail, DSL authoring, Compile Check, Compile, generated-position review, and Diff.
- [ ] Verify cross-feature behavior, including placeholders for event/autotile/parallax assets, crop mappings with event images, generated source fidelity, and explicit source provenance.
- [ ] Finish independent native-static visual coverage and use a suitable real local project for an additional visual check where available.
- [ ] Preserve the existing explicit Push instruction boundary and avoid runtime passability or trigger guarantees.
- [ ] Run required repository checks and package-build verification; keep the public source graph acyclic and existing compiler/decompiler/reference behavior unchanged.
