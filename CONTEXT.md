# RPG Maker Event DSL

This context defines the language for a TypeScript-first authoring layer that turns intentional RPG Maker event changes into validated project data for supported RPG Maker engines.

## Language

**Event DSL**:
The TypeScript authoring surface for defining RPG Maker events and event commands before compilation to supported project data.
_Avoid_: raw JSON editing, patch script, editor automation

**Agent Event Authoring Skill**:
A repo-owned agent skill that helps an agent turn RPG Maker MV gameplay intent into idiomatic Event DSL source and validate it through the Workspace workflow.
_Avoid_: MV script authoring, scriptwriting, CLI workflow skill, raw JSON event editing, editor automation

**Distributable Skill Source**:
The project-owned `skills/` tree that contains agent skills intended to be maintained and distributed with the repository.
_Avoid_: scratch prompts, local-only skill copies

**RPG Maker MV Project Data**:
The first supported RPG Maker project data format for Workspace compilation, snapshot, diff, and push behavior.
_Avoid_: generic RPG Maker project data, MZ project data

**Schema-First DSL**:
A TypeScript authoring style for the Event DSL where event structures are expressed as named object fields rather than positional block arguments.
_Avoid_: patch script, positional block DSL

**Event Definition**:
A top-level developer-authored TypeScript DSL value that defines one RPG Maker event.
_Avoid_: patch script, raw event JSON, TypeScript module

**Named Event Export**:
A named TypeScript export whose value is an Event Definition collected by the tool.
_Avoid_: default export, exported helper

**Definition Source**:
A TypeScript source file selected by Definition Source Discovery for workspace-level compilation.
_Avoid_: helper module, generated project data, target mapping

**Definition Source Discovery**:
The Workspace Config behavior that selects DSL source files for workspace-level compilation.
_Avoid_: definition binding, target mapping, all TypeScript files

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
One RPG Maker MV editor event command family that the DSL can represent and compile without using a Raw DSL Command.
_Avoid_: Initial Command Coverage, complete MV command coverage

**Continuation Event Command**:
A Raw Event Command that RPG Maker MV uses as part of another editor event command's body, branch, or continuation.
_Avoid_: Supported Event Command helper, public command helper, standalone editor command

**Function-Style Command Helper**:
A verb-named DSL helper that carries its inputs as a schema-first object rather than positional arguments.
_Avoid_: positional command builder, raw command string

**MV-Aligned Command Helper Name**:
A Function-Style Command Helper name that follows the RPG Maker MV editor event command family name in camelCase.
_Avoid_: simplified helper name, implementation-shaped helper name, incompatible alias

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
A schema-first DSL object that carries JavaScript code for any RPG Maker MV event command input.
_Avoid_: raw script string, implicit enablement

**Script Command Gate**:
The Workspace Config setting that must allow Script Input before it can compile to Raw Event Commands that execute JavaScript.
_Avoid_: Script Command Enablement, per-node reason gate, implicit script support

**Project Data Reference**:
A DSL reference value from an Event Definition to an existing RPG Maker MV project data entry.
_Avoid_: project reference, raw ID, definition builder

**Project Data Reference Scope**:
The project data entry category a Project Data Reference resolves within, such as actor, skill, state, animation, tileset, switch, variable, map, or common event.
_Avoid_: asset namespace, runtime selector, command enum, raw numeric parameter

**External Project Data Reference**:
A read-only reference from DSL-owned data to RPG Maker MV project data outside DSL-Owned Project Data.
_Avoid_: DSL-owned definition, generated data, implicit ownership

**Explicit ID Reference**:
A Project Data Reference that identifies RPG Maker MV data by numeric ID without using a bare number.
_Avoid_: raw numeric ID, implicit ID

**Asset Reference**:
A DSL reference value to an RPG Maker MV asset namespace and filename stem that does not resolve through Project Data References.
_Avoid_: Project Data Reference, raw asset string, scanned asset entry

**Asset Category Reference Helper**:
A category-specific helper for creating an Asset Reference with an explicit RPG Maker MV asset namespace.
_Avoid_: generic assetRef, imgRef, per-folder helper, Project Data Reference helper

**Runtime Selector**:
A schema-first DSL value that selects a runtime RPG Maker MV object or slot for an event command, such as the player, current event, troop enemy index, party actor target, vehicle, or picture slot, without resolving through Project Data References.
_Avoid_: Project Data Reference, database entry reference, Asset Reference

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
The local configuration file `rpgmaker-event-dsl.config.json` in a Workspace that declares the Project Root, source discovery patterns, and tool gates.
_Avoid_: project config, global config, package config, definition binding

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

**Standard Project Data Snapshot**:
A Project Data Snapshot that captures standard RPG Maker MV project data files supported by the workspace compile model.
_Avoid_: full data clone, plugin data snapshot, custom data snapshot

**Project Drift**:
A mismatch between the current Project Root state and the latest Project Data Snapshot.
_Avoid_: stale cache, generated diff, file corruption

**Interrupted Push**:
A Push that started replacing Affected Project Data Files in the Project Root but did not complete the corresponding Project Data Snapshot and Sync Manifest refresh.
_Avoid_: dirty state, failed push, partial push, project drift

**Affected Project Data File**:
A standard project data file that Push would write from Generated Project Data.
_Avoid_: every data file, ignored plugin data, source file

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
_Avoid_: variable reference, runtime variable value, bare numeric ID

**Switch Definition**:
A DSL-authored RPG Maker MV system switch entry that is part of DSL-Owned Project Data.
_Avoid_: switch reference, runtime switch value, bare numeric ID

**Entry Identity**:
The data-domain-scoped RPG Maker MV ID that identifies one DSL-owned data entry.
_Avoid_: display name, generated UUID, manifest-only binding

**Map Event Identity**:
The Entry Identity for a Map Event, made of the map ID and the map-scoped event ID.
_Avoid_: global event ID, display name, event name

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
Workspace metadata that records synchronization file hashes, Generated Freshness data, and Compile Baseline metadata.
_Avoid_: generated output, project data file, lockfile, entry identity binding

**Compile Baseline**:
The current set of inputs that Compile Output depends on, including DSL source inputs, Workspace Config, and the Project Data Snapshot.
_Avoid_: source hash, snapshot freshness, generated state

**Generated Freshness**:
The condition that Generated Project Data was produced from the current Compile Baseline.
_Avoid_: project drift, entry identity, source ownership

**Compile Check**:
A read-only Compile mode that validates discovered DSL source and the Staged Data Graph without writing Generated Project Data.
_Avoid_: standalone lint, dry-run push, source-only check

**Project-Aware Validation**:
A validation pass that checks DSL-owned declarations and references against the Staged Data Graph and Project Data Snapshot.
_Avoid_: type checking only, best-effort apply

**MV-Style JSON Writer**:
A stable JSON writer that approximates RPG Maker MV editor output for event data files.
_Avoid_: generic pretty print, whitespace-preserving text patch

**Compiler Default**:
A documented built-in value used to complete MV runtime-required output fields omitted from the TypeScript input schema.
_Avoid_: config default, inherited old value

## Relationships

- Developers use the **Event DSL** to author **Event Definitions** and **DSL Commands**.
- Agents use the **Agent Event Authoring Skill** to turn RPG Maker MV gameplay intent into **Event DSL** source.
- The **Agent Event Authoring Skill** is used in a **Workspace** to produce **Definition Source** for a user's RPG Maker MV game project.
- The **Agent Event Authoring Skill** may guide **Workspace Initialization**, **Clone**, and **DSL Decompilation** before authoring **Definition Source**.
- The **Agent Event Authoring Skill** covers both initial takeover and ongoing authoring as one distributed skill.
- The **Agent Event Authoring Skill** is centered on authoring judgment: gameplay intent to RPG Maker MV event shape to **Event DSL** source, with Workspace workflow as support.
- The **Agent Event Authoring Skill** may fill in idiomatic RPG Maker MV event structure but should not invent substantial story or dialogue content without user intent.
- The **Agent Event Authoring Skill** may use a confirmed **Raw DSL Command** escape hatch when no **Supported Event Command** exists for the intended RPG Maker MV behavior.
- The **Agent Event Authoring Skill** may use **Script Input** and **Plugin DSL Command** when they are grounded in user intent, project evidence, or plugin documentation, and **Script Input** remains subject to the **Script Command Gate**.
- The **Agent Event Authoring Skill** may add short functional player-facing text but should not expand story, tone, or character voice without user intent.
- The **Agent Event Authoring Skill** follows the repository's current Event DSL version while respecting the installed package and local source style in a user's **Workspace**.
- The **Distributable Skill Source** is the source of truth for the **Agent Event Authoring Skill**.
- The README may point to the **Agent Event Authoring Skill**, but the skill folder owns the detailed agent-facing guidance.
- Installation guidance for the **Agent Event Authoring Skill** belongs in the project README, not inside the runtime skill instructions.
- An **Event Definition** contains command lists made of **DSL Commands**.
- A **Named Event Export** is the module boundary for collecting **Event Definitions**.
- A **Map Event** contains pages whose command lists are made of **Raw Event Commands**.
- A **Common Event** contains a command list made of **Raw Event Commands**.
- Event pages, map events, and common events use the **Schema-First DSL** style with named object fields.
- An **Empty Command List** is valid for event pages and common events.
- A map event **Event Page List** must contain at least one page.
- A **Common Event Trigger** of autorun or parallel requires an explicit switch reference.
- A **Map Page Trigger** defaults to action and supports all RPG Maker MV page trigger modes.
- Page conditions use **Page Condition Slots** and combine as AND conditions.
- A **DSL Command** compiles to one or more **Raw Event Commands**.
- A **Raw DSL Command** is a **DSL Command** that directly carries raw RPG Maker MV command fields.
- A **Supported Event Command** has a corresponding **DSL Command** or command helper.
- A **Continuation Event Command** is represented through the parent **Supported Event Command**, not as its own **Function-Style Command Helper**.
- RPG Maker MV event commands outside **Supported Event Commands** require a **Raw DSL Command** or are unsupported.
- **DSL Commands** use **Function-Style Command Helpers** with schema-first object inputs.
- **Function-Style Command Helpers** use **MV-Aligned Command Helper Names**.
- A **Common Event DSL Command** is a **DSL Command**.
- A **Common Event DSL Command** uses a **Project Data Reference** to identify a **Common Event**.
- A **Common Event** may be defined by an **Event Definition** and may be run by a **Common Event DSL Command**.
- A **Plugin DSL Command** does not require a **Plugin Command Registry**.
- A **Plugin Command Registry** may validate a **Plugin DSL Command** at lint time.
- **Plugin DSL Command** uses named fields for the command and its arguments.
- **Script Input** uses a `code` field for JavaScript-bearing command inputs and requires explicit config enablement.
- **Script Input** requires the **Script Command Gate** before compilation.
- A JavaScript-bearing command input may belong to a **Supported Event Command** and still be blocked by the **Script Command Gate**.
- The **Script Command Gate** applies to **Script Input**, not to **Raw DSL Commands**.
- **Project Data References** use `xxxRef` helper names to distinguish references from definitions.
- **External Project Data References** are resolved from **Project Data Snapshots** and do not imply **DSL-Owned Project Data**.
- **Explicit ID References** are allowed, while bare numeric IDs are not valid DSL references.
- **Asset References** are separate from **Project Data References** and do not resolve to RPG Maker MV data entry IDs.
- **Asset References** use **Asset Category Reference Helpers** rather than a generic asset reference helper.
- **Runtime Selectors** do not use **Project Data Reference Scopes** and do not resolve through the **Staged Data Graph**.
- Name-based **Project Data References** must resolve to exactly one visible entry in the **Staged Data Graph**.
- Name-based references to **DSL-Owned Project Data** domains resolve against DSL-owned entries in the **Staged Data Graph**, not by falling back to the **Project Data Snapshot**.
- Name-based **External Project Data References** resolve against the **Standard Project Data Snapshot**.
- **Explicit ID References** must resolve to an existing visible entry in the same reference scope as name-based **Project Data References**.
- **Raw DSL Commands** are not semantically validated for embedded **Project Data References**.
- The **Staged Data Graph** resolves names used by **Project Data References** to RPG Maker MV IDs.
- A **Project Root** must be configured explicitly and must contain a `.rpgproject` file.
- A **Workspace** contains the local configuration that resolves a **Project Root**.
- A **Sample Workspace** is a repository fixture that follows the same shape as a Workspace for testing and examples.
- A **Workspace Initialization** command creates the initial Workspace structure.
- A **Workspace Initialization** command creates only the `src/` directory.
- A **Workspace Initialization** command requires a `projectRoot`.
- The **Workspace Config** file is named `rpgmaker-event-dsl.config.json`.
- A **Workspace Config** contains a **Project Root**, Definition Source Discovery fields, and the **Script Command Gate**.
- A **Workspace** may contain **Workspace Data State** maintained by the tool.
- **Workspace Data State** includes **Generated Project Data**, **Project Data Snapshots**, and a **Sync Manifest**.
- **Generated Project Data** is produced from Event DSL compilation before any Project Root write.
- **Generated Project Data** may store whole RPG Maker MV data files as carriers for DSL-owned data domains.
- **Generated Project Data** contains complete carrier output for **DSL-Owned Project Data** domains, not only changed files.
- Non-owned data domains in **Generated Project Data** are carried forward from a **Project Data Snapshot**.
- **Compile Output** is complete for all **DSL-Owned Project Data** domains in the current Workspace.
- Compilation validates the **Staged Data Graph** before producing **Compile Output**.
- A **Staged Data Graph** may include **External Project Data References** for read-only project data needed by DSL-owned entries.
- Compilation requires a **Project Data Snapshot**.
- **Clone** captures the first **Project Data Snapshot** from a **Project Root**.
- **Pull** refreshes an existing **Project Data Snapshot** from a **Project Root**.
- **Clone** and **Pull** capture a **Standard Project Data Snapshot**.
- **Push** writes **Generated Project Data** to a **Project Root** only after synchronization checks pass.
- A successful **Push** refreshes the affected **Project Data Snapshot** and **Sync Manifest**.
- A **Project Data Snapshot** is captured from a Project Root for comparison and reconciliation.
- A **Standard Project Data Snapshot** includes standard RPG Maker MV database files and map files referenced by `MapInfos.json`.
- A **Standard Project Data Snapshot** excludes non-standard project data files.
- A **Project Data Snapshot** may store whole RPG Maker MV data files even when **DSL-Owned Project Data** covers only selected **Data Domains** within those files.
- **Project Drift** is a mismatch between a **Project Data Snapshot** and the current **Project Root** state.
- An **Interrupted Push** is not ordinary **Project Drift** because the mismatch may have been produced by an incomplete **Push**.
- **Push** checks **Project Drift** for **Affected Project Data Files**.
- **Affected Project Data Files** are derived from differences between **Generated Project Data** and the **Project Data Snapshot**.
- **Push** writes only **Affected Project Data Files**.
- **Push** stages **Affected Project Data Files** before replacing Project Root files.
- **Push** refreshes the **Project Data Snapshot** and **Sync Manifest** only after all affected Project Root files are replaced successfully.
- **Push** may complete or abandon a recoverable **Interrupted Push** before continuing.
- Commands that detect an unrecoverable **Interrupted Push** must stop instead of using potentially inconsistent Workspace Data State or Project Root data.
- An unrecoverable **Interrupted Push** requires explicit restoration before Workspace workflow commands may continue.
- **Interrupted Push** recovery is based on observed Project Root file contents, not trusted per-file write progress.
- Non-Push Workspace workflow commands must stop when an **Interrupted Push** is pending.
- **Pull** must not silently capture an **Interrupted Push** as a normal **Project Data Snapshot**.
- Non-standard project data files do not participate in **Project Drift** checks.
- A **Snapshot-Only Owned Entry** appears when **Compile Output** omits an entry that exists in the **Project Data Snapshot** for a **DSL-Owned Project Data** domain.
- A **Destructive Change** is only applied by a **Destructive Push**.
- A **Destructive Push** does not bypass **Generated Freshness** or **Project Drift** checks.
- **Entry Removal** for event arrays preserves RPG Maker MV IDs by leaving null holes instead of compacting arrays.
- **Entry Removal** for variable and switch arrays preserves RPG Maker MV IDs by writing empty strings instead of compacting arrays.
- **Entry Removal** uses explicit hole values in dense RPG Maker MV ID arrays.
- **Generated Project Data** does not use sparse arrays for RPG Maker MV ID arrays.
- A **Variable Definition** represents a `System.json` variable name entry, not a runtime variable value.
- A **Switch Definition** represents a `System.json` switch name entry, not a runtime switch value.
- Empty variable and switch name slots are ID-preserving holes, not **Variable Definitions** or **Switch Definitions**.
- **Diff** compares **Generated Project Data** with a **Project Data Snapshot**.
- A **Diff** is a **Structured Diff Report**.
- A **Structured Diff Report** may include **Reconciliation Hints** for raw MV changes that can be represented in DSL.
- A **Structured Diff Report** has an internal structured model and human-readable CLI output.
- **Diff** may list **Affected Project Data Files** derived from comparing **Generated Project Data** with a **Project Data Snapshot**.
- A file-filtered **Diff** reports destructive status for the filtered view while preserving the overall destructive status of the full **Structured Diff Report**.
- The Diff CLI uses `--file` for filtering the **Structured Diff Report** by Project Data File.
- A file-filtered **Diff** with no changes for the selected Project Data File reports an empty filtered result instead of failing.
- A file-filtered **Diff** rejects unknown or unsafe Project Data File names.
- **DSL-Owned Project Data** is defined by **Data Domain**, not by whole files.
- A **DSL-Owned Project Data** domain is taken over as a whole; entries in that domain that are present in the **Project Data Snapshot** but absent from **Compile Output** are **Snapshot-Only Owned Entries**.
- The first intended **DSL-Owned Project Data** domains are the **Event Data Store** and the variable and switch entries stored in **System Data**.
- A DSL-owned data entry is identified by an explicit **Entry Identity**.
- A **Map Event** is identified by a **Map Event Identity**.
- DSL-owned data entries must declare their **Entry Identity**.
- A **Map Event Identity** is unique by map ID and event ID together, not by event ID alone.
- A **Display Name** does not need to be unique among DSL-owned data entries.
- Name-based **Project Data References** are valid only when the **Display Name** resolves to exactly one entry.
- **DSL Decompilation** creates initial DSL declarations from a **Project Data Snapshot**.
- **DSL Decompilation** produces **Decompiled Source** for all **DSL-Owned Project Data** domains.
- **Decompiled Source** is written non-destructively.
- **Decompiled Source** is written under the Workspace source root.
- A **Sync Manifest** records file hashes for **Generated Project Data** and **Project Data Snapshots**.
- A **Sync Manifest** does not record **Entry Identity** bindings.
- A **Compile Baseline** includes the current DSL source inputs, **Workspace Config**, and **Project Data Snapshot**.
- A **Sync Manifest** may record **Compile Baseline** hashes to check **Generated Freshness**.
- **Push** requires **Generated Freshness**.
- **Diff** requires **Generated Freshness**.
- **Compile** with check-only behavior is read-only and does not create **Generated Freshness**.
- The **Project Root** path in a **Workspace Config** is resolved relative to the **Workspace Root**.
- The **Workspace Config** uses `projectRoot` for the MV project directory.
- A **Definition Source** is a TypeScript source file selected by **Definition Source Discovery**.
- **Definition Source Discovery** is the workspace-level source selection model.
- **Definition Source Discovery** selects DSL declaration files from the Workspace source root using include and exclude patterns.
- **Decompiled Source** participates in **Definition Source Discovery** unless moved outside the Workspace source root.
- **Entry Identity** determines the target project data entry for a DSL-owned definition.
- Non-`init` commands require the current directory to be a **Workspace Root**.
- **Compile** with check-only behavior is the read-only validation path.
- **Compile** with check-only behavior does not write **Generated Project Data** or update the **Sync Manifest**.
- **Project-Aware Validation** runs before **Generated Project Data** is written.
- **Diff** emits a **Structured Diff Report** grouped by **Data Domain** and **Entry Identity**.
- Changed `Map###.json`, `CommonEvents.json`, and `System.json` files are written with an **MV-Style JSON Writer** during **Push**.
- **Compiler Defaults** are built in, documented, and overridable through explicit DSL fields.
- A map target comes from **Map Event Identity**, not from the file name or CLI target arguments.
- Map event coordinates must be within map bounds; coordinate occupancy is a validation warning, not an error.
- Script commands require the **Script Command Gate**.

## Example Dialogue

> **Dev:** "Can an **Event Definition** include a command with no DSL helper yet?"
> **Domain expert:** "Only through a **Raw DSL Command**, which is distinct from the compiled **Raw Event Command** output."

## Flagged Ambiguities

- "Common Event" was resolved as user-defined RPG Maker MV project data, not a runtime-provided event.
- "Common Event Call" was rejected in favor of **Common Event DSL Command** to align with the DSL Command taxonomy.
- "Patch" was rejected because the workspace compile model uses **Compile Output**, **Diff**, and **Push** rather than partial update scripts.
- "File-level replace" was rejected because **DSL-Owned Project Data** is defined by **Data Domain**, not whole JSON files.
- "Event Patch" was rejected because developers author **Event Definitions** and the tool materializes **Generated Project Data**.
- "Event Definition" was resolved as a single DSL value, not the TypeScript module that contains it.
- "Event Node" was rejected as too compiler-centric; the canonical term for command-list input values is **DSL Command**.
- "Raw command" terminology was resolved as two concepts: **Raw DSL Command** is the DSL escape hatch, while **Raw Event Command** is the compiled MV command object.
- "Initial Command Coverage" was rejected as milestone language; the stable boundary term is **Supported Event Command**.
- "Complete MV command coverage" was resolved as coverage of RPG Maker MV 1.6.1 editor event command families, not standalone public helpers for **Continuation Event Commands**.
- "Single-target helper names" for MV plural command families were rejected; **MV-Aligned Command Helper Names** preserve the editor command family naming, including plural wording.
- "Event database" was rejected as canonical language; the project uses **Event Data Store** to avoid implying database semantics.
- "Map target" was rejected as configuration-owned; **Map Event Identity** carries the map ID.
- "Definition target" was rejected for the workspace compile model; **Entry Identity** identifies target entries.
- "Definition Binding" was rejected for the workspace compile model; **Definition Source Discovery** selects source files.
- "Event definition export" was resolved as named exports only; default exports and exported helpers are outside the supported source shape.
- "Export name" was resolved as non-semantic; the RPG Maker MV event name inside the **Event Definition** is the target name.
- "Lint" was resolved as project-aware by default, not a static-only TypeScript scan.
- "Apply failure" was resolved as no-write on validation or planning errors; the tool must not write partial results after a failed project-aware check.
- "Preview" was rejected as the primary review term; **Diff** is the workspace review command.
- "Raw text diff" was rejected as the primary comparison format; **Diff** is a **Structured Diff Report**.
- "Agent skill" was resolved as a project-distributed authoring aid when it lives under the **Distributable Skill Source**.
- "Source-repository agent workflow" was rejected as the normal context for the **Agent Event Authoring Skill**; it targets user **Workspaces** and produces user game **Definition Source**.
- "Existing Workspace only" was rejected as the scope of the **Agent Event Authoring Skill**; the skill may cover **Workspace Initialization**, **Clone**, and **DSL Decompilation** so an agent can take over the full authoring flow.
- "Separate onboarding and authoring skills" was rejected for the first distributed **Agent Event Authoring Skill**; initial takeover and ongoing authoring stay in one skill.
- "CLI workflow skill" was rejected as the organizing center for the **Agent Event Authoring Skill**; Workspace commands support the authoring flow rather than defining it.
- "Translator-only agent behavior" was rejected for the **Agent Event Authoring Skill**; the skill may choose idiomatic RPG Maker MV event structure, but substantial story and dialogue invention requires user intent.
- "Supported helpers only" was rejected for the **Agent Event Authoring Skill**; a confirmed **Raw DSL Command** is allowed when no **Supported Event Command** can express the intended RPG Maker MV behavior.
- "Script and plugin commands disabled by default" was rejected for the **Agent Event Authoring Skill**; they are allowed when grounded, with **Script Input** still gated by the **Script Command Gate**.
- "Placeholder-only event text" was rejected for the **Agent Event Authoring Skill**; short functional text is allowed so authored events are playable.
- "Multi-version skill matrix" was rejected for the first **Agent Event Authoring Skill**; the distributed skill tracks the current repository version and checks local Workspace evidence when helper signatures are uncertain.
- "Standalone agent authoring docs page" was deferred for the first **Agent Event Authoring Skill**; the README acts as an entry point and the skill folder owns the detailed guidance.
- "Skill-local installation guide" was rejected for the first **Agent Event Authoring Skill**; installation guidance stays at the project README entry point.
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
- "Asset references" were resolved as **Asset References**, not **Project Data References**, because RPG Maker MV asset filenames do not identify database entries.
- "Generic assetRef", "imgRef", and per-folder asset helpers were rejected in favor of **Asset Category Reference Helpers** with explicit RPG Maker MV asset namespaces.
- "Snapshot fallback" was rejected for name-based references to **DSL-Owned Project Data** domains; unresolved DSL-owned names fail instead of resolving to snapshot entries.
- "Plugin command registry" was resolved as optional lint-time metadata, not a runtime requirement.
- "Plugin Command Input" was rejected because the value is a **DSL Command**; the canonical term is **Plugin DSL Command**.
- "Script input" was resolved as schema-first object form with a `code` field.
- "Script command only" was rejected for the **Script Command Gate**; all JavaScript-bearing **Script Inputs** are gated.
- "Command node API" was resolved as function-style helpers with object inputs, not positional builders.
- "Create ID allocation" was rejected for DSL-owned entries; **Entry Identity** uses explicit RPG Maker MV IDs.
- "Create and replace name matching" was rejected because **Display Name** is not **Entry Identity**.
- "Map coordinates" were resolved as bounds-checked errors with coordinate occupancy warnings.
- "Script command enablement" was rejected as unclear; the canonical term is **Script Command Gate**.
- "Script command" was resolved as config-gated rather than reason-gated at the command level.
- "Local data layer" was rejected as too implementation-shaped; **Workspace Data State** is the canonical umbrella term.
- "Output folder" was rejected as canonical language because it hides the distinction between **Generated Project Data** and **Project Data Snapshots**.
- "Editable local JSON" was rejected as a source-of-truth model; workspace-local data is tool-maintained synchronization state.
- "Managed Project Data" was rejected because it implies partial ownership; **DSL-Owned Project Data** is the canonical term for project data whose desired state comes from the Event DSL.
- "File-level ownership" was rejected because the intended boundary is **Data Domain**, not whole JSON files.
- "Partial entry takeover" was rejected for the first workspace compile model; brownfield migration takes over a **DSL-Owned Project Data** domain as a whole, and incremental migration means improving **Decompiled Source** over time.
- "Apply" was rejected as the primary user-facing materialization term; **Compile** is the canonical term for producing **Compile Output**.
- "Force push" was rejected; **Push** is intentionally conservative and requires a fresh **Pull** after **Project Drift**.
- "Force push" remains distinct from **Destructive Push**; destructive intent does not bypass synchronization checks.
- "Full data clone" was rejected for the workspace compile model; **Standard Project Data Snapshot** captures only standard RPG Maker MV project data files.
- "Raw text diff" was rejected as the primary comparison format; **Diff** is a **Structured Diff Report**.
- "Stable JSON diff contract" was deferred for the first **Structured Diff Report**.
- "Scaffold" was rejected because it sounds like workspace initialization; **DSL Decompilation** is the canonical term for generating DSL declarations from a **Project Data Snapshot**.
- "Overwrite decompilation" was rejected; **Decompiled Source** must be written non-destructively.
- "System variables" and "system switches" were split into **Variable Definition** and **Switch Definition** as DSL-authored data domains.
- "Variable initial value" and "switch initial value" were rejected for **Variable Definition** and **Switch Definition** because RPG Maker MV stores runtime values separately from `System.json` name entries.
- "Manifest-only binding" was rejected for DSL-owned data entries; **Entry Identity** is expressed as a data-domain-scoped RPG Maker MV ID.
- "Entry identity binding" was rejected as **Sync Manifest** responsibility; **Entry Identity** belongs in DSL source.
- "Name identity" was rejected for DSL-owned data entries because RPG Maker MV allows duplicate display names.
- "Unique display name" was rejected as a DSL-owned entry requirement; uniqueness belongs to **Entry Identity**.
- "Global event ID" was rejected for **Map Event Identity** because RPG Maker MV event IDs are scoped to one map.
- "Project drift validation" was rejected as a compile responsibility; **Compile** validates the **Staged Data Graph**, while **Push** checks **Project Drift**.
- "Definition Binding" was rejected for the workspace compile model; **Definition Source Discovery** selects source files, while **Entry Identity** identifies target entries.
- "Definition Lint" was rejected as a command in the workspace compile model; check-only compilation is the validation path.
- "All TypeScript files" was rejected for **Definition Source Discovery** because ordinary helper modules are not necessarily **Definition Sources**.
- "Source freshness" was rejected as too narrow; **Generated Freshness** is based on the full **Compile Baseline**, not only DSL source inputs.
- "Dirty state" was rejected for incomplete Project Root writes; **Interrupted Push** distinguishes tool-created incomplete synchronization from ordinary **Project Drift**.
