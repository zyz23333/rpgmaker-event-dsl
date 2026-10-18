# 08: View Crops and Bounded Overviews with Coordinates

**What to build:** An agent can move from a bounded overview to a clearly labeled crop and translate image positions back to exact original map coordinates.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Full-map overviews and explicit crops work through CLI and Workspace rendering with validated zero-based original-map bounds.
- [ ] Grid/coordinate aids are enabled by default and can be disabled; map-content pixel bounds account for label margins.
- [ ] Actual scale and cell-to-pixel transform match rendered pixels for overview resizing and local detail.
- [ ] Looping maps show one definition rectangle and report looping properties; invalid bounds fail instead of clipping or wrapping.
- [ ] Large maps remain within output budgets or return resource errors before wasteful allocation; public tests verify image/metadata agreement.
