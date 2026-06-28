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

**Definition Binding**:
One Workspace Config entry that maps one Definition Source to one Definition Target.
_Avoid_: target inference, file-level merge rule, operation mode

**Definition Target**:
The configured Event Data Store destination for a Definition Binding.
_Avoid_: inferred filename target, CLI target override, operation mode

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
_Avoid_: static-only lint, apply, compile, smoke test

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
- The **Project Root** path in a **Workspace Config** is resolved relative to the **Workspace Root**.
- The **Workspace Config** uses `projectRoot` for the MV project directory.
- A **Definition Binding** maps exactly one **Definition Source** to exactly one **Definition Target**, such as a single map or Common Events.
- A **Definition Source** is a single TypeScript file path relative to the **Workspace Root**.
- A **Definition Target** is a single Event Data Store file.
- A **Definition Target** selects one file from the **Event Data Store**.
- A **Definition Target** can be owned by at most one **Definition Binding** in a Workspace.
- Map **Definition Target** values use `mapId` only.
- Common event **Definition Target** values point to the shared `CommonEvents.json` file.
- Workspace Config bindings use `src` and `target` fields.
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
- **Definition Lint** performs no **Event Data Operations**.
- **Definition Lint** reads the Event Data Store through the configured project path and performs project-aware checks.
- **Definition Lint** may warn when a named export differs from its RPG Maker MV event name, but the MV event name remains the semantic target.
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
