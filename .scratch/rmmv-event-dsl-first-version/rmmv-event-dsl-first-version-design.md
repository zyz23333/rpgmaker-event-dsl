# RMMV Event DSL First Version Design

## Status

Draft

## Change Slug

`rmmv-event-dsl-first-version`

## Context

The repository currently contains a planning README plus a completed local PRD and glossary/ADR set for a first-version RPG Maker MV event authoring tool. The agreed language is schema-first and developer-facing: developers write named TypeScript Event Definitions, and the tool turns those definitions into project-aware event data operations against an existing MV project.

The core design pressure is that RPG Maker MV event data is structurally simple but semantically fragile. Raw command arrays, page conditions, trigger values, and ID handling are easy to get wrong, and MV runtime reads the resulting JSON directly. The design therefore needs to keep authoring expressive while making mutation semantics explicit, validation strict, and output deterministic.

The main source findings that shape this design are:

- MV loads `Map###.json` and `CommonEvents.json` as JSON arrays/objects, with `null` slots allowed in event arrays.
- Map events require non-empty page lists, and page/runtime fields are read directly by MV runtime.
- Common events are user-defined project data and can be triggered by the runtime without any built-in plugin command registry.
- The runtime accepts plugin commands as strings passed to plugin hooks, while script commands execute arbitrary JS only when enabled by project policy.

## Problem

The current repository has a strong conceptual boundary but no implementation. Without an explicit design, the first version risks drifting into one of the rejected shapes: patch-script authoring, merge/upsert semantics, filename-based target inference, hidden defaults, or ad hoc output formatting. Those shapes would make the tool harder to reason about and easier to misuse.

## Goals

- Provide a schema-first TypeScript DSL for map events, common events, pages, and command helpers.
- Support project-aware linting, create, replace, dry-run, and diff workflows.
- Keep create and replace explicit and strict, with no merge, delete, or upsert behavior.
- Keep map targets configuration-owned and operation mode run-owned.
- Produce stable MV-style JSON output that remains readable and reviewable.
- Preserve the first-version intent to feel workflow-complete while remaining narrow in mutation semantics.

## Non-Goals

- Replacing the RPG Maker MV editor.
- Filename-based target inference during apply.
- CLI target overrides for map selection.
- Patch-script authoring as the public surface.
- Merge, upsert, partial update, or delete semantics.
- Full command coverage for every MV event command in version one.
- Project-level compiler default overrides.
- Runtime registry requirements for plugin commands.

## Scope

### In

- Named-export Event Definitions in TypeScript.
- Schema-first inputs for `mapEvent`, `commonEvent`, `page`, and command helpers.
- Project-aware linting, create, replace, preview, and diff workflows.
- MV-style JSON writing for changed `Map###.json` and `CommonEvents.json` files.
- Strict project-reference resolution through a Project Index.
- Append-only create behavior and strict unique-name replace behavior.
- Empty command lists and non-empty map page lists.
- Script command gating by configuration.

### Out

- Editing through the MV GUI.
- Non-strict patching or automatic data repair.
- Custom authoring defaults at the project config level.
- Automatic creation of new switches, variables, items, maps, or actors.
- Partial page-level event editing.
- Any semantics that depend on hidden merge behavior.

## Canonical References

- `README.md`
- `CONTEXT.md`
- `docs/adr/0001-schema-first-dsl-entry-model.md`
- `docs/adr/0002-event-data-operations-create-replace.md`
- `docs/adr/0003-validation-preview-and-output-strategy.md`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Event.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Map.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_CommonEvent.js`
- `references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js`
- `references/rpg-maker-mv-corescript/js/rpg_managers/DataManager.js`
- `references/rpg-maker-mv-corescript/js/json_docs.js`
- `references/rmmv-local-runtime-1.6.1/data/CommonEvents.json`
- `references/rmmv-local-runtime-1.6.1/data/Map001.json`

## Current Behavior

There is no implemented compiler or CLI surface yet. The repository currently documents the domain language, the desired DSL shape, and the first-version workflow, but it does not yet load project data, parse event definitions, or write MV data files.

## Target Behavior

After this change, the tool should:

1. Read a project configuration that binds each Event Definition file to a target data store location.
2. Load the target MV project and build a Project Index from existing data.
3. Collect named Event Definitions from TypeScript modules.
4. Validate the definitions and planned operations against project data before writing.
5. Create or replace target event entries with strict name matching and append-only create semantics.
6. Compile DSL nodes into MV-compatible raw event commands and pages.
7. Write changed JSON files using a stable MV-style format.
8. Support `lint`, `create`, `replace`, `--dry-run`, and `--diff` without partial writes on failure.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |
| R-01 | No DSL runtime exists | Schema-first TS Event Definitions are collected from named exports | A definition file with named exports is recognized; default export is rejected |
| R-02 | No project-aware validation | Lint reads project data and validates references, targets, and shapes | Invalid references, ambiguous targets, and disallowed shapes fail lint |
| R-03 | No mutation workflow | Create and replace are explicit and separate | A run uses one mode for all selected files; no upsert/merge path exists |
| R-04 | No create semantics | Create appends a new ID and fails on duplicate names | New entries are appended; existing names cause an error |
| R-05 | No replace semantics | Replace overwrites exactly one matching entry | Missing or ambiguous targets fail; unique target is replaced in place |
| R-06 | No preview mode | Dry-run and diff report planned changes without writes | Neither preview mode writes files |
| R-07 | No stable writer | Changed MV JSON is written in MV-style stable format | Output is deterministic and reviewable across runs |
| R-08 | No command compiler | MV command helpers compile to raw Event Commands | Known DSL nodes compile to expected command lists and page shapes |
| R-09 | No script gating | Script commands require explicit config enablement | Script nodes fail unless the config flag is present |
| R-10 | No runtime-safe reference model | Project references are via `xxxRef` helpers, not bare IDs | Bare numeric references are rejected; explicit ID refs remain allowed |

## Locked Decisions

- Schema-first DSL is the public authoring model.
- Named exports are the only first-version collection boundary.
- Map targets come from configuration, not filenames or CLI overrides.
- One run uses exactly one operation mode across all selected files.
- First-version operations are create and replace only.
- Create is append-only; replace requires an exact unique name match.
- Lint is project-aware by default.
- Validation must happen before any file writes.
- Dry-run and diff are read-only.
- MV-style JSON writing is used for changed files.
- Empty command lists are allowed; map page lists are not empty.
- Script commands require explicit configuration enablement.
- Plugin commands do not require a runtime registry.

## Agent Discretion

- The exact internal module boundaries and naming of implementation modules.
- The exact CLI command names and option surface, as long as they honor the locked decisions.
- The exact parser and execution strategy for loading named exports, as long as it preserves the schema-first contract.
- The exact MV-style writer implementation, provided it remains stable and reviewable.
- The internal structure of validation diagnostics and warning levels, provided errors still block writes.

## Invariants

- No partial write after failed project-aware validation or planning.
- No merge or upsert semantics anywhere in the first version.
- No silent target inference from filenames at apply time.
- No raw numeric ID references in DSL input.
- No default export collection.
- No hidden project-level default overrides.
- Raw MV command output must remain valid for the runtime readers that consume `Map###.json` and `CommonEvents.json`.

## Design

The first version is best modeled as a three-stage flow:

1. **Collect and validate definitions**
   - Read project config and resolve each definition file to a target.
   - Collect named Event Definitions from TypeScript modules.
   - Validate shape, imports, references, target binding, and mode-specific constraints.

2. **Plan event data operations**
   - Convert each Event Definition into either a create or replace operation.
   - Resolve names through the Project Index.
   - For create, allocate a new ID at the end of the target array.
   - For replace, locate exactly one existing entry by name.
   - Compile DSL nodes into MV raw commands and pages using built-in compiler defaults.

3. **Write or preview**
   - In lint and preview modes, report diagnostics and planned changes only.
   - In diff mode, add full-file unified diffs to the entry-level summary.
   - In apply modes, write changed files in MV-style JSON only after all validation passes.

The DSL should stay schema-first across the top-level event builders, page builders, and command helpers. Optional fields in the TypeScript input schema are completed by documented compiler defaults, but output shapes must still satisfy MV runtime expectations. Page conditions remain fixed-slot AND conditions rather than arbitrary predicates.

## Conditional Modules

### UX / Product Behavior

- The tool is a CLI-first workflow, but its user-visible behavior includes lint, create, replace, dry-run, and diff.
- Error and warning output must clearly distinguish blocking validation failures from advisory lint warnings.

### Domain Model

- The canonical terms are Event Definition, Event Data Store, Event Data Management, Project Index, Definition Target, Operation Mode, Event Node, and Raw Event Command.
- Create and replace are the only mutation modes in the first version.
- Common events are user-defined project data and are not runtime-provided primitives.

### API / Contract Changes

- The DSL input contract is schema-first and object-shaped for events, pages, plugin commands, scripts, and most command helpers.
- The Project Index contract must support name resolution and explicit ID references.
- The create/replace contract must reject ambiguous or missing targets.

### Data Model / Persistence

- Map events are stored in `Map###.json` arrays with nullable holes.
- Common events are stored in `CommonEvents.json` arrays with nullable holes.
- Create appends a new entry; replace rewrites an existing entry.
- The output writer must keep the data structure valid for MV runtime readers.

### Execution / Concurrency Semantics

- A single run applies one Operation Mode across all selected files.
- Validation and planning must finish before any write begins.
- If any definition fails, the run writes nothing.

### Side Effects / Integrations

- The tool reads and writes MV project JSON files.
- The tool may optionally read plugin command registry metadata for lint-time validation.
- The tool must honor script-command enablement from config.

### Security / Privacy / Money

- Script commands are opt-in because they permit arbitrary runtime code.
- Raw numeric references are disallowed to reduce accidental misuse.

### Observability / Operations

- Diagnostics should surface project-aware errors, ambiguous targets, and schema violations in a way that is easy to act on.
- Preview and diff output should describe changed files and entries clearly.

### Research / Dependency Findings

- MV runtime reads event pages and common events directly from JSON and expects valid shapes for conditions, images, movement, triggers, and command lists.
- MV plugin commands are dispatched through interpreter hooks without a built-in runtime registry.

### Rollout / Migration / Cleanup

- There is no legacy implementation to preserve in this repository.
- The first version should land as a clean initial implementation rather than a migration path.

## Phase Slices

Reserved for `to-slices`. Do not fill this section in `to-design`.

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |
| 1 | Decide the technical stack and implementation boundaries | None | Stable language/runtime/tooling choices for the rest of the work | The stack choice is documented and no later slice needs to reopen it | Decision: technical architecture and dependency stack |
| 2 | Lock the MV schema catalogue and canonical type shapes | Phase 1 | Canonical shapes for map events, common events, pages, commands, and reference helpers | The DSL/compiler slices have a stable type/schema contract to follow | Decision: MV schema catalogue and canonical type shapes |
| 3 | Establish workspace bootstrap and project loading | Phases 1-2 | Basic project/config loading and tool entry surfaces | Later slices can load MV project data through a shared foundation | Foundation: workspace bootstrap and project loading |
| 4 | Build the schema-first DSL surface and Event AST | Phases 1-3 | Named exports, schema-first event inputs, command helpers, and AST shape | Event Definitions can be collected and represented consistently | Vertical: schema-first DSL surface and Event AST |
| 5 | Build Project Index and project-aware validation | Phases 1-4 | Name resolution, explicit ID handling, create/replace validation, script gating, and target checks | Lint can reject invalid definitions and planned operations before writes | Vertical: Project Index and project-aware validation |
| 6 | Build compiler and MV-style JSON writer | Phases 1-5 | DSL-to-raw-command compilation and stable MV-compatible output | Event data can be compiled and written deterministically | Vertical: compiler and MV-style JSON writer |
| 7 | Build CLI workflows for lint/create/replace/preview/diff | Phases 1-6 | Mode routing, no-partial-write behavior, preview and diff reporting | The tool can run the end-to-end workflow from definitions to output | Vertical: CLI workflows for lint / create / replace / preview / diff |
| 8 | Verify complex command shapes against editor samples | Phase 6 | Battle/shop and other complex command families | Golden samples confirm command compilation against reference MV output | Verification: golden samples for battle, shop, and complex command shapes |

## Completion Contract

### Observable Truths

- [ ] OT-01: A named-export Event Definition file can be linted against a project-aware target configuration.
- [ ] OT-02: Create and replace modes reject invalid or ambiguous targets without writing partial results.
- [ ] OT-03: Dry-run and diff modes report planned changes without writing files.
- [ ] OT-04: Changed MV data files are written in a stable MV-style format that remains readable and valid.

### Required Design Outcomes

- [ ] OUT-01: The implementation has a clear boundary between Event Definitions, Project Index resolution, operation planning, and output writing.
- [ ] OUT-02: The implementation preserves the locked decisions around schema-first DSL, explicit create/replace, and project-aware validation.
- [ ] OUT-03: The implementation leaves merge, upsert, delete, and filename-based target inference out of the first version.

### Required Canonical Updates

- [ ] DOC-01: The glossary remains the source of truth for user-facing domain terms.
- [ ] DOC-02: The ADRs remain aligned with the first-version DSL shape, data operations, and validation/output strategy.

## Test Strategy

The highest practical seams are the CLI entrypoints and the compile-and-apply boundary against a reference MV project. Existing reference project data and editor-generated JSON samples should be used as the prior art for both validation and output expectations.

The test strategy should cover:

- project-aware lint failures for invalid references, ambiguous names, and disallowed shapes
- create vs replace behavior on existing MV data
- append-only ID allocation for create
- preview and diff being read-only
- MV-style output stability on changed files
- command compilation against known MV samples, especially for conditionals, loops, common events, and the battle/shop families
- script-command gating by configuration

What should not be tested at this layer:

- internal parser implementation details
- exact whitespace preservation from source MV files
- UI-level concerns that do not exist in the first version
- merge semantics, because merge is explicitly out of scope

## Deferred Ideas

- Merge/upsert semantics.
- Delete operations.
- Partial page updates.
- Filename-based target inference.
- Project-level compiler default overrides.
- Runtime registry enforcement for plugin commands.
- Full command coverage beyond the agreed first-version set.

## Open Questions

None. The first-version scope and semantics are sufficiently bounded for design work to proceed.
