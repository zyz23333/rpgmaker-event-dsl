# 10: Render Explicitly Incomplete Previews for Unavailable Assets

**What to build:** An author or agent can explicitly request a diagnostic preview when images are unavailable and recognize every such result as incomplete.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Strict rendering remains the default; only explicit placeholder mode relaxes required-image availability/decoding errors.
- [ ] Unavailable assets produce visible placeholders and an incomplete notice plus complete:false, typed warnings, and unavailable provenance records without invented hashes.
- [ ] Placeholder mode preserves source-state guards, geometry checks, and map-data validation.
- [ ] Image-free events remain valid, inspection remains independent of image availability, and failed publication does not leave partial new artifacts.
- [ ] Workspace and CLI checks verify visible and structured incompleteness, asset error detail, and unchanged project/synchronization data.
