# 11: Deliver the Agent Map Placement Workflow and Acceptance

**What to build:** An author can give an entrance-placement task to an agent, have it observe the scene and inspect precise coordinates, then review compiled placement and Diff using the documented workflow.

**Blocked by:** [04: Inspect Map Cells, Areas, and Tile Flags](04-inspect-map-cells-and-areas.md); [06: Render Native MV Autotiles at a Fixed Frame](06-render-native-autotiles.md); [08: View Crops and Bounded Overviews with Coordinates](08-render-crops-and-coordinate-overlays.md); [09: Render Event Images, Markers, and Preview Pages](09-render-event-appearance-and-pages.md); [10: Render Explicitly Incomplete Previews for Unavailable Assets](10-render-explicit-incomplete-previews.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Update the existing Agent Event Authoring Skill and user-facing guidance to match delivered commands, sources, page choices, and incomplete-output handling.
- [x] Complete an end-to-end controlled entrance-placement scenario using map discovery, overview/crop and targeted detail, DSL authoring, Compile Check, Compile, generated-position review, and Diff.
- [x] Verify cross-feature behavior, including placeholders for event/autotile/parallax assets, crop mappings with event images, generated source fidelity, and explicit source provenance.
- [x] Finish independent native-static visual coverage and use a suitable real local project for an additional visual check where available.
- [x] Preserve the existing explicit Push instruction boundary and avoid runtime passability or trigger guarantees.
- [x] Run required repository checks and package-build verification; keep the public source graph acyclic and existing compiler/decompiler/reference behavior unchanged.

## Verification

- Updated the Distributable Skill Source, its disclosed map-observation reference and CLI/safety guidance, root README, and published package README. Guidance covers explicit map identity, original coordinates, snapshot/generated routing, Preview Pages (`--event-page EVENT_ID:PAGE`), independent overlay toggles, live image provenance, and explicit incomplete output. The existing explicit Push and destructive-entry confirmation boundaries remain in force.
- Added two public Workspace acceptance scenarios in `packages/rpgmaker-event-dsl/test/map-placement-workflow.test.ts`. The controlled 7 by 6 entrance scene discovers duplicate map names by ID, identifies its path and entrance in overview/crop, inspects the candidate cell/area and nearby guard, authors event 2 at original `(3,2)`, proves Compile Check writes nothing, compiles, verifies generated identity/position/image-free page/marker and removal of snapshot art, then reviews Diff. Project Root and Project Data Snapshot remain unchanged.
- The mixed-asset crop scenario verifies strict failure publishes no partial artifacts and explicit placeholder mode preserves cropped A2 autotile, parallax, tile-event, and character-event diagnostics with four unavailable inputs and no fabricated hashes. Generated rendering retains only its two required map-image inputs and generated map provenance, without restoring the removed snapshot events/images.
- Existing independent literal native-MV quarter/pixel tests and the event-appearance suite cover A1-A4 fixed-frame shapes, A2 table edges, native tile/shadow/event priorities, frame selection, anchors, bush opacity, crop-external sprites, Preview Page overrides, sorting, markers, and source fidelity. The new acceptance tests reuse the public Workspace seam and require no change to compiler, decompiler, reference resolution, or rendering behavior.
- Additional real local visual acceptance used `references/rmmv-test-project` through the already-cloned validation Workspace, without executing game or plugin scripts. Independently assembled the native A2 shape0 quarter ledger plus Actor3 down/pattern0 and People3 right/pattern1 frames with native bottom-center anchors and six-pixel shifts: **509,184 pixels compared, zero differences** against the overlay-free 816 by 624 preview. Visually inspected this native result and the original-coordinate crop with grid/markers.
- Retained local real-project artifacts (ignored; no local image assets were committed):
  - `F:/Shuen/RPG/rpgmaker-event-dsl/demo_artifacts/map-preview-validation/acceptance-11/native.png` and `native.metadata.json`.
  - `F:/Shuen/RPG/rpgmaker-event-dsl/demo_artifacts/map-preview-validation/acceptance-11/overview.png` and `overview.metadata.json`.
  - `F:/Shuen/RPG/rpgmaker-event-dsl/demo_artifacts/map-preview-validation/acceptance-11/crop.png` and `crop.metadata.json`.
  - The same directory contains `expected-native.png` and `verification.json`; reusable independent comparison script: `C:/Users/Shuen/.codex/map-preview-native-acceptance.mts`.
- `pnpm check` passed: typecheck, lint, format check, and **27 test files / 234 tests**, including the source-graph architecture checks and existing compiler/decompiler/reference suites. `pnpm build` passed.
- Packed the built release with `pnpm pack`, installed the tarball offline in independent `C:/Users/Shuen/.codex/map-preview-package-acceptance`, and verified the root/Workspace exports, all three installed map subcommand help outputs, public declarations with strict NodeNext TypeScript, API/CLI PNG and metadata output, repeated Preview Pages/overlay flags, clean JSON, and duplicate-override errors with empty stdout. Report: `C:/Users/Shuen/.codex/map-preview-package-acceptance/verification.json`.
- This ticket completes workflow/documentation/acceptance delivery. The parent spec remains open for the integration branch's final independent code review and any resulting fixes.
