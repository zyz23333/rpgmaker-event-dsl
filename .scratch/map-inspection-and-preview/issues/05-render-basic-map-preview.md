# 05: Render a Basic Map Preview with Provenance

**What to build:** An author or agent can render a map containing supported ordinary tiles into a real PNG and matching metadata through the CLI and Workspace interface, using project images without launching MV.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Select an image-processing dependency compatible with the package runtime and installation model, and expose no image-library types publicly.
- [x] Render controlled ordinary-tile scenes from both sources and publish PNG/metadata artifacts with absolute locations, dimensions, bounds, mapping, native-static target, and actual data/image hashes.
- [x] Required images are read on demand from configured Project Root; intentionally absent event images are not missing assets.
- [x] Missing or undecodable required images fail strict rendering actionably, and failures leave no newly published partial artifacts.
- [x] Keep rendered output bounded before large canvas allocation, preserve authoritative data, and test through public functions with focused CLI checks.
- [x] Until later visual slices land, explicitly reject unimplemented visual features that would otherwise produce a falsely complete preview.


## Verification

- Added portable pure-JavaScript pngjs 7 with development-only TypeScript declarations; public Workspace declarations expose domain results only.
- Public Workspace tests inspect PNG pixels for independent ordinary A5/B/C/D/E atlas fixtures, snapshot/generated routing, image-free events, exact byte hashes, replaced image bytes, and unchanged authoritative files/Compile Baseline.
- Strict missing, corrupt, undersized, and oversized images fail without new artifacts. Native features delegated to tickets 06–09 are rejected explicitly until implemented; oversized output fails before allocation until ticket 08 adds bounded overview scaling.
- Focused CLI tests verify clean JSON, human-readable dimensions, and absolute artifact locations. Publication stages both files then renames the containing directory atomically.
- Validation: targeted map/architecture suites passed (39 tests before the additional oversized-image case); render suite passed (16 tests), TypeScript, lint, formatting, and package build passed. Full repository suite passed: 17 files, 152 tests.
