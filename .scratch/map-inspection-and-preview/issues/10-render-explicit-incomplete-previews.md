# 10: Render Explicitly Incomplete Previews for Unavailable Assets

**What to build:** An author or agent can explicitly request a diagnostic preview when images are unavailable and recognize every such result as incomplete.

**Blocked by:** [05: Render a Basic Map Preview with Provenance](05-render-basic-map-preview.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Strict rendering remains the default; only explicit placeholder mode relaxes required-image availability/decoding errors.
- [x] Unavailable assets produce visible placeholders and an incomplete notice plus complete:false, typed warnings, and unavailable provenance records without invented hashes.
- [x] Placeholder mode preserves source-state guards, geometry checks, and map-data validation.
- [x] Image-free events remain valid, inspection remains independent of image availability, and failed publication does not leave partial new artifacts.
- [x] Workspace and CLI checks verify visible and structured incompleteness, asset error detail, and unchanged project/synchronization data.

## Verification

- Added explicit `allowMissingAssets` / `--allow-missing-assets` opt-in. A shared private asset loader covers tileset, parallax, and character namespaces and returns visible magenta/dark checker substitutes only for missing, unreadable, or undecodable image bytes.
- Preview metadata uses `complete:false`, typed `map-image-unavailable` warnings with reason/path, and unavailable image provenance without a fabricated hash. Repeated use of one missing image records one diagnostic. Complete image-free scenes retain `complete:true`.
- A final output-pixel red/yellow `INCOMPLETE` banner is visibly readable and leaves bounds/coordinate mapping unchanged; a generated fixture was visually inspected in addition to pixel checks.
- Map/supporting-data/filename/shape, image resource limits, Generated Freshness/integrity, and Interrupted Push guards stay strict. Empty required tileset filenames are malformed data. Missing art does not block structured inspection.
- Integrated ticket 07 and applied the same loader to parallax. Existing atomic two-file publication is preserved; tests verify strict failures, artifact-area failures, and diagnostic reads do not mutate project/synchronization data.
- Validation: 16 focused incomplete-preview tests and full repository suite passed (24 files, 201 tests); TypeScript, lint, formatting, and package build passed.
