# Map Inspection and Map Preview

Status: resolved
Category: enhancement

## Problem Statement

An author using an agent to create RPG Maker MV events needs the agent to understand the map where those events belong. Event definitions and raw project data can identify event coordinates, but do not provide an efficient view of roads, entrances, buildings, existing characters, or the surrounding scene. Without that context, the author must repeatedly describe the map or supply coordinates manually, and placement mistakes are difficult to catch before applying changes.

The author also needs to distinguish the captured Project Data Snapshot from Generated Project Data. A preview of the wrong source can conceal event removals, stale compilation, or differences between existing event images and what the DSL actually generates. Images alone cannot supply precise coordinates, page conditions, or source provenance, while an unbounded dump of map cells and event commands is expensive for an agent to interpret.

The feature must make map observation useful without requiring editor automation, a running game, or a change to the established Compile, Diff, and Push workflow.

## Solution

Provide structured Map Inspection and native-static Map Preview for a Selected Map identified by its explicit MV map ID. Agents can list maps, inspect summaries and targeted details, view a full-map overview, and request a detailed crop before choosing coordinates. After authoring and compiling events, agents can inspect the generated map and verify event placement before continuing the existing Diff review.

Deliver the feature through the existing CLI and reusable Workspace functions. Support both Project Data Snapshot and Generated Project Data, defaulting to the snapshot and identifying the observed source. Render native MV tiles, autotiles, layers, shadows, parallax, and defined event appearances into a PNG with coordinate and event aids, accompanied by structured provenance and cell-to-pixel metadata.

Use the existing Project Root for required Map Image Assets without launching MV or executing project scripts. Keep event-page selection explicit, distinguish incomplete asset diagnostics from complete previews, and preserve all existing data ownership and write rules. Integrate the new observation workflow into the existing Agent Event Authoring Skill.

## User Stories

1. As an event author, I want the agent to list maps with their numeric IDs, names, and parent relationships, so that it can find the map relevant to my request.
2. As an event-authoring agent, I want to select a map by explicit ID even when names are duplicated, so that I inspect and edit the intended map.
3. As an event author, I want the Selected Map to follow the task or Event Definition, so that an unrelated editor selection or player location does not redirect the agent.
4. As an event-authoring agent, I want snapshot observation to be the default, so that I can inspect the established authoring baseline predictably.
5. As an event-authoring agent, I want to explicitly inspect Generated Project Data, so that I can check the result of my DSL changes before Push.
6. As an event author, I want every result to identify its data source and map identity, so that I can tell which state the agent used.
7. As an event-authoring agent, I want a map summary with dimensions, tileset, settings, and event positions, so that I can orient myself without reading the complete raw map.
8. As an event-authoring agent, I want each event's pages, conditions, triggers, and image definitions, so that I can understand existing event structure near a proposed placement.
9. As an event-authoring agent, I want command summaries by default and complete commands on request, so that I can investigate behavior without loading every command unnecessarily.
10. As an event author, I want unknown command records to remain identifiable and preserved in detailed inspection, so that the agent does not invent unsupported behavior.
11. As an event-authoring agent, I want to query one Map Cell, so that I can obtain exact tile-layer IDs, Region ID, Terrain Tag, and tile flags for a candidate coordinate.
12. As an event-authoring agent, I want to inspect a rectangular area and its events, so that I can investigate the vicinity of an entrance, path, or building.
13. As an event author, I want tile flags explained without a final passage claim, so that static information is not mistaken for proof that the player can walk through a location.
14. As an event-authoring agent, I want Region IDs and Terrain Tags reported without invented meanings, so that I use project-specific conventions only when they are known.
15. As an event author, I want a recognizable native-static map overview, so that the agent can understand the spatial layout of the scene.
16. As an event author, I want autotiles, upper layers, shadows, and parallax represented correctly, so that visual placement decisions reflect the native map definition.
17. As an event-authoring agent, I want character and tile event images drawn when the selected data defines them, so that existing visual landmarks remain recognizable.
18. As an event-authoring agent, I want invisible events to have optional ID markers, so that I can locate interactions and triggers that have no image.
19. As an event author, I want coordinate and grid aids enabled by default, so that positions in the preview can be translated into event coordinates precisely.
20. As an event author, I want to hide inspection overlays while retaining event images, so that I can inspect the native static scene clearly.
21. As an event-authoring agent, I want local crops to retain original map coordinates, so that I do not write crop-relative positions into an Event Definition.
22. As an event-authoring agent, I want invalid cells and out-of-bounds crops rejected, so that the tool does not silently inspect a different area than requested.
23. As an event author, I want large-map overviews bounded in size and local views to preserve useful detail, so that previews remain practical to view.
24. As an event-authoring agent, I want the exact cell-to-pixel transform and image dimensions, so that scaled images and label margins do not introduce coordinate errors.
25. As an event author, I want looping maps shown as one definition rectangle with their loop properties identified, so that the preview has predictable bounds.
26. As an event-authoring agent, I want a deterministic first-page default for event appearance, so that a static preview is usable without runtime state.
27. As an event-authoring agent, I want to override the Preview Page for individual events, so that I can inspect an opened chest or another defined appearance.
28. As an event author, I want chosen Preview Pages reported separately from runtime activation, so that the agent does not claim a page is active without evidence.
29. As an event author, I want generated previews to show what the compiler actually produced, so that missing event images or removed events are not concealed by snapshot fallback.
30. As an event-authoring agent, I want invalid event-page overrides rejected, so that each rendered appearance corresponds to an existing event and page.
31. As an event author, I want Map Image Assets read from the configured Project Root, so that previewing works without a new asset-copying workflow.
32. As an event author, I want asset paths and hashes recorded separately from map-data provenance, so that I can identify the inputs behind a preview.
33. As an event author, I want a replaced image to be reflected in a new preview and provenance record, so that unchanged map data does not conceal changed art.
34. As an event author, I want image reads to leave Clone, Pull, and Compile Baseline unchanged, so that map observation does not expand synchronization responsibilities.
35. As an event-authoring agent, I want strict rendering to report unavailable or unreadable required assets, so that I do not mistake missing art for empty map space.
36. As an event-authoring agent, I want an explicit placeholder mode with visible incomplete status and structured warnings, so that I can diagnose asset problems while understanding the result's limitations.
37. As an event-authoring agent, I want structured inspection to work without image files, so that missing art does not block coordinate and event analysis.
38. As an event author, I want intentionally image-free events treated as valid, so that normal invisible triggers do not cause asset errors.
39. As an event author, I want stale generated state rejected, so that the agent cannot verify placement against an outdated compilation.
40. As an event author, I want altered generated files rejected through integrity checks, so that manually changed output is not presented as the verified compile result.
41. As an event author, I want existing Interrupted Push guards honored, so that observation does not conceal incomplete synchronization.
42. As an event author, I want viewing a map to avoid implicit Pull, Compile, or Push, so that reading does not change my authoring baseline or project state.
43. As an event-authoring agent, I want generated observations to use baseline-snapshot supporting data where appropriate, so that map names and tilesets resolve without replacing generated map or event content.
44. As an event-authoring agent, I want versioned machine-readable output without progress chatter, so that I can consume command results reliably.
45. As an event author, I want readable terminal summaries and absolute preview artifact locations, so that I can inspect results directly.
46. As an event author, I want preview artifacts to identify their source, bounds, page choices, and actual inputs, so that different observations remain distinguishable.
47. As an event author, I want all observation operations to preserve source, snapshot, generated, project, and synchronization data, so that map viewing remains read-only apart from preview artifacts.
48. As an event author, I want static rendering to work through installed package dependencies without browser configuration or game startup, so that the capability fits the existing CLI workflow.
49. As an integrator, I want reusable Workspace functions with domain results rather than image-library objects, so that later integrations can reuse the feature without reproducing rendering rules.
50. As an event author, I want the distributed authoring skill to guide map observation and generated-position review, so that the agent uses the new capability during real event-authoring tasks.
51. As an event author, I want an end-to-end entrance-placement scenario verified alongside visual and query checks, so that delivery demonstrates useful authoring behavior rather than only file generation.

## Implementation Decisions

1. **Domain and compatibility.** Use the glossary's Selected Map, Map Inspection, Map Preview, Map Cell, Map Image Asset, Preview Page, Preview Bounds, and Incomplete Map Preview concepts. Follow the existing Workspace, explicit Entry Identity, Interrupted Push, and map-observation ADRs. Target native RPG Maker MV static map appearance within the existing Node.js 22, TypeScript, and ESM package model.
2. **Primary interface.** Extend the existing Workspace package interface with `listWorkspaceMaps`, `inspectWorkspaceMap`, and `renderWorkspaceMap`. Each operation accepts the existing Workspace-root convention, relevant source and selection options, and returns a typed result without printing. Image-library objects do not appear in public results. Do not add a new package export subpath.
3. **Module responsibilities.** The Workspace module owns prerequisites, source selection, provenance, and artifact publication. The map-observation module owns validated map reading, inspection, Preview Page selection, native drawing, and coordinate mapping. Keep CLI formatting separate and preserve the acyclic source graph. Image loading and raster operations remain internal implementation seams only where actual variation requires them.
4. **Map identity.** Require a positive explicit map ID for inspection and rendering. Derive the Selected Map from the task or Event Definition, with listing available for discovery. Numeric map and event identities remain authoritative when display names are duplicated. Do not infer a map from a filename or introduce a persistent current-map setting.
5. **Observed sources.** All map operations accept `snapshot` or `generated`, defaulting to `snapshot`. The source describes the map/event content being observed. Results identify the source and, where applicable, the Selected Map. Editor changes enter the snapshot through the existing Pull workflow.
6. **Supporting-data routing.** Snapshot observations read snapshot project data. Generated observations read generated map/event carriers, generated system definitions and common events when needed, and baseline-snapshot map-directory, tileset, and other non-generated database definitions. Record every supporting input's actual source. Using baseline supporting data is planned routing; missing, stale, or damaged generated map/event content never falls back to snapshot content.
7. **Workspace guards.** Reuse existing Workspace prerequisites and non-Push Interrupted Push guards. Every generated observation, including map listing, requires Generated Freshness and generated-file integrity. Errors identify the corrective workflow. Observation does not implicitly Pull, Compile, or Push, execute Definition Source, or bypass guards in placeholder mode.
8. **CLI operations.** Add `map list`, `map inspect`, and `map render`. All support source selection and `--json`; inspection and rendering require `--map`. Provide human-readable output without `--json`. Machine-readable stdout contains the result without progress chatter, and PNG bytes are written to artifacts rather than terminal output.
9. **Inspection selectors.** No inspection selector means map summary. `--event`, `--cell`, and `--area` are mutually exclusive detail selectors. `--commands` requires an event selection and includes complete commands for its pages. Use one typed selector in the programmatic interface rather than one exported function per query shape.
10. **Inspection payloads.** Map lists contain IDs, display names, and parent relationships. Summaries contain dimensions, tileset, settings, event identities, names, and positions. Event details include each page's conditions, trigger, image definition, and command summary. Areas include cell details and events whose definition positions lie inside the requested rectangle. Cell details contain per-layer tile IDs, Region ID, Terrain Tag, tile flags, and readable flag meanings. Do not dump all cells and commands by default.
11. **Interpretation limits.** Preserve raw command records in requested full detail and identify unsupported shapes without executing embedded scripts or inventing their meaning. Region IDs and Terrain Tags do not imply semantic labels unless project conventions supply them. Decode directional passage, upper-layer display, ladder, bush, counter, and damage-floor flags without claiming final cell passability or runtime reachability.
12. **Native static rendering.** Implement rendering inside the tool using an image-processing package compatible with the existing runtime and installation model. Render ordinary tiles, autotiles, layer ordering, shadows, parallax, and event images defined by the chosen pages. Animated tiles use a fixed frame. Do not require browser setup, launch MV, or execute project engine and plugin scripts. The image-library choice remains an implementation task within these constraints.
13. **Preview Page rules.** Each event defaults to its first page. Page numbers are one-based. Repeated `--event-page` selections allow explicit per-event overrides; nonexistent events or pages, invalid numbers, and duplicate overrides fail. Report each selected page as a Preview Page, not as the runtime-active page.
14. **Faithful event appearance.** Render the selected source as defined, including image-free events and the generated event list's full-domain replacement semantics. Do not merge missing snapshot events or borrow snapshot images into generated previews. Event markers can identify events with no image. Expanding Event Page appearance fields or changing compile/decompile behavior is outside this feature.
15. **Coordinates and bounds.** Coordinates are zero-based with an upper-left origin, X increasing rightward, and Y increasing downward. Cell coordinates must lie inside the map. Area and crop selections use integer X, Y, width, and height, with positive dimensions and a rectangle wholly inside the map. Reject invalid bounds rather than clamping or silently wrapping. Crops retain original map coordinates. Looping maps show one definition rectangle and report loop properties.
16. **Overlays.** Coordinate and grid aids are enabled together by default. Event-ID markers are independently enabled by default. `--no-grid` hides coordinate/grid aids; `--no-events` hides event markers while retaining actual event images. Together they produce a scene without inspection overlays.
17. **Overview and local output.** Render an overview by default and accept `--crop` for local views. Determine bounded output dimensions before allocating a full-map canvas. Downscale large overviews and preserve useful native detail for local views within the budget. Report actual output dimensions and mapping; resource-limit failures are explicit and never silently clip requested bounds. The numerical output budget remains implementation tuning.
18. **Image assets.** Read required Map Image Assets on demand from the configured Project Root for both sources. Record the paths and hashes of the actual image bytes rendered. Do not snapshot images, change Clone or Pull, extend Compile Baseline, add custom asset roots, or promise recovery of overwritten historical images.
19. **Strict and placeholder modes.** Normal rendering fails with specific asset errors when required images are missing, unreadable, or undecodable. `--allow-missing-assets` permits visible placeholders, a visible incomplete notice, `complete: false`, and typed warnings. This relaxes image-availability errors only. An event with no image is valid. Structured inspection does not depend on image availability.
20. **Versioned results and provenance.** Structured results include a schema version, operation kind, primary source, applicable map identity, actual data-input provenance, and warnings. Distinguish result kinds for lists, summaries, event details, cells, areas, and previews. Hashes describe bytes used in the result rather than an assumed source version.
21. **Preview metadata.** Include PNG and metadata artifact locations, output and original-map dimensions, Preview Bounds, the map-content pixel rectangle excluding label margins, and the original-cell-to-output-pixel transform with scale and offsets. Include the fixed animation frame, Preview Page choices, per-data-input sources and hashes, image provenance, the native-static compatibility target, completeness, and warnings. Unavailable images have an explicit status without fabricated hashes. Complete means complete within the supported static target.
22. **Artifact publication and write scope.** Publish a PNG and matching metadata in the Workspace's dedicated preview artifact area and return absolute artifact locations. Naming distinguishes primary source, bounds, page choices, and actual inputs. Strict failures publish no successful result and leave no newly generated partial artifacts. Observation does not rewrite Project Root data, Project Data Snapshots, Generated Project Data, Definition Source, or synchronization metadata.
23. **Validation.** Reject unknown sources, invalid or nonexistent identities, incompatible inspection selectors, invalid command-detail combinations, malformed required map data, unavailable supporting data, invalid geometry, and invalid page overrides with actionable errors. Image placeholder mode never overrides these validations or source-state guards.
24. **Authoring integration.** Update the existing Agent Event Authoring Skill and relevant user-facing guidance once the operations exist. Guide map discovery, targeted inspection, scene-dependent overview/crop viewing, DSL authoring, Compile Check, Compile, generated-position review, and the existing Diff review. Explain Preview Page and incomplete-image limitations when relevant. Preserve the current requirement for explicit user instruction before Push.
25. **Preserved existing behavior.** Keep compiler, decompiler, Project Data Reference, and no-scan Asset Reference semantics unchanged. Explicit rendering reads image files without turning authoring Asset References into filesystem-scanned references. Existing synchronization and destructive-write checks remain authoritative.

## Testing Decisions

1. **Primary test seam.** Use the existing public Workspace interface as the main seam, exercising listing, inspection, and rendering through the same functions available to callers. The earlier design discussion accepted this testing approach. Use real temporary Workspaces and controlled project inputs; avoid tests that mirror private normalization or drawing steps.
2. **Limited CLI coverage.** Add focused CLI contract and entrypoint checks for command registration, selectors, source choices, page overrides, option errors, machine-readable stdout, human output, and returned artifact locations. Do not duplicate every Workspace behavior test at the CLI seam.
3. **Prior art.** Follow the existing Workspace snapshot, compile, diff, and push workflow integration suites for temporary-project setup, source assertions, freshness/integrity failures, and mutation checks. Follow the Workspace loading and initialization suites for configuration prerequisites, and existing CLI declaration and executable-entrypoint suites for command integration. Retain the existing module-architecture checks.
4. **Realistic fixtures.** Extend the minimal existing project fixtures with complete map dimensions, tile layers, tileset definitions, event pages, and controlled image assets. Use distinguishable colors and corner patterns to make layer order, autotile placement, clipping, and coordinate errors observable. Do not require an unspecified production game to run the automated suite.
5. **Identity and inspection.** Verify duplicate map names remain selectable by ID; summary, event, cell, and area output matches the selected source; command detail is opt-in; unsupported raw command records remain identifiable; and invalid selector combinations fail.
6. **Generated routing and ownership.** Verify generated observations use generated map/event carriers, baseline-snapshot supporting definitions, and generated system/common-event data where applicable, with correct per-input provenance. Verify generated event lists replace the DSL-owned domain rather than merging snapshot events or images.
7. **State guards.** Exercise stale source baselines, altered generated files, missing generated state, and pending Interrupted Push. Verify every generated operation, including map listing, honors the existing checks, and placeholder mode cannot bypass them.
8. **No implicit workflow.** Observe snapshots after editor-side project changes and confirm no implicit Pull occurs. Confirm reads do not Compile, execute Definition Source or project scripts, or fall back to another map/event source after failure.
9. **Page and appearance behavior.** Cover first-page defaults, multiple explicit overrides, invalid and duplicate overrides, condition-bearing pages, character and tile images, and valid image-free events. Verify chosen pages are reported as preview choices without claims of runtime activation.
10. **Asset behavior and provenance.** Verify required assets are read from configured Project Root, actual data and image hashes are recorded separately, and changing image bytes under the same name changes preview provenance without changing Compile Baseline or synchronization state.
11. **Strict and incomplete output.** Verify missing and undecodable assets fail strict rendering without publishing partial new artifacts. Verify explicit placeholder mode produces visible placeholders and incomplete notice with machine-readable warnings and completeness. Verify inspection succeeds without image files and image-free events do not cause missing-asset failures.
12. **Coordinate contract.** Cover boundary cells, valid and invalid crops, preserved original coordinates, positive dimensions, overview scaling, label margins, cell-to-pixel transforms, and looping-map extents. Compare metadata to actual output pixels rather than private transform calls.
13. **Tile information limits.** Verify raw and decoded tile flags and numeric Region/Terrain information without final passability, reachability, or invented semantic labels.
14. **Native visual behavior.** Compare controlled output with independent native-MV reference appearance for ordinary tiles, representative autotile shapes and fixed animation frames, upper layers, shadows, parallax, character/tile event images, page overrides, coordinate aids, and event markers. Keep visual expectations independent of the renderer implementation. Add a real-project visual check when a suitable local project is available.
15. **Output and resource contract.** Verify PNG and metadata agree on source, bounds, dimensions, pages, completeness, artifact locations, and coordinate mapping. Large maps must produce bounded correctly mapped output or a clear resource error, without silent clipping.
16. **Write invariants.** Compare authoritative data and synchronization state before and after successful and failing observations. Only preview artifacts may be created; existing project, snapshot, generated, source, and synchronization data must remain unchanged.
17. **End-to-end authoring.** Identify an entrance using overview and targeted details, choose a coordinate, author an event through the existing DSL, run Compile Check and Compile, verify the generated event identity and position, and review Diff. Account for the current compiler's image-free event pages rather than expecting appearance authoring from this feature.
18. **Completion checks.** Run the repository's required type, lint, format, test, and package-build checks appropriate to the implementation. Confirm the distributed skill and command documentation match the delivered interface. Do not treat successful PNG encoding alone as feature acceptance.

## Out of Scope

- Following the MV editor's currently open map, editor automation, or inspection of unsaved editor changes.
- Runtime player location, live screenshots, runtime-active page evaluation, switch/variable simulation, event execution, or automatic gameplay testing.
- MCP hosting, a browser-based viewer, or another first-version package export surface.
- Plugin-provided visual effects, alternative engine formats, live animation, or a promise of equivalence with a plugin-modified running game.
- Adding Event Page appearance authoring, preserving omitted event images through inheritance, or changing compiler/decompiler ownership and defaults.
- Final cell-passability judgments, pathfinding, reachability overlays, or proof of runtime triggering and walking behavior.
- Inventing semantic meanings for Region IDs, Terrain Tags, assets, or unsupported event commands.
- Image snapshotting, historical image archival/recovery, changes to Clone/Pull scope or Compile Baseline, custom asset roots, and persistent current-map configuration.
- Map editing, direct modification of project JSON, implicit synchronization or compilation, automatic Push, or bypassing existing write checks.
- A public low-level raster interface, speculative rendering adapters, or one exported helper per private drawing step.

## Further Notes

This spec synthesizes the fourteen accepted scope and behavior decisions and replaces the earlier design discussion note. Implementation is complete on `codex/map-inspection-and-preview`; all eleven linked implementation tickets are resolved. The map operations are delivered through the existing CLI and Workspace API.

Use the [domain glossary](../../GLOSSARY.md) for canonical language. Existing decisions remain recorded in [ADR-0002: Technical architecture and toolchain](../../docs/adr/0002-technical-architecture-and-toolchain.md), [ADR-0003: Workspace compile and push model](../../docs/adr/0003-workspace-compile-push-model.md), [ADR-0004: Explicit MV entry identity](../../docs/adr/0004-explicit-mv-id-entry-identity.md), [ADR-0006: Interrupted Push recovery](../../docs/adr/0006-interrupted-push-recovery.md), [ADR-0009: Read-only Map Inspection and Map Preview](../../docs/adr/0009-read-only-map-inspection-and-preview.md), and [ADR-0010: Static rendering with project image assets](../../docs/adr/0010-static-map-rendering-with-project-image-assets.md).

The current DSL compiles event pages without appearance images. Generated observation must expose that fact, while event-ID markers still permit placement review. Live Map Image Assets can change independently of captured map data, and recorded hashes identify their versions without restoring overwritten files. Complete previews remain static native-map observations rather than runtime guarantees.

The implementation uses `pngjs` internally and plans output before allocating the canvas, with each dimension limited to 4096 pixels and a 16,777,216-pixel budget. Public results expose domain metadata and artifact paths rather than raster-library types.

## Completion and Verification

Completed on 2026-10-18. The [final two-axis review](review.md) records three Standards P3 judgment calls and two Spec P2 validation defects, all fixed together and confirmed by their original reviewers. The final implementation merge is `025ed97dc9f5495c71ff281ba36e35fbc5a2f3ce`.

- `pnpm check` passed: typecheck, lint, formatting, and 28 test files / 243 tests. `pnpm build` passed.
- Independent installed-package checks covered API imports, strict NodeNext declarations, map CLI help, JSON output, artifacts, and invalid page overrides.
- The controlled entrance-placement workflow covers discovery, overview/crop, precise inspection, Definition Source authoring, Compile Check, Compile, generated identity/position/image-free review, and Diff, preserving Project Root and snapshot bytes.
- Independent native-static fixtures cover tiles/autotiles, layers, shadows, parallax, event graphics, crop transforms, page selection, and incomplete assets. An additional real local project matched all 509,184 pixels of an independently assembled reference. The final built CLI output remained byte-identical after the review fixes.
- The distributed authoring skill and user-facing guides match the delivered source, page, overlay, and incomplete-output contracts. Preview remains native-static; runtime passability, page activation, and trigger success are not inferred.
- Observation and authoring acceptance performed no Project Root Push. The explicit user-instruction boundary before Push remains in place.
