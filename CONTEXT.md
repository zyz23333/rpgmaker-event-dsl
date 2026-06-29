# RMMV Event DSL

This context defines the language for a TypeScript-first authoring layer that turns intentional RPG Maker MV event changes into validated MV project data.

## Language

**Event DSL**:
The TypeScript authoring surface for defining RPG Maker MV events and event commands before compilation to project data.
_Avoid_: raw JSON editing, patch script, editor automation

**Schema-First DSL**:
A TypeScript authoring style for the Event DSL where event structures are expressed as named object fields rather than positional block arguments.
_Avoid_: patch script, positional block DSL

**Event Definition**:
A top-level developer-authored TypeScript DSL value that defines one RPG Maker MV event.
_Avoid_: patch script, raw event JSON, TypeScript module

**Named Event Export**:
A named TypeScript export whose value is an Event Definition collected by the tool.
_Avoid_: default export, exported helper

**Definition Source**:
The single TypeScript file referenced by a Definition Binding.
_Avoid_: glob, directory, file set

**Definition Source Discovery**:
The Workspace Config behavior that selects DSL source files for workspace-level compilation.
_Avoid_: definition binding, target mapping, CLI target override

**Empty Command List**:
A required `commands` field with no DSL Commands that compiles to only the RPG Maker MV end marker.
_Avoid_: missing command list, implicit delete

**Map Event**:
An event stored in a `Map###.json` file.
_Avoid_: common event, event data operation

**Common Event**:
A reusable RPG Maker MV event command list stored in `CommonEvents.json`.
_Avoid_: runtime event, built-in event

**Event Page List**:
The required non-empty list of pages for a Map Event definition.
_Avoid_: page-less map event

**Common Event Trigger**:
The activation mode for a Common Event: none, autorun, or parallel.
_Avoid_: map event trigger

**Map Page Trigger**:
The activation mode for a Map Event page: action, playerTouch, eventTouch, autorun, or parallel.
_Avoid_: common event trigger

**Page Condition Slots**:
The fixed RPG Maker MV page condition fields for switches, variable threshold, self switch, item, and actor.
_Avoid_: boolean expression, arbitrary predicate

**DSL Command**:
An Event DSL command value inside an Event Definition command list before it is compiled to Raw Event Commands.
_Avoid_: Event Node, instruction, Raw Event Command

**Raw DSL Command**:
A DSL Command that carries raw RPG Maker MV command fields directly as an escape hatch.
_Avoid_: Raw Event Command, ordinary DSL helper

**Raw Event Command**:
A compiled RPG Maker MV command object with `code`, `indent`, and `parameters`.
_Avoid_: event node, DSL command

**Supported Event Command**:
One RPG Maker MV event command that the DSL can represent and compile without using a Raw DSL Command.
_Avoid_: Initial Command Coverage, complete MV command coverage

**Function-Style Command Helper**:
A verb-named DSL helper that carries its inputs as a schema-first object rather than positional arguments.
_Avoid_: positional command builder, raw command string

**Common Event DSL Command**:
A DSL Command that runs an existing Common Event from an Event Definition command list.
_Avoid_: Common Event, Common Event Definition, Common Event command

**Plugin DSL Command**:
A DSL Command that runs an RPG Maker MV plugin command.
_Avoid_: Plugin Command Input, raw command string, runtime plugin registry

**Plugin Command Registry**:
An optional lint-time catalog of known plugin commands and parameter shapes.
_Avoid_: runtime dependency, hard validation source

**Script Input**:
A schema-first DSL object that represents an RPG Maker MV script command and carries the script lines in a `code` field.
_Avoid_: raw script string, implicit enablement

**Script Command Gate**:
The Workspace Config setting that must allow Script Input before it can compile to script Raw Event Commands.
_Avoid_: Script Command Enablement, per-node reason gate, implicit script support

**Project Data Reference**:
A DSL reference value from an Event Definition to an existing RPG Maker MV project data entry.
_Avoid_: project reference, raw ID, definition builder

**External Project Data Reference**:
A read-only reference from DSL-owned data to RPG Maker MV project data outside DSL-Owned Project Data.
_Avoid_: DSL-owned definition, generated data, implicit ownership

**Explicit ID Reference**:
A Project Data Reference that identifies RPG Maker MV data by numeric ID without using a bare number.
_Avoid_: raw numeric ID, implicit ID

**Project Index**:
A name-to-ID lookup model built from an existing RPG Maker MV project.
_Avoid_: registry, database cache

**Event Data Store**:
The RPG Maker MV project data files that contain event entries, including `Map###.json` and `CommonEvents.json`.
_Avoid_: database, runtime state

**Project Root**:
The root directory of an RPG Maker MV project, identified by a `.rpgproject` file.
_Avoid_: workspace root, package root, inferred project directory

**Workspace**:
The user-owned directory that contains Event Definition source files and the local tool configuration for a target RPG Maker MV project.
_Avoid_: MV project root, package root, repository root

**Sample Workspace**:
A repository-owned workspace fixture used to exercise the CLI against a controlled set of Event Definitions.
_Avoid_: user-owned workspace, MV project root, production example

**Workspace Initialization**:
The CLI operation that creates a Workspace at a chosen path and establishes its initial structure.
_Avoid_: project import, project migration, file sync

**Workspace Root**:
The root directory of a Workspace, identified by the presence of the Workspace Config.
_Avoid_: Project Root, repository root, arbitrary source folder

**Workspace Config**:
The local configuration file `rmmv-event-dsl.config.json` in a Workspace that binds Event Definitions to a Project Root.
_Avoid_: project config, global config, package config

**Workspace Data State**:
The tool-maintained local project data state inside a Workspace, including generated data, project snapshots, and synchronization metadata.
_Avoid_: local data layer, output folder, editable local JSON

**Generated Project Data**:
MV-style project data produced from Event DSL compilation inside a Workspace before it is applied to a Project Root.
_Avoid_: hand-edited output, project snapshot, local source of truth

**Compile Output**:
The complete Generated Project Data state for all DSL-Owned Project Data domains in a Workspace.
_Avoid_: patch plan, operation list, partial output

**Staged Data Graph**:
The in-memory graph of DSL-owned entries and resolvable project references used during compilation.
_Avoid_: project index, output file, runtime state

**Clone**:
The workspace operation that captures an initial Project Data Snapshot from a Project Root.
_Avoid_: compile, pull, apply

**Pull**:
The workspace operation that refreshes a Project Data Snapshot from a Project Root after the initial clone.
_Avoid_: compile, clone, apply

**Push**:
The workspace operation that writes Generated Project Data to a Project Root after synchronization checks pass.
_Avoid_: compile, pull, copy

**Project Data Snapshot**:
A local copy of RPG Maker MV project data captured from a Project Root for comparison and reconciliation.
_Avoid_: generated output, editable local JSON, backup

**Project Drift**:
A mismatch between the current Project Root state and the latest Project Data Snapshot.
_Avoid_: stale cache, generated diff, file corruption

**Snapshot-Only Owned Entry**:
A DSL-owned data entry present in a Project Data Snapshot but absent from Compile Output.
_Avoid_: compile deletion, project drift, unmanaged entry

**Destructive Change**:
A Push change that removes a Snapshot-Only Owned Entry from a Project Root.
_Avoid_: force push, project drift, compile deletion

**Destructive Push**:
A Push that explicitly allows Destructive Changes while still requiring Generated Freshness and no Project Drift.
_Avoid_: force push, overwrite, unsafe push

**Entry Removal**:
The generated representation of a Destructive Change for one DSL-owned data entry.
_Avoid_: array compaction, entry replacement, project drift

**Diff**:
The structured comparison report between Generated Project Data and a Project Data Snapshot.
_Avoid_: drift check, validation, patch plan

**Structured Diff Report**:
A machine-readable and human-readable Diff output that groups changes by data domain, entry, and command-level detail.
_Avoid_: raw text diff, ad hoc log output, validation error list

**Reconciliation Hint**:
A structured Diff detail that suggests how a raw MV change might map back to DSL.
_Avoid_: decompile output, compile output, validation error

**Data Domain**:
A semantically distinct portion of RPG Maker MV project data, such as map event entries or system variables and switches.
_Avoid_: JSON file, whole file, table, file-level ownership

**DSL-Owned Project Data**:
The set of RPG Maker MV data domains for which Event DSL is the authoritative source.
_Avoid_: managed project data, partially-owned data, editor-owned event data

**Variable Definition**:
A DSL-authored RPG Maker MV system variable entry that is part of DSL-Owned Project Data.
_Avoid_: variable reference, project-only setting, bare numeric ID

**Switch Definition**:
A DSL-authored RPG Maker MV system switch entry that is part of DSL-Owned Project Data.
_Avoid_: switch reference, project-only setting, bare numeric ID

**Entry Identity**:
The data-domain-scoped RPG Maker MV ID that identifies one DSL-owned data entry.
_Avoid_: display name, generated UUID, manifest-only binding

**Display Name**:
The RPG Maker MV name field shown to developers and players without serving as Entry Identity.
_Avoid_: entry identity, unique key, reference target

**System Data**:
The RPG Maker MV project data domain that stores variables, switches, and other system-level configuration.
_Avoid_: event data store, project snapshot, workspace data state

**DSL Decompilation**:
The workspace operation that turns a Project Data Snapshot into compilable DSL declarations with explicit Entry Identities, using raw escape hatches when needed.
_Avoid_: scaffold, clone, pull, compile, perfect round-trip

**Decompiled Source**:
DSL source generated by DSL Decompilation as a non-destructive starting point for taking over DSL-Owned Project Data.
_Avoid_: handwritten DSL, generated project data, overwrite output

**Sync Manifest**:
Workspace metadata that records synchronization state such as project data identity, file hashes, and allocated RPG Maker MV IDs.
_Avoid_: generated output, project data file, lockfile, entry identity binding

**Generated Freshness**:
The condition that Generated Project Data was produced from the current DSL source inputs.
_Avoid_: project drift, entry identity, source ownership

**Definition Binding**:
One Workspace Config entry that maps one Definition Source to one Definition Target.
_Avoid_: source discovery, target inference, file-level merge rule, operation mode

**Definition Target**:
The configured Event Data Store destination for a Definition Binding.
_Avoid_: entry identity, inferred filename target, CLI target override, operation mode

**Event Data Management**:
The tool layer that reads, validates, creates, and replaces event entries in an Event Data Store.
_Avoid_: database management, editor automation

**Event Data Operation**:
A tool-planned create or replace action for one event entry in an Event Data Store.
_Avoid_: partial update, merge

**Explicit Replacement**:
An Event Data Operation that overwrites a named existing event only when replacement is declared directly.
_Avoid_: merge, update, sync

**Append-Only ID Allocation**:
The create behavior that assigns a new event ID at the end of the target MV data array instead of reusing null slots.
_Avoid_: first-empty-slot allocation, custom ID creation

**Operation Mode**:
The tool-selected intent for applying Event Definitions, such as create or replace.
_Avoid_: definition target, event definition metadata

**Definition Lint**:
A read-only tool check for Event Definition shape, target configuration, and authoring conventions.
_Avoid_: static-only lint, apply, smoke test

**Project-Aware Validation**:
A validation pass that checks Event Definitions and planned operations against the configured RPG Maker MV project data.
_Avoid_: type checking only, best-effort apply

**Apply Preview**:
A read-only create or replace run that reports planned event data changes without writing files.
_Avoid_: lint, partial apply

**Entry-Level Summary**:
A preview report that lists affected event entries and target files without showing command-level semantic differences.
_Avoid_: semantic event diff, raw-only diff

**MV-Style JSON Writer**:
A stable JSON writer that approximates RPG Maker MV editor output for event data files.
_Avoid_: generic pretty print, whitespace-preserving text patch

**Compiler Default**:
A documented built-in value used to complete MV runtime-required output fields omitted from the TypeScript input schema.
_Avoid_: config default, inherited old value

## Relationships

- Developers use the **Event DSL** to author **Event Definitions** and **DSL Commands**.
- An **Event Definition** contains command lists made of **DSL Commands**.
- A **Named Event Export** is the only first-version module boundary for collecting **Event Definitions**.
- A **Map Event** contains pages whose command lists are made of **Raw Event Commands**.
- A **Common Event** contains a command list made of **Raw Event Commands**.
- Event pages, map events, and common events use the **Schema-First DSL** style with named object fields.
- An **Empty Command List** is valid for event pages and common events.
- A map event **Event Page List** must contain at least one page.
- A **Common Event Trigger** of autorun or parallel requires an explicit switch reference.
- A **Map Page Trigger** defaults to action and supports all RPG Maker MV page trigger modes in the first version.
- Page conditions use **Page Condition Slots** and combine as AND conditions.
- A **DSL Command** compiles to one or more **Raw Event Commands**.
- A **Raw DSL Command** is a **DSL Command** that directly carries raw RPG Maker MV command fields.
- A **Supported Event Command** has a corresponding **DSL Command** or command helper.
- RPG Maker MV event commands outside **Supported Event Commands** require a **Raw DSL Command** or are unsupported.
- **DSL Commands** use **Function-Style Command Helpers** with schema-first object inputs.
- A **Common Event DSL Command** is a **DSL Command**.
- A **Common Event DSL Command** uses a **Project Data Reference** to identify a **Common Event**.
- A **Common Event** may be defined by an **Event Definition** and may be run by a **Common Event DSL Command**.
- A **Plugin DSL Command** does not require a **Plugin Command Registry**.
- A **Plugin Command Registry** may validate a **Plugin DSL Command** at lint time.
- **Plugin DSL Command** uses named fields for the command and its arguments.
- **Script Input** uses a `code` field for script lines and requires explicit config enablement.
- **Script Input** requires the **Script Command Gate** before compilation.
- A script command may be a **Supported Event Command** and still be blocked by the **Script Command Gate**.
- The **Script Command Gate** applies to **Script Input**, not to **Raw DSL Commands**.
- **Project Data References** use `xxxRef` helper names to distinguish references from definitions.
- **External Project Data References** are resolved from **Project Data Snapshots** and do not imply **DSL-Owned Project Data**.
- **Explicit ID References** are allowed, while bare numeric IDs are not valid DSL references.
- A **Project Index** resolves names used by **Project Data References** to RPG Maker MV IDs.
- A **Project Root** must be configured explicitly and must contain a `.rpgproject` file.
- A **Workspace** contains the local configuration that resolves a **Project Root**.
- A **Sample Workspace** is a repository fixture that follows the same shape as a Workspace for testing and examples.
- A **Workspace Initialization** command creates the initial Workspace structure.
- A **Workspace Initialization** command creates only the `src/` directory.
- A **Workspace Initialization** command requires a `projectRoot`.
- The **Workspace Config** file is named `rmmv-event-dsl.config.json`.
- A **Workspace Config** contains a **Project Root**, zero or more **Definition Bindings**, and the **Script Command Gate**.
- A **Workspace** may contain **Workspace Data State** maintained by the tool.
- **Workspace Data State** includes **Generated Project Data**, **Project Data Snapshots**, and a **Sync Manifest**.
- **Generated Project Data** is produced from Event DSL compilation before any Project Root write.
- **Generated Project Data** may store whole RPG Maker MV data files as carriers for DSL-owned data domains.
- Non-owned data domains in **Generated Project Data** are carried forward from a **Project Data Snapshot**.
- **Compile Output** is complete for all **DSL-Owned Project Data** domains in the current Workspace.
- Compilation validates the **Staged Data Graph** before producing **Compile Output**.
- A **Staged Data Graph** may include **External Project Data References** for read-only project data needed by DSL-owned entries.
- Compilation requires a **Project Data Snapshot** in the first version.
- **Clone** captures the first **Project Data Snapshot** from a **Project Root**.
- **Pull** refreshes an existing **Project Data Snapshot** from a **Project Root**.
- **Push** writes **Generated Project Data** to a **Project Root** only after synchronization checks pass.
- A successful **Push** refreshes the affected **Project Data Snapshot** and **Sync Manifest**.
- A **Project Data Snapshot** is captured from a Project Root for comparison and reconciliation.
- A **Project Data Snapshot** may store whole RPG Maker MV data files even when **DSL-Owned Project Data** covers only selected **Data Domains** within those files.
- **Project Drift** is a mismatch between a **Project Data Snapshot** and the current **Project Root** state.
- A **Snapshot-Only Owned Entry** appears when **Compile Output** omits an entry that exists in the **Project Data Snapshot** for a **DSL-Owned Project Data** domain.
- A **Destructive Change** is only applied by a **Destructive Push**.
- A **Destructive Push** does not bypass **Generated Freshness** or **Project Drift** checks.
- **Entry Removal** for event arrays preserves RPG Maker MV IDs by leaving null holes instead of compacting arrays.
- **Entry Removal** for variable and switch arrays preserves RPG Maker MV IDs by writing empty strings instead of compacting arrays.
- **Diff** compares **Generated Project Data** with a **Project Data Snapshot**.
- A **Diff** is a **Structured Diff Report**.
- A **Structured Diff Report** may include **Reconciliation Hints** for raw MV changes that can be represented in DSL.
- **DSL-Owned Project Data** is defined by **Data Domain**, not by whole files.
- The first intended **DSL-Owned Project Data** domains are the **Event Data Store** and the variable and switch entries stored in **System Data**.
- A DSL-owned data entry is identified by an explicit **Entry Identity**.
- DSL-owned data entries must declare their **Entry Identity** in the first version.
- A **Display Name** does not need to be unique among DSL-owned data entries.
- Name-based **Project Data References** are valid only when the **Display Name** resolves to exactly one entry.
- **DSL Decompilation** creates initial DSL declarations from a **Project Data Snapshot**.
- **DSL Decompilation** produces **Decompiled Source** for all **DSL-Owned Project Data** domains.
- **Decompiled Source** is written non-destructively in the first version.
- A **Sync Manifest** records file hashes for **Generated Project Data** and **Project Data Snapshots**.
- A **Sync Manifest** does not record **Entry Identity** bindings in the first version.
- A **Sync Manifest** may record DSL source hashes to check **Generated Freshness**.
- **Push** requires **Generated Freshness** in the first version.
- **Diff** requires **Generated Freshness** in the first version.
- The **Project Root** path in a **Workspace Config** is resolved relative to the **Workspace Root**.
- The **Workspace Config** uses `projectRoot` for the MV project directory.
- A **Definition Binding** maps exactly one **Definition Source** to exactly one **Definition Target**, such as a single map or Common Events.
- A **Definition Source** is a TypeScript source file selected by **Definition Source Discovery**.
- **Definition Source Discovery** replaces **Definition Bindings** for workspace-level compilation.
- The first-version **Definition Source Discovery** selects TypeScript files recursively from the Workspace source root.
- **Decompiled Source** participates in **Definition Source Discovery** unless moved outside the Workspace source root.
- **Entry Identity** determines the target project data entry for a DSL-owned definition.
- Non-`init` commands require the current directory to be a **Workspace Root**.
- The tool derives **Event Data Operations** from **Event Definitions** and tool configuration.
- **Event Data Operations** may create entries or perform **Explicit Replacement** for **Map Events** and **Common Events**.
- **Event Data Operations** may create or replace a single entry or many entries, while preserving undeclared entries in the target file.
- **Event Data Management** supports read, create, and replace in the first version; delete and partial update are outside the first-version scope.
- Create operations use **Append-Only ID Allocation** in the first version.
- Create operations fail when the target event name already exists.
- Replace operations require the target event name to exist exactly once.
- An **Operation Mode** is selected separately from the **Definition Target**.
- A first-version tool run applies exactly one **Operation Mode** to all selected **Event Definitions**.
- **Compile** with check-only behavior replaces **Definition Lint** in the workspace compile model.
- Create and replace runs must perform **Project-Aware Validation** before writing any Event Data Store files.
- Create and replace workflows derive **Event Data Operations** before writing.
- **Apply Preview** is available through dry-run and diff options for first-version create and replace runs.
- **Apply Preview** reports **Event Data Operations** without writing files.
- Dry-run output uses an **Entry-Level Summary**.
- Diff output combines an **Entry-Level Summary** with full-file unified diffs.
- The first version writes changed `Map###.json` and `CommonEvents.json` files with an **MV-Style JSON Writer**.
- **Compiler Defaults** are built in, documented, and overridable through explicit DSL fields; the first version does not support configuration-level default overrides.
- A map **Definition Target** must come from configuration in the first version, not from the file name or CLI target arguments.
- Map event coordinates must be within map bounds; coordinate occupancy is a lint warning, not an error.
- Script commands require the **Script Command Gate** in the first version.

## Example Dialogue

> **Dev:** "Can an **Event Definition** include a command with no DSL helper yet?"
> **Domain expert:** "Only through a **Raw DSL Command**, which is distinct from the compiled **Raw Event Command** output."

## Flagged Ambiguities

- "Common Event" was resolved as user-defined RPG Maker MV project data, not a runtime-provided event.
- "Common Event Call" was rejected in favor of **Common Event DSL Command** to align with the DSL Command taxonomy.
- "Patch" was resolved to use **Explicit Replacement** for the first version, not merge or partial update.
- "File-level replace" was resolved as **Event Data Operations** applied entry-by-entry, not DSL ownership of the whole JSON file.
- "Event Patch" was rejected because **Event Data Operations** express the tool-produced create and replace work more directly.
- "Patch script" was rejected as user-facing language; developers author **Event Definitions**, while the tool derives **Event Data Operations**.
- "Event Definition" was resolved as a single DSL value, not the TypeScript module that contains it.
- "Event Node" was rejected as too compiler-centric; the canonical term for command-list input values is **DSL Command**.
- "Raw command" terminology was resolved as two concepts: **Raw DSL Command** is the DSL escape hatch, while **Raw Event Command** is the compiled MV command object.
- "Initial Command Coverage" was rejected as milestone language; the stable boundary term is **Supported Event Command**.
- "Event database" was rejected as canonical language; the project uses **Event Data Store** and **Event Data Management** to avoid implying database semantics.
- "Map target" was resolved as configuration-owned; the first version does not infer map targets from file names or accept CLI target overrides.
- "Definition target" was resolved as target-only configuration; create and replace are **Operation Modes**, not target metadata.
- "Definition Binding" was resolved as the source-to-target mapping; **Definition Target** is only the destination side of that mapping.
- "Operation mode" was resolved as run-level intent; one first-version run cannot mix create and replace.
- "Event definition export" was resolved as named exports only; default exports and exported helpers are outside the first-version shape.
- "Export name" was resolved as non-semantic; the RPG Maker MV event name inside the **Event Definition** is the target name.
- "Lint" was resolved as project-aware by default, not a static-only TypeScript scan.
- "Apply failure" was resolved as no-write on validation or planning errors; the tool must not write partial results after a failed project-aware check.
- "Preview" was resolved as first-version scope; create and replace support both dry-run summaries and diffs.
- "Diff" was resolved as full-file unified diff plus entry-level summary; semantic event diffs are outside first-version scope.
- "JSON formatting" was resolved as stable MV-style writing for changed event data files, not generic pretty printing or original-whitespace preservation.
- "Defaults" were resolved as built-in compiler behavior, not project configuration and not inheritance from replaced entries.
- "Page API" was resolved as a single object with named fields, including `commands`.
- "Top-level event API" was resolved as single-object schema for both map events and common events.
- "Empty commands" were resolved as valid DSL input that compiles to the MV end marker.
- "Commands field" was resolved as required even when the command list is empty.
- "Map event pages" were resolved as required and non-empty in the DSL.
- "Common event trigger" was resolved as supporting none, autorun, and parallel; autorun and parallel require an explicit switch.
- "Map page trigger" was resolved as supporting action, playerTouch, eventTouch, autorun, and parallel with action as the default.
- "Page conditions" were resolved as object-shaped fixed slots, not arbitrary boolean expressions.
- "Project reference helper names" were resolved as `xxxRef`, such as `itemRef`, `mapRef`, and `commonEventRef`.
- "Project Reference" was rejected because it sounded like a reference to the project itself; the canonical term is **Project Data Reference**.
- "Numeric references" were resolved as explicit ID helper calls, not bare numbers; reasons are optional and may be linted.
- "Plugin command registry" was resolved as optional lint-time metadata, not a runtime requirement.
- "Plugin Command Input" was rejected because the value is a **DSL Command**; the canonical term is **Plugin DSL Command**.
- "Script input" was resolved as schema-first object form with a `code` field.
- "Command node API" was resolved as function-style helpers with object inputs, not positional builders.
- "Create ID allocation" was resolved as append-only; the first version does not reuse null holes or support custom new IDs.
- "Create and replace name matching" was resolved as strict: create requires no existing name, replace requires exactly one existing name.
- "Map coordinates" were resolved as bounds-checked errors with coordinate occupancy warnings.
- "Script command enablement" was rejected as unclear; the canonical term is **Script Command Gate**.
- "Script command" was resolved as config-gated rather than reason-gated at the command level.
- "Local data layer" was rejected as too implementation-shaped; **Workspace Data State** is the canonical umbrella term.
- "Output folder" was rejected as canonical language because it hides the distinction between **Generated Project Data** and **Project Data Snapshots**.
- "Editable local JSON" was rejected as a source-of-truth model; workspace-local data is tool-maintained synchronization state.
- "Managed Project Data" was rejected because it implies partial ownership; **DSL-Owned Project Data** is the canonical term for project data whose desired state comes from the Event DSL.
- "File-level ownership" was rejected because the intended boundary is **Data Domain**, not whole JSON files.
- "Apply" was rejected as the primary user-facing materialization term; **Compile** is the canonical term for producing **Compile Output**.
- "Force push" was rejected for the first version; **Push** is intentionally conservative and requires a fresh **Pull** after **Project Drift**.
- "Force push" remains distinct from **Destructive Push**; destructive intent does not bypass synchronization checks.
- "Raw text diff" was rejected as the primary comparison format; **Diff** is a **Structured Diff Report**.
- "Scaffold" was rejected because it sounds like workspace initialization; **DSL Decompilation** is the canonical term for generating DSL declarations from a **Project Data Snapshot**.
- "Overwrite decompilation" was rejected for the first version; **Decompiled Source** must be written non-destructively.
- "System variables" and "system switches" were split into **Variable Definition** and **Switch Definition** as DSL-authored data domains.
- "Manifest-only binding" was rejected for DSL-owned data entries; **Entry Identity** is expressed as a data-domain-scoped RPG Maker MV ID.
- "Entry identity binding" was rejected as **Sync Manifest** responsibility; **Entry Identity** belongs in DSL source.
- "Name identity" was rejected for DSL-owned data entries because RPG Maker MV allows duplicate display names.
- "Unique display name" was rejected as a DSL-owned entry requirement; uniqueness belongs to **Entry Identity**.
- "Project drift validation" was rejected as a compile responsibility; **Compile** validates the **Staged Data Graph**, while **Push** checks **Project Drift**.
- "Definition Binding" was rejected for the workspace compile model; **Definition Source Discovery** selects source files, while **Entry Identity** identifies target entries.
- "Definition Lint" was rejected as a first-version command in the workspace compile model; check-only compilation is the validation path.
