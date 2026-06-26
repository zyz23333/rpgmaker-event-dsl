# RMMV Event DSL

This context defines the language for a TypeScript-first authoring layer that turns intentional RPG Maker MV event changes into validated MV project data.

## Language

**Event Patch**:
An internal tool operation that applies explicit replacements to RPG Maker MV event data.
_Avoid_: user-authored script, migration, raw edit

**Event Definition**:
A developer-authored TypeScript DSL module that defines one or more RPG Maker MV events.
_Avoid_: patch script, raw event JSON

**Named Event Export**:
A named TypeScript export whose value is an Event Definition collected by the tool.
_Avoid_: default export, exported helper

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

**Schema-First DSL**:
A TypeScript authoring style where event structures are expressed as named object fields rather than positional block arguments.
_Avoid_: patch script, positional block DSL

**Empty Command List**:
A required `commands` field with no Event Nodes that compiles to only the RPG Maker MV end marker.
_Avoid_: missing command list, implicit delete

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

**Project Reference**:
A named reference from an Event Definition to existing RPG Maker MV project data.
_Avoid_: raw ID, definition builder

**Explicit ID Reference**:
A project reference helper that identifies RPG Maker MV data by numeric ID without using a bare number.
_Avoid_: raw numeric ID, implicit ID

**Plugin Command Registry**:
An optional lint-time catalog of known plugin commands and parameter shapes.
_Avoid_: runtime dependency, hard validation source

**Plugin Command Input**:
A schema-first DSL object that represents an RPG Maker MV plugin command.
_Avoid_: raw command string, escaped script

**Script Input**:
A schema-first DSL object that represents an RPG Maker MV script command and carries the script lines in a `code` field.
_Avoid_: raw script string, implicit enablement

**Function-Style Command Helper**:
A verb-named DSL helper that carries its inputs as a schema-first object rather than positional arguments.
_Avoid_: positional command builder, raw command string

**Append-Only ID Allocation**:
The create behavior that assigns a new event ID at the end of the target MV data array instead of reusing null slots.
_Avoid_: first-empty-slot allocation, custom ID creation

**Initial Command Coverage**:
The first-version set of RPG Maker MV event commands supported by the DSL compiler.
_Avoid_: complete MV command coverage

**Script Command Enablement**:
A configuration flag that allows script event commands to be compiled in the first version.
_Avoid_: per-node reason gate, implicit enablement

**Event Data Store**:
The RPG Maker MV JSON files that store event data, including `Map###.json` and `CommonEvents.json`.
_Avoid_: database, runtime state

**Event Data Management**:
The tool layer that reads, validates, creates, and replaces event entries in an Event Data Store.
_Avoid_: database management, editor automation

**Event Data Operation**:
A tool operation such as reading, creating, or replacing an event entry in an Event Data Store.
_Avoid_: partial update, merge

**Project Index**:
A name-to-ID lookup model built from an existing RPG Maker MV project.
_Avoid_: registry, database cache

**Event Node**:
A typed DSL value that represents an event concept before it is compiled to MV commands.
_Avoid_: command, instruction

**Raw Event Command**:
An RPG Maker MV command object with `code`, `indent`, and `parameters`.
_Avoid_: event node, DSL command

**Map Event**:
An event stored in a `Map###.json` file.
_Avoid_: common event, event patch

**Common Event**:
A reusable RPG Maker MV event command list stored in `CommonEvents.json`.
_Avoid_: runtime event, built-in event

**Explicit Replacement**:
A patch operation that overwrites a named existing event only when replacement is declared directly.
_Avoid_: merge, update, sync

**Operation Set**:
A tool-produced plan that declares one or more event data operations to apply to an Event Data Store.
_Avoid_: file-owned generation, full-file rewrite

**Definition Target**:
The configured Event Data Store location that receives the Event Definitions from one TypeScript file.
_Avoid_: inferred filename target, CLI target override, operation mode

**Operation Mode**:
The tool-selected intent for applying Event Definitions, such as create or replace.
_Avoid_: definition target, event definition metadata

**First Version Complete**:
The first usable release has an end-to-end path for project-aware map event patches, even if it covers only a focused subset of RPG Maker MV event commands.
_Avoid_: command-complete, feature-complete

## Relationships

- An **Event Definition** contains one or more **Event Nodes**.
- A **Named Event Export** is the only first-version module boundary for collecting **Event Definitions**.
- An **Event Patch** applies an **Operation Set** derived from **Event Definitions** and tool configuration.
- A **Definition Target** binds one Event Definition file to one target, such as a single map or Common Events.
- An **Operation Mode** is selected separately from the **Definition Target**.
- A **Project Index** resolves names used by an **Event Patch** to RPG Maker MV IDs.
- An **Event Node** compiles to one or more **Raw Event Commands**.
- A **Map Event** contains pages whose command lists are made of **Raw Event Commands**.
- A **Common Event** contains a command list made of **Raw Event Commands**.
- An **Event Patch** can define **Explicit Replacement** operations for **Map Events** and **Common Events**.
- An **Operation Set** may create or replace a single entry or many entries, while preserving undeclared entries in the target file.
- **Event Data Management** supports read, create, and replace in the first version; delete and partial update are outside the first-version scope.
- A map **Definition Target** must come from configuration in the first version, not from the file name or CLI target arguments.
- A first-version tool run applies exactly one **Operation Mode** to all selected **Event Definitions**.
- **Definition Lint** reads the Event Data Store through the configured project path and performs project-aware checks.
- **Definition Lint** may warn when a named export differs from its RPG Maker MV event name, but the MV event name remains the semantic target.
- Create and replace runs must perform **Project-Aware Validation** before writing any Event Data Store files.
- **Apply Preview** is available through dry-run and diff options for first-version create and replace runs.
- Dry-run output uses an **Entry-Level Summary**.
- Diff output combines an **Entry-Level Summary** with full-file unified diffs.
- The first version writes changed `Map###.json` and `CommonEvents.json` files with an **MV-Style JSON Writer**.
- **Compiler Defaults** are built in, documented, and overridable through explicit DSL fields; the first version does not support configuration-level default overrides.
- Event pages, map events, and common events use the **Schema-First DSL** style with named object fields.
- An **Empty Command List** is valid for event pages and common events.
- A map event **Event Page List** must contain at least one page.
- A **Common Event Trigger** of autorun or parallel requires an explicit switch reference.
- A **Map Page Trigger** defaults to action and supports all RPG Maker MV page trigger modes in the first version.
- Page conditions use **Page Condition Slots** and combine as AND conditions.
- **Project References** use `xxxRef` helper names to distinguish references from definitions.
- **Explicit ID References** are allowed, while bare numeric IDs are not valid DSL references.
- **Plugin Commands** do not require a runtime registry; registry data is optional and used only for lint-time validation when available.
- **Plugin Command Input** uses named fields for the command and its arguments.
- **Script Input** uses a `code` field for script lines and requires explicit config enablement.
- Command nodes use **Function-Style Command Helpers** with schema-first object inputs.
- Create operations use **Append-Only ID Allocation** in the first version.
- Create operations fail when the target event name already exists.
- Replace operations require the target event name to exist exactly once.
- Map event coordinates must be within map bounds; coordinate occupancy is a lint warning, not an error.
- **Initial Command Coverage** follows the README list, with battle and shop commands requiring editor-generated golden samples before they are considered complete.
- Script commands require explicit configuration enablement in the first version.
- **First Version Complete** means the patching workflow is complete before command coverage is complete.

## Example Dialogue

> **Dev:** "Does the first version need every RPG Maker MV command?"
> **Domain expert:** "No. The **First Version Complete** target is an end-to-end **Event Patch** workflow for **Map Events**, with a focused command subset."

## Flagged Ambiguities

- "Complete first version" was resolved to mean workflow-complete for project-aware map event patches, not complete coverage of every RPG Maker MV event command.
- "Common Event" was resolved as user-defined RPG Maker MV project data, not a runtime-provided event.
- "Patch" was resolved to use **Explicit Replacement** for the first version, not merge or partial update.
- "File-level replace" was resolved as an **Operation Set** applied entry-by-entry, not DSL ownership of the whole JSON file.
- "Patch script" was rejected as user-facing language; developers author **Event Definitions**, while the tool derives the **Event Patch**.
- "Event database" was rejected as canonical language; the project uses **Event Data Store** and **Event Data Management** to avoid implying database semantics.
- "Map target" was resolved as configuration-owned; the first version does not infer map targets from file names or accept CLI target overrides.
- "Definition target" was resolved as target-only configuration; create and replace are **Operation Modes**, not target metadata.
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
- "Numeric references" were resolved as explicit ID helper calls, not bare numbers; reasons are optional and may be linted.
- "Plugin command registry" was resolved as optional lint-time metadata, not a runtime requirement.
- "Plugin command input" was resolved as schema-first object form, not a raw concatenated string.
- "Script input" was resolved as schema-first object form with a `code` field.
- "Command node API" was resolved as function-style helpers with object inputs, not positional builders.
- "Create ID allocation" was resolved as append-only; the first version does not reuse null holes or support custom new IDs.
- "Create and replace name matching" was resolved as strict: create requires no existing name, replace requires exactly one existing name.
- "Map coordinates" were resolved as bounds-checked errors with coordinate occupancy warnings.
- "Initial command coverage" was resolved as the README command set, implemented with golden-sample confirmation for complex battle and shop commands.
- "Script command" was resolved as config-gated rather than reason-gated at the node level.
