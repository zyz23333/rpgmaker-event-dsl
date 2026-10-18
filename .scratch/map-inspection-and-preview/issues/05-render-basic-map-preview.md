# 05: Render a Basic Map Preview with Provenance

**What to build:** An author or agent can render a map containing supported ordinary tiles into a real PNG and matching metadata through the CLI and Workspace interface, using project images without launching MV.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Select an image-processing dependency compatible with the package runtime and installation model, and expose no image-library types publicly.
- [ ] Render controlled ordinary-tile scenes from both sources and publish PNG/metadata artifacts with absolute locations, dimensions, bounds, mapping, native-static target, and actual data/image hashes.
- [ ] Required images are read on demand from configured Project Root; intentionally absent event images are not missing assets.
- [ ] Missing or undecodable required images fail strict rendering actionably, and failures leave no newly published partial artifacts.
- [ ] Keep rendered output bounded before large canvas allocation, preserve authoritative data, and test through public functions with focused CLI checks.
- [ ] Until later visual slices land, explicitly reject unimplemented visual features that would otherwise produce a falsely complete preview.
