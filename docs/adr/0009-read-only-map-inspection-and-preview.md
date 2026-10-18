---
status: accepted
---

# Read-only Map Inspection and Map Preview

We decided to add structured Map Inspection and visual Map Preview for a Selected Map identified by an explicit RPG Maker MV map ID. Agents can select that ID from the task or an Event Definition; the target does not follow the MV editor's open map or the player's runtime map. This keeps observation aligned with Map Event Identity and makes the subject of each result explicit.

The first version supports the Project Data Snapshot and Generated Project Data, defaults to the snapshot, and labels results with their data source. Generated reads require the existing freshness and integrity checks. Editor-saved changes enter the snapshot through the existing Pull workflow; observation does not implicitly Pull or Compile. This preserves the separation between authoring inputs, compiled results, and Project Root state established in ADR-0003.

The initial agent entry point is the CLI, backed by reusable programmatic inspection and rendering interfaces inside the package. Map Preview targets native MV static map appearance, including tiles and autotiles, layer ordering, shadows, and parallax; animated tiles use a fixed frame. Coordinate grids and event identifiers support precise placement. Plugin visual effects and runtime observation are outside this first-version compatibility target, avoiding an editor or running-game dependency for ordinary event authoring.

Map observation does not expand Event Page authoring fields or change compilation and decompilation behavior. A preview represents its selected data source faithfully: an event with no image is represented by its location marker when markers are enabled, rather than borrowing an image from the snapshot to conceal the difference. Event appearance authoring remains a separate scope decision.

A static Map Preview uses each event's first page by default and permits explicit per-event Preview Page overrides. The selected page is reported as a preview choice, never as a claim about runtime activation. Observation reports stored map information and readable tile-flag interpretations, without promising final passage, pathfinding, or runtime reachability.
