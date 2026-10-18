# 08: View Crops and Bounded Overviews with Coordinates

**What to build:** An agent can move from a bounded overview to a clearly labeled crop and translate image positions back to exact original map coordinates.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Full-map overviews and explicit crops work through CLI and Workspace rendering with validated zero-based original-map bounds.
- [x] Grid/coordinate aids are enabled by default and can be disabled; map-content pixel bounds account for label margins.
- [x] Actual scale and cell-to-pixel transform match rendered pixels for overview resizing and local detail.
- [x] Looping maps show one definition rectangle and report looping properties; invalid bounds fail instead of clipping or wrapping.
- [x] Large maps remain within output budgets or return resource errors before wasteful allocation; public tests verify image/metadata agreement.

## Verification

- Public Workspace red/green slices in `test/map-viewport.test.ts` verify native-detail crops, original-coordinate labels and transforms, default grid margins, bounded 4096-pixel overviews with/without labels, actual PNG dimensions and boundary colors, looping metadata, and invalid rectangle errors without new artifacts.
- CLI coverage verifies `--crop X,Y,width,height`, `--no-grid`, human bounds/artifact output, clean JSON, and malformed tuple errors.
- Native drawing maps directly into the bounded target raster; it does not allocate a full native-size scene before resizing. Native quarter tiles, shadow masks, and later event sprites share the same transformed blit seam.
- A 1000 x 500-cell scene with a 1 x 1-pixel repeating parallax verifies bounded output work. The previous native-repetition loop timed out after 8 seconds; output-pixel sampling passes while retaining original-map phase. `test/map-layers.test.ts` also verifies cropped parallax phase and the table lip supplied by a neighbor outside crop bounds.
- Focused viewport, ordinary-tile, autotile, layer, and architecture suites pass. Workspace typecheck, changed-file lint/format, and `git diff --check` pass.
