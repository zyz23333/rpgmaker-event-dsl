# Map Observation for Event Placement

Read this when choosing a Map Event's location or reviewing its compiled placement.
Run commands from the Workspace using its installed CLI form. Consult
`map list --help`, `map inspect --help`, or `map render --help` for installed syntax.

## Locate and Inspect

1. Resolve the Selected Map's numeric ID from the task or Event Definition. Use
   `map list --json` for discovery; duplicate names remain distinct by ID and parent.
2. Use `map inspect --map 1 --json` for dimensions, tileset, settings, and event
   positions. Use `map render --map 1 --json` for a full-map overview, then open the
   returned PNG and matching metadata.
3. Request a useful local crop, for example `map render --map 1 --crop 2,1,3,3 --json`.
   Query the candidate with `map inspect --map 1 --cell 3,2 --json`, its surroundings
   with `--area 2,1,3,3`, and relevant events with `--event 1`. Event inspection gives
   page conditions, triggers, images, and command summaries; add `--commands` when
   full command records are needed.
4. Choose the original-map coordinate and author Definition Source. After Compile
   Check and Compile, repeat targeted inspection and rendering with
   `--source generated`, then review Diff through the existing safety workflow.

`--event`, `--cell`, and `--area` are mutually exclusive. `--commands` requires
`--event`. Coordinates start at `(0,0)`; crop and area tuples are
`X,Y,width,height`, with positive sizes inside the original map bounds. A crop does
not renumber Map Cells or wrap across a looping map's boundary.

Completion criterion: the selected source, numeric map/event identities, original
placement coordinate, and compiled placement agree with the intended scene.

## Sources and Image Provenance

The default `--source snapshot` observes the Project Data Snapshot. Editor changes
enter it through the existing explicit Pull workflow. Observation does not Pull,
Compile, Push, evaluate Definition Source, or execute the game's engine/plugins.

`--source generated` requires fresh, intact Generated Project Data. Compile again
when the tool reports stale output. It reads generated map/event content and
baseline-snapshot supporting data such as map names and tilesets. Inspect each
`dataInputs` entry's actual source; failed generated reads do not fall back to
snapshot map/events.

Map Image Assets are read live from the configured Project Root for either source.
`imageInputs` records their paths and hashes separately from project data. Replacing
an image can change a later preview without changing the snapshot or Compile
Baseline. Hashes identify bytes used; they do not archive old images.

The current compiler emits image-free event pages. Generated observation represents
those pages faithfully and removes snapshot-only events. Use ID markers to review
placement; appearance authoring remains outside this workflow.

## Pages, Coordinates, and Display Aids

Each event uses its first page by default. Repeated options such as
`--event-page 1:2 --event-page 3:1` select one-based Preview Pages explicitly.
Nonexistent events/pages and duplicate overrides are errors. Report these as
preview choices; page conditions are not evaluated to determine runtime activation.

Grid/coordinate labels and event-ID markers are enabled by default. `--no-grid`
hides the grid and labels; `--no-events` hides markers while retaining event images.
Together they give a scene without inspection overlays.

Large overviews are scaled to a bounded image. Use a crop for local detail and
metadata to relate pixels to cells: `bounds` uses original-map coordinates,
`mapContent` excludes label margins, and `transform` maps a cell boundary as
`pixelX = x * scaleX + offsetX`, `pixelY = y * scaleY + offsetY`. Include the result's
absolute `artifacts.png` and `artifacts.metadata` paths in placement review.

## Incomplete Output and Static Limits

Normal rendering fails for unavailable required images. Restore the reported PNG
or explicitly use `--allow-missing-assets` for diagnosis. That mode produces visible
placeholders and an incomplete notice, `complete: false`, typed warnings, and
unavailable image inputs without fabricated hashes. Disclose these limitations
when using the result. It does not relax invalid data, bounds, freshness, integrity,
or synchronization guards. Intentionally image-free events are valid, and
structured inspection works without image files.

The compatibility target is native RPG Maker MV static appearance at animation
frame zero. Plugin visuals, moving sprites, page activation, and gameplay execution
are outside the preview. Report Region IDs and Terrain Tags numerically unless
the project's conventions are known. Stored tile passage bits do not establish
final passability, reachability, or whether an event will trigger during play.
