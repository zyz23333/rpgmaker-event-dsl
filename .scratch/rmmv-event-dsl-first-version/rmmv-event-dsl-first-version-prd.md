# RMMV Event DSL First Version PRD

## Change Slug

`rmmv-event-dsl-first-version`

## Problem Statement

RPG Maker MV event data is easy to break and hard to review when edited as raw command arrays. Small mistakes in command order, continuation commands, page conditions, target selection, or ID handling can silently change gameplay behavior. The user wants a first version that is as complete as practical while still keeping the authoring surface safe, typed, and project-aware.

## Solution

Provide a schema-first TypeScript DSL for defining RPG Maker MV map events and common events, plus a project-aware tool that can lint, create, replace, preview, and diff event data changes against an existing MV project. Developers write event definitions, not patch scripts. The tool resolves targets from configuration, validates references against project data, compiles DSL input into MV-compatible event data, and writes stable MV-style JSON output.

The first version should support the end-to-end workflow for event data management, including map events and common events, while limiting mutation semantics to explicit create and replace operations.

## User Stories

1. As a developer, I want to define a map event in TypeScript with named fields, so that I can express intent clearly without hand-writing raw MV command arrays.
2. As a developer, I want to define a common event in TypeScript with named fields, so that shared event logic can live in the same DSL as map events.
3. As a developer, I want event pages and command helpers to use schema-first object inputs, so that the shape of each event is explicit and easy to validate.
4. As a developer, I want to export event definitions as named TypeScript exports, so that the tool can collect definitions without relying on default exports or hidden conventions.
5. As a developer, I want to keep helper values inside the definition file without exporting them, so that I can factor shared input cleanly without polluting the collected event set.
6. As a developer, I want map targets to come from configuration, so that the same definition file always applies to the same map and does not depend on CLI target flags or filename guessing.
7. As a developer, I want create and replace to be separate operation modes, so that the tool’s intent is always explicit and never silently upserts data.
8. As a developer, I want a single tool run to use one operation mode for all selected definition files, so that I can reason about the run outcome consistently.
9. As a developer, I want to lint a definition file before applying it, so that I can catch reference and schema problems without changing project files.
10. As a developer, I want lint to read the target MV project data, so that checks are based on real project state rather than static TypeScript shape alone.
11. As a developer, I want create and replace to perform the same project-aware validation before writing, so that invalid changes never partially land on disk.
12. As a developer, I want preview mode to show me what will change without writing files, so that I can review event data changes safely before applying them.
13. As a developer, I want diff mode to show both a summary and a file diff, so that I can inspect exactly what the tool will rewrite.
14. As a developer, I want the tool to write MV-style JSON, so that the resulting files stay compatible with RPG Maker MV expectations and remain reviewable.
15. As a developer, I want map events and common events to support explicit create, so that I can add new event entries without editing the MV editor manually.
16. As a developer, I want map events and common events to support explicit replace, so that I can fully overwrite an existing event entry when that is the intended operation.
17. As a developer, I want create to append a new event ID instead of reusing a null slot, so that new entries do not accidentally revive old gaps in the array.
18. As a developer, I want replace to require exactly one matching existing name, so that ambiguous target selection is treated as an error.
19. As a developer, I want bare numeric IDs to be disallowed, so that most references stay readable and less error-prone.
20. As a developer, I want explicit ID reference helpers to exist when needed, so that I can still address project data by ID when names are unavailable or unstable.
21. As a developer, I want page conditions to use fixed condition slots, so that the DSL reflects how RPG Maker MV actually evaluates pages.
22. As a developer, I want map event pages to support the full MV trigger set, so that common event flow and map interaction patterns can be represented directly.
23. As a developer, I want common events to support none, autorun, and parallel triggers, so that reusable event logic can model MV’s runtime behavior.
24. As a developer, I want the tool to allow empty command lists, so that I can intentionally define placeholder events or empty pages without inventing a fake command.
25. As a developer, I want map events to require at least one page, so that a map event definition always produces a meaningful event entry.
26. As a developer, I want script commands to require explicit config enablement, so that arbitrary runtime code is only allowed when the project has opted in.
27. As a developer, I want plugin commands to work without a runtime registry, so that standard MV plugin workflows remain usable even when no catalog exists.
28. As a developer, I want plugin command registry data to be optional lint-time metadata, so that known commands can be validated more strictly when available.
29. As a developer, I want command helpers such as text, choices, conditionals, loops, and transfer to be available in the first version, so that common narrative and quest flows can be authored without raw MV commands.
30. As a developer, I want battle and shop commands to be included in the first version with golden-sample confirmation, so that their more complex parameter shapes are validated against real MV output.
31. As a developer, I want command and event definitions to support a consistent schema-first style, so that the authoring model feels uniform across the DSL.
32. As a developer, I want the tool to fail without writing partial results when validation or planning fails, so that an invalid run never leaves the project in a half-updated state.

## Implementation Decisions

- The first version uses a schema-first TypeScript DSL rather than a patch script surface.
- Event Definitions are written as named exports and are collected from TypeScript modules.
- `mapEvent`, `commonEvent`, `page`, and command helpers all use object-shaped inputs.
- Map targets are bound in configuration, not inferred from filenames or overridden by CLI target arguments.
- A single first-version run applies one operation mode across all selected definition files.
- The tool supports `lint`, `create`, `replace`, `--dry-run`, and `--diff`.
- `lint` is project-aware and reads the configured MV project data.
- `create` and `replace` both perform project-aware validation before any files are written.
- `create` appends new event IDs and does not reuse null holes.
- `replace` requires exactly one matching existing name.
- `merge`, `upsert`, `partial update`, and `delete` are out of scope for the first version.
- Map event pages are required and non-empty.
- Empty command lists are valid for pages and common events.
- Page conditions use fixed MV condition slots and are combined with AND semantics.
- Map page triggers support the MV page trigger set, with action as the default.
- Common events support none, autorun, and parallel triggers, with explicit switch references required for autorun and parallel.
- Project references use dedicated `xxxRef` helper names.
- Explicit ID reference helpers are allowed, but raw numeric IDs are not valid DSL references.
- Script commands require explicit configuration enablement.
- Plugin commands use schema-first input and do not require a runtime registry.
- Plugin registry data is optional lint-time metadata.
- The output writer uses an MV-style stable JSON format for changed MV data files.
- Preview mode reports entry-level summaries, and diff mode adds full-file unified diffs.
- Battle and shop command support must be confirmed against editor-generated golden samples before being considered complete.

## Testing Decisions

- Test behavior at the highest practical seam: project-aware linting, plan generation, compile-and-apply, and output writing.
- Favor end-to-end tests against reference MV projects over implementation-detail unit tests.
- Use golden samples from editor-generated MV data to verify output shapes, command lists, and complex parameter encodings.
- Test that lint rejects invalid definitions, ambiguous targets, invalid references, and disallowed script usage.
- Test that create and replace do not write partial results after failed validation or planning.
- Test that preview and diff modes do not write files.
- Test that MV-style output remains stable for changed event data files.
- Test that map and common event operations preserve undeclared entries while replacing only the intended targets.
- Test that command compilation matches known MV command sequences, especially for conditional branches, loops, and the battle/shop command families.

## Out of Scope

- Replacing the RPG Maker MV editor.
- Merge-based patching of existing event entries.
- Partial page-level updates of existing events.
- Delete operations for event entries.
- Upsert semantics.
- Full command coverage of every RPG Maker MV event command in the first version.
- Auto-creation of project data such as switches, variables, maps, items, or actors.
- CLI target overrides for map selection.
- Filename-based target inference at apply time.
- Runtime registry requirements for plugin commands.
- Project-level compiler default overrides.
- Preserving original whitespace or text formatting from existing MV JSON files.

## Further Notes

The first version is intentionally broad in workflow scope but narrow in mutation semantics. It is meant to feel complete for project-aware event authoring and application, while still using explicit operations and deterministic output. The glossary and ADRs capture the stable terms and decisions that should guide implementation work.
