# Workspace Compile Push Model Design

## Status

Draft

## Change Slug

`workspace-compile-push-model`

## Context

The current implementation is a first-version direct-write workflow. The CLI exposes `init`, `lint`, `create`, and `replace`; `runWorkflow` loads a configured Project Root, iterates `definitionTargets`, validates selected Event Definitions against the current Project Index, then writes changed `Map###.json` or `CommonEvents.json` files directly to the Project Root for non-preview create/replace runs.

ADR-0003 defines the workspace-level `clone` / `pull` / `decompile` / `compile` / `diff` / `push` model. ADR-0004 fixes Entry Identity on explicit RPG Maker MV IDs rather than Display Names or Sync Manifest bindings. The PRD captures the product need: brownfield projects need a local Compile Output and synchronization gate so Event DSL can take over Event Data Store plus System Data variable and switch entries without silently overwriting editor-side changes.

The current codebase has useful seams to preserve: CLI construction, workspace config loading, project data loading, DSL source evaluation, event command compilation, MV-style JSON writing, and workflow-style tests that build temporary MV-like projects. The design changes the orchestration model around those seams rather than preserving `create` / `replace` semantics.

## Problem

Current behavior is unsafe and too low-level for the intended product model:

- Project Root files are written directly by `create` / `replace`.
- Operation target identity is derived from Display Name matching instead of explicit Entry Identity.
- Workspace Config binds individual Definition Sources to Definition Targets, preventing workspace-level compilation.
- Common Events, variables, and switches defined by DSL in the same run are not visible to reference resolution until after they already exist in project JSON.
- There is no Workspace Data State, Project Data Snapshot, Generated Project Data, Generated Freshness, Project Drift check, or Destructive Push gate.
- Diff output is a raw full-file unified diff from direct-write preview, not a Structured Diff Report over Data Domains and entries.
- Variable Definitions and Switch Definitions do not exist as DSL-owned data domains.
- DSL Decompilation does not exist, so brownfield takeover cannot start from project data.

## Goals

- Replace `lint` / `create` / `replace` as the primary workflow with `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- Compile complete Compile Output for all DSL-Owned Project Data domains without mutating Project Root or Project Data Snapshot.
- Use explicit Entry Identity in DSL for Map Events, Common Events, Variable Definitions, and Switch Definitions.
- Let references resolve against a Staged Data Graph containing DSL-owned entries plus External Project Data References from Project Data Snapshot.
- Store Project Data Snapshots and Generated Project Data as workspace state.
- Detect Generated Freshness against the Compile Baseline and Project Drift before user-visible diff or Project Root writes.
- Generate Structured Diff Reports grouped by Data Domain, entry, and detail.
- Support conservative Push and explicit Destructive Push.
- Provide DSL Decompilation as a non-destructive brownfield starting point.

## Non-Goals

- Owning the entire RPG Maker MV `data/` directory.
- Supporting field-level mixed ownership inside DSL-Owned Project Data domains.
- Supporting force push that ignores Project Drift.
- Storing Entry Identity bindings in Sync Manifest.
- Automatically editing DSL source to assign IDs.
- Perfect raw MV data to high-level DSL round-tripping.
- Designing implementation slices or migration phases in this document.
- Publishing issue tracker tickets.

## Scope

### In

- CLI command surface and command contracts.
- Workspace Config schema and initialization defaults.
- Workspace Data State layout and synchronization metadata.
- Definition Source Discovery from a workspace source root using include and exclude patterns.
- DSL type changes for explicit Entry Identity and System Data definitions.
- Staged Data Graph construction and validation.
- Compile Output materialization for Event Data Store and variable/switch System Data domains.
- Structured Diff Report classification.
- Push safety checks and write behavior.
- DSL Decompilation output contract.
- Tests at workflow, CLI, and focused pure-logic seams.

### Out

- Complete decompilation coverage for every RPG Maker MV event command.
- Ownership of actors, items, troops, maps, plugins, or the rest of System Data.
- User prompts or interactive confirmations. First-version destructive intent is flag-driven.
- Remote collaboration, network remotes, or Git integration.
- Automatic source formatting beyond the repo's existing formatter.

## Canonical References

- `CONTEXT.md`
- `docs/adr/0003-workspace-compile-push-model.md`
- `docs/adr/0004-explicit-mv-id-entry-identity.md`
- `.scratch/workspace-compile-push-model/workspace-compile-push-model-prd.md`
- `packages/rmmv-event-dsl/src/cli.ts`
- `packages/rmmv-event-dsl/src/workspace.ts`
- `packages/rmmv-event-dsl/src/workflow.ts`
- `packages/rmmv-event-dsl/src/dsl.ts`
- `packages/rmmv-event-dsl/src/events.ts`
- `packages/rmmv-event-dsl/src/project.ts`
- `packages/rmmv-event-dsl/src/definitions.ts`
- `packages/rmmv-event-dsl/src/writer.ts`
- Existing workflow, CLI, workspace, project, DSL, and event tests under `packages/rmmv-event-dsl/test/`

## Current Behavior

- `init` writes Workspace Config with `projectRoot`, `scriptEnabled`, and `definitionTargets`.
- `loadWorkspace` requires a Project Root and project `data/` directory.
- `runWorkflow` loads live Project Root data and builds a Project Index from it.
- `runWorkflow` iterates Definition Bindings one at a time.
- `lint` validates selected definitions without writing.
- `create` appends new map/common events using array length after checking Display Name absence.
- `replace` finds exactly one existing event by Display Name and overwrites that entry.
- `--diff` emits a full-file unified diff and does not write.
- DSL Map Events and Common Events do not declare explicit IDs.
- DSL source collection is file-by-file through Definition Binding, not workspace-wide.
- Common Event references by Display Name only see current project JSON, not same-run DSL definitions.

## Target Behavior

- `init` writes config for source-root discovery and workspace synchronization, not Definition Bindings.
- `clone` captures Project Data Snapshot and Sync Manifest snapshot hashes from a Project Root.
- `pull` refreshes Project Data Snapshot and snapshot hashes from a Project Root.
- `decompile` reads Project Data Snapshot and writes non-destructive Decompiled Source under the source root.
- `compile` discovers DSL source files, builds a Staged Data Graph, validates it, and writes Generated Project Data plus freshness metadata.
- `compile --check` validates without requiring a separate `lint` command.
- `diff` requires Generated Freshness and compares Generated Project Data with Project Data Snapshot using a Structured Diff Report.
- `push` requires Generated Freshness and no Project Drift before writing Generated Project Data to Project Root.
- Normal `push` rejects Destructive Changes.
- `push --allow-destructive` allows Snapshot-Only Owned Entries to be removed while still enforcing Generated Freshness and Project Drift checks.
- Successful `push` refreshes affected Project Data Snapshot and Sync Manifest.
- DSL-owned entries use explicit Entry Identity.
- Display Names may repeat; name-based references are valid only when uniquely resolvable.

## Requirements / Behavior Changes

| ID | Current | Target | Acceptance |
| --- | --- | --- | --- |
| R-01 | CLI exposes `lint`, `create`, `replace` as primary workflow commands. | CLI exposes `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`; check-only compilation replaces `lint`. | CLI command declaration test observes the new command surface and no primary `create` / `replace` commands. |
| R-02 | Workspace Config uses `definitionTargets`. | Workspace Config uses Definition Source Discovery from source root with include and exclude patterns. | Loading config succeeds with source discovery config and does not require Definition Bindings. |
| R-03 | DSL definitions omit IDs and workflow allocates or finds IDs by Display Name. | DSL-owned entries declare Entry Identity explicitly. | Compilation fails when a DSL-owned Map Event, Common Event, Variable Definition, or Switch Definition lacks required ID fields. |
| R-04 | Duplicate Display Names block create/replace or make references ambiguous inconsistently. | Duplicate Display Names are allowed for entries, but name-based references require exactly one match. | Duplicate IDs fail; duplicate names compile unless a name-based reference targets that ambiguous name. |
| R-05 | Project Index is built only from live Project Root data. | Staged Data Graph includes DSL-owned entries plus External Project Data References from Project Data Snapshot. | A Map Event can call a Common Event defined in the same compile run by ID; name and ID references resolve only when exactly one visible target exists in the correct scope. |
| R-06 | Compile-like behavior writes Project Root for create/replace. | `compile` writes Generated Project Data only. | After compile, Project Root and Project Data Snapshot files are unchanged while generated files exist. |
| R-07 | No Project Data Snapshot is required. | Compile requires Project Data Snapshot. | Running compile before clone/pull fails with a snapshot-required error. |
| R-08 | Diff is direct-write preview output. | Diff is a Structured Diff Report over Generated Project Data vs Project Data Snapshot. | Diff output groups changes by Data Domain and Entry Identity. |
| R-09 | No Generated Freshness check exists. | Diff and Push require Generated Freshness against the current Compile Baseline. | Modifying DSL source, relevant config, or the Project Data Snapshot after compile causes diff and push to fail until compile runs again. |
| R-10 | No Project Drift check exists. | Push rejects Project Drift for Affected Project Data Files and instructs Pull. | Modifying an affected Project Root file after snapshot causes push to fail without writing, while non-standard data files are ignored. |
| R-11 | Deletes are not modeled. | Snapshot-Only Owned Entries are Destructive Changes. | Diff reports snapshot-only owned entries; normal push rejects them. |
| R-12 | No Destructive Push exists. | `push --allow-destructive` applies Destructive Changes without bypassing freshness or drift checks. | Destructive push removes snapshot-only owned entries only when generated is fresh and project has no drift. |
| R-13 | Event arrays are replaced/appended but removal behavior is not defined. | Event Entry Removal leaves null holes. | Destructive removal of Map/Common Events writes null at removed IDs and does not compact arrays. |
| R-14 | Variables and switches are read-only references from System Data. | Variable Definitions and Switch Definitions are DSL-owned domains. | Compile materializes System Data variable/switch arrays from DSL-owned definitions while preserving non-owned System Data. |
| R-15 | No DSL Decompilation exists. | Decompile writes non-destructive Decompiled Source for all DSL-Owned Project Data domains. | Decompile fails rather than overwriting existing output and emits explicit Entry Identity in generated DSL. |
| R-16 | Source discovery is binding-based or would evaluate every TypeScript file. | Source discovery uses configured include/exclude patterns for DSL declaration files. | Ordinary helper `.ts` files outside the include patterns are not evaluated as Definition Sources. |
| R-17 | Push writes files directly. | Push stages affected files and updates workspace state only after all replacements succeed. | A staged write failure leaves Project Root, snapshot, and manifest unchanged; a partial replacement failure reports written files and leaves snapshot/manifest unchanged. |

## Locked Decisions

- DSL-Owned Project Data is defined by Data Domain, not by JSON file.
- First DSL-Owned Project Data domains are Event Data Store and System Data variable/switch entries.
- Entry Identity is Data Domain plus RPG Maker MV ID.
- Entry Identity is declared in DSL source and is not stored as a Sync Manifest binding.
- Display Name uniqueness is not required.
- Name-based Project Data References require exactly one matching Display Name.
- Generated Project Data and Project Data Snapshot may store whole MV data files as carriers.
- Non-owned data domains are carried forward from Project Data Snapshot into Generated Project Data.
- Compile requires Project Data Snapshot.
- Pull does not run Diff and does not check Generated Freshness.
- Compile does not automatically run Diff.
- Clone does not automatically run DSL Decompilation.
- Push success refreshes affected Project Data Snapshot and Sync Manifest.
- Sync Manifest records hashes and freshness metadata, not Entry Identity bindings.
- Generated Project Data, Project Data Snapshot, and Sync Manifest are not required to be committed.
- Generated Freshness is based on the current Compile Baseline, including source inputs, relevant Workspace Config, and the Project Data Snapshot baseline.
- Clone and Pull capture a Standard Project Data Snapshot, not arbitrary custom `data/*.json` files.
- Definition Source Discovery uses include and exclude patterns; it does not evaluate every TypeScript file by default.
- Map Event identity is `{ mapId, eventId }`.
- Variable Definitions and Switch Definitions represent `System.json` name entries, not runtime values.
- Compile Check is read-only and does not create Generated Freshness.
- Generated Project Data is complete carrier output for all DSL-Owned Project Data domains, not a changed-file patch plan.
- Push writes only Affected Project Data Files derived from generated-vs-snapshot differences.
- Destructive Push is distinct from force push and cannot bypass synchronization checks.

## Agent Discretion

- Exact internal module names, as long as responsibilities remain separated and domain terms are preserved.
- Exact filesystem paths under Workspace Data State, as long as they are not confused with DSL source and are consistently represented in config/manifest.
- Exact Structured Diff Report text format, as long as it is human-readable, grouped by Data Domain and entry, and backed by a structured internal model.
- Exact text of CLI errors and summaries, as long as they identify the failed invariant and next user action.
- How much high-level DSL Decompilation performs beyond guaranteed raw escape hatch output.

## Invariants

- Compile never mutates Project Root.
- Compile never mutates Project Data Snapshot.
- Pull never mutates DSL source or Generated Project Data.
- Compile Check never mutates Workspace Data State.
- Push is the only command that writes Project Root data.
- Normal Push never applies Destructive Changes.
- Destructive Push never bypasses Generated Freshness or Project Drift checks.
- Entry Identity uniqueness is enforced per Data Domain.
- Entry Removal never compacts MV ID arrays.
- Sync Manifest is never the source of truth for Entry Identity.
- External Project Data References do not imply ownership of their Data Domains.
- Structured Diff Report must be derivable without reading live Project Root state.
- Generated Freshness must fail when the current Compile Baseline differs from the Compile Baseline used to produce Generated Project Data.
- Generated Project Data uses dense RPG Maker MV ID arrays with explicit hole values, never sparse arrays.
- Snapshot-only entries in DSL-Owned Project Data domains are Destructive Changes because takeover is domain-wide.
- Push checks Project Drift only for Affected Project Data Files.

## Design

### System Flow

```text
Project Root
  -- clone/pull -->
Standard Project Data Snapshot + Sync Manifest snapshot hashes

DSL source + Workspace Config + Standard Project Data Snapshot
  -- compile -->
Staged Data Graph
  -- validate/materialize -->
Generated Project Data + Sync Manifest generated hashes/Compile Baseline hash

Generated Project Data + Project Data Snapshot
  -- diff -->
Structured Diff Report

Generated Project Data + Project Data Snapshot + Project Root + Sync Manifest
  -- push -->
staged Project Root write + refreshed Project Data Snapshot + refreshed Sync Manifest
```

### Workspace Data State

Workspace Data State stores three categories:

- Project Data Snapshot: standard MV data files captured from the Project Root.
- Generated Project Data: complete carrier files that represent DSL-owned domains, with non-owned domains carried forward from the snapshot.
- Sync Manifest: snapshot hashes, generated file hashes, and Compile Baseline metadata used for Generated Freshness.

Workspace Data State is tool-maintained. Users may inspect it, but it is not the source of truth. DSL source and Workspace Config are the user-authored inputs.

Clone and Pull capture a Standard Project Data Snapshot. The standard snapshot includes:

- `Actors.json`
- `Animations.json`
- `Armors.json`
- `Classes.json`
- `CommonEvents.json`
- `Enemies.json`
- `Items.json`
- `MapInfos.json`
- `Skills.json`
- `States.json`
- `System.json`
- `Tilesets.json`
- `Troops.json`
- `Weapons.json`
- Every `Map###.json` referenced by `MapInfos.json`

Non-standard `data/*.json` files are ignored. If `MapInfos.json` references a missing map file, Clone and Pull fail because the Project Root standard data is internally inconsistent. If `data/` contains an unreferenced `Map###.json`, Clone and Pull ignore it because `MapInfos.json` is the map index.

### Workspace Config

Workspace Config retains `projectRoot` and `scriptEnabled`, replaces `definitionTargets` with source-root discovery, and may declare workspace state paths if the default paths are not sufficient. Source discovery uses `sourceRoot`, `sourceInclude`, and `sourceExclude` patterns. The default configuration is:

```json
{
  "projectRoot": "../Game",
  "scriptEnabled": false,
  "sourceRoot": "src",
  "sourceInclude": ["**/*.events.ts", "**/*.dsl.ts"],
  "sourceExclude": ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]
}
```

Decompiled Source participates in discovery because the fixed decompile layout writes `*.events.ts` and `*.dsl.ts` files under the source root. Ordinary helper modules that do not match the include patterns are not evaluated as Definition Sources.

### DSL Surface

Map Event definitions add explicit `mapId` and event `id`. The Map Event Entry Identity is the pair `{ mapId, eventId }`, because RPG Maker MV event IDs are scoped to a map. Common Event definitions add explicit `id`.

Variable Definitions and Switch Definitions are added as DSL-authored `System.json` name entries, not runtime values:

```ts
export const hasKey = switchDefinition({
  id: 1,
  name: "Has Key",
});

export const doorState = variableDefinition({
  id: 2,
  name: "Door State",
});
```

Their IDs must be positive integers and their names must be non-empty strings. Empty string slots in `System.json` are ID-preserving holes, not definitions. Existing `variableRef` and `switchRef` continue to reference entries; the Staged Data Graph decides whether the target is DSL-owned or external.

The source evaluator must discover all DSL-owned declarations, not only Event Definitions. It should continue to reject unsupported dynamic TypeScript constructs and preserve the current schema-first authoring style.

### Staged Data Graph

The Staged Data Graph is built from:

- All DSL-owned declarations from Definition Source Discovery.
- Project Data Snapshot indexes for External Project Data References.
- Project Data Snapshot carrier files for non-owned domains that must be preserved.

Validation checks:

- Required Entry Identity fields.
- Duplicate Entry Identity within each Data Domain.
- Duplicate Map Event identity by `{ mapId, eventId }`, not by event ID alone.
- Required Map Event page list.
- Common Event trigger/switch rule.
- Script Command Gate.
- Name-based Project Data Reference uniqueness in the visible reference scope.
- Existence of ID-based Project Data References in the same visible reference scope as name-based references.
- MV runtime shape requirements before writing Generated Project Data.

For DSL-Owned Project Data domains, references resolve against DSL-owned entries in the Staged Data Graph and do not fall back to snapshot entries. For External Project Data Reference domains, references resolve against the Standard Project Data Snapshot. Raw DSL Commands remain an escape hatch and are not semantically inspected for embedded project references.

### Compile Output Materialization

Compile materializes DSL-owned domains into complete whole-file carrier output:

- Map Event entries are written into every `Map###.json` referenced by `MapInfos.json` by explicit map-scoped event ID.
- Common Events are written into `CommonEvents.json` by explicit ID.
- Variables and switches are written into their System Data arrays by explicit ID.
- Non-owned domains in those files are copied from Project Data Snapshot.

For Snapshot-Only Owned Entries, Compile Output represents absence from the DSL-owned domain. It does not mutate snapshot files. Because DSL-Owned Project Data domains are taken over as a whole, snapshot-only entries are Destructive Changes. For event arrays, destructive absence materializes as explicit `null` holes in Generated Project Data. For variable/switch arrays, destructive absence materializes as empty strings.

Generated arrays must be dense from index `0` through the highest required ID. Event arrays and `CommonEvents.json` use `null` for index `0`, removed entries, and intermediate holes. `System.json` `variables` and `switches` use `""` for index `0`, removed entries, and intermediate holes. Generated Project Data must not rely on sparse JavaScript arrays.

### Structured Diff Report

Diff compares only Generated Project Data and Project Data Snapshot. It must not read live Project Root state. The report has an internal structured model and human-readable CLI output; stable machine-readable JSON is deferred. The report groups by:

1. Data Domain.
2. Entry Identity.
3. Change detail.

Change classes include at least unchanged, generated-only, snapshot-only, changed, and non-owned-carried. Snapshot-only DSL-owned entries are reported as Destructive Changes. Reconciliation Hints attach to command-level differences where a raw MV command can be represented by an existing DSL helper or raw escape hatch. CLI output may omit unchanged entries by default as long as the structured internal report can represent them.

### Push

Push performs preflight checks before writing:

1. Generated Freshness: the current Compile Baseline must match the Compile Baseline used to produce Generated Project Data.
2. Generated output integrity: current Generated Project Data file hashes must match generated output hashes in the Sync Manifest.
3. Project Drift: current Project Root file hashes must match Project Data Snapshot hashes in Sync Manifest for Affected Project Data Files.
4. Destructive Change gate: normal Push rejects Destructive Changes; Destructive Push allows them.

The Compile Baseline includes discovered source file paths and contents, relevant Workspace Config fields, and the Project Data Snapshot file hashes used by compilation. Pulling a changed snapshot therefore makes existing Generated Project Data stale even if DSL source files did not change.

Affected Project Data Files are derived from differences between Generated Project Data and Project Data Snapshot. Push checks drift and writes only those files. Non-standard data files ignored by the Standard Project Data Snapshot do not participate in drift checks.

If preflight passes, Push writes affected Generated Project Data files to staging files, then replaces Project Root files with the MV-Style JSON Writer output. Push refreshes affected Project Data Snapshot files and Sync Manifest hashes only after every affected Project Root replacement succeeds. If staging fails, Project Root files are not replaced and Workspace Data State is not updated. If replacement partially succeeds, Push reports which files were replaced, leaves Snapshot and Manifest unchanged, and the user must Pull before trying again.

### DSL Decompilation

DSL Decompilation reads Project Data Snapshot and writes Decompiled Source under the source root. It is non-destructive: existing output files cause failure in the first version. It emits explicit Entry Identity for every decompiled DSL-owned entry. It should prefer available DSL helpers and fall back to raw escape hatches when no supported helper exists.

The fixed output layout is:

```text
src/decompiled/
  maps/
    Map001.events.ts
    Map002.events.ts
  common-events.events.ts
  system.dsl.ts
```

Each map file contains the Map Event definitions for that map and includes both `mapId` and event `id`. `common-events.events.ts` contains Common Event definitions with explicit `id`. `system.dsl.ts` contains Variable Definitions and Switch Definitions for non-empty `System.json` variable/switch name slots. Empty string slots are not emitted as definitions.

Decompile must preflight all target output paths before writing. If any target file already exists, it fails before writing any files. Export names may be derived from Display Names, but Entry Identity fields are the source of truth; duplicate or invalid export names should be disambiguated with IDs.

## Conditional Modules

### UX / Product Behavior

The user workflow changes from direct mutation to explicit synchronization. Users must clone before compile. Users must compile before diff or push. Users must pull after Project Drift. Users must opt into Destructive Push before snapshot-only owned entries are removed.

Command responsibilities remain narrow:

- `clone`: initial snapshot.
- `pull`: refresh snapshot.
- `decompile`: snapshot to source.
- `compile`: source to generated data.
- `diff`: generated data to snapshot report.
- `push`: gated write to Project Root.

### Domain Model

This change promotes Data Domain, DSL-Owned Project Data, Workspace Data State, Compile Output, Project Data Snapshot, Sync Manifest, Entry Identity, Display Name, Generated Freshness, Project Drift, Destructive Change, Destructive Push, DSL Decompilation, and Structured Diff Report into implementation-driving concepts.

Event Data Operation, Operation Mode, Definition Binding, Definition Target, and Definition Lint become legacy concepts for the old direct-write workflow and must not drive the new command model.

### API / Contract Changes

Public package exports need to include any new DSL helpers for Variable Definitions and Switch Definitions. Existing helpers that create Map Events and Common Events change input contracts to require Entry Identity fields.

CLI contract changes are breaking. `create`, `replace`, and independent `lint` are removed from the public CLI. `compile --check` is the validation path.

### Data Model / Persistence

Workspace Data State persists snapshots, generated files, and manifest metadata. The design requires deterministic hashing of:

- Project Data Snapshot files.
- Generated Project Data files.
- DSL source inputs selected by Definition Source Discovery.
- Relevant Workspace Config fields.

Generated Project Data and Project Data Snapshot can be stored as whole MV data files. Sync Manifest records file hashes and Compile Baseline hashes; it does not store entry bindings.

### Execution / Concurrency Semantics

Commands should avoid partial writes. Compile should fully validate before writing generated files. Compile Check is read-only and does not write generated files or update the Sync Manifest. Push should complete all preflight checks before writing Project Root files. Push stages writes before replacing Project Root files and only refreshes Snapshot/Manifest after every affected replacement succeeds.

Concurrent editor changes are handled by Project Drift detection through snapshot hashes. The first version does not attempt automatic merge.

### Side Effects / Integrations

The only external side effect is filesystem reads/writes against the Project Root and Workspace Data State. Push is the only operation that writes Project Root data.

### Security / Privacy / Money

No secrets, authentication, authorization, privacy, or money handling is introduced. The safety-critical area is filesystem overwrite protection. The design must preserve conservative defaults: no force push, no destructive changes without explicit destructive intent, and no Project Root writes from compile/diff/pull/decompile.

### Observability / Operations

CLI output must clearly identify:

- Missing Project Data Snapshot.
- Stale Generated Project Data.
- Project Drift and the need to pull.
- Destructive Changes and the need for Destructive Push.
- Ambiguous name-based references.
- Duplicate Entry Identity.

Verbose diagnostics may include affected files, Data Domains, and Entry Identities.

### Rollout / Migration / Cleanup

The project is still in development, so direct replacement is allowed. Tests and examples should be updated to the new command model rather than maintaining backward-compatible direct-write behavior.

## Phase Slices

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |
| 1 | Establish the new command/config/state foundation. | None | R-01, R-02, R-07, OUT-01, OUT-07, OUT-08 | CLI and Workspace Config expose the new model; clone/pull can create a Standard Project Data Snapshot with manifest hashes. | Slice 01, Slice 02 |
| 2 | Add DSL-owned declaration discovery and staged validation. | Phase 1 | R-03, R-04, R-05, R-14, OUT-02, OUT-03 | Source discovery collects DSL declarations; Entry Identity and Project Data Reference validation work against the Staged Data Graph. | Slice 03, Slice 04 |
| 3 | Implement compile artifacts and structured review. | Phase 2 | R-06, R-08, R-09, R-11, R-13, OUT-04, OUT-05, OUT-06 | Compile Check is read-only; normal compile writes complete Generated Project Data with Compile Baseline metadata; diff reports structured changes without reading Project Root. | Slice 05, Slice 06, Slice 07 |
| 4 | Implement safe Project Root synchronization and brownfield source generation. | Phases 1-3 | R-10, R-12, R-15, R-17, OT-03, OT-07, OT-08, OT-09 | Push enforces freshness, drift, destructive gates, and staged writes; decompile writes non-destructive source in the fixed layout. | Slice 08, Slice 09 |
| 5 | Remove legacy workflow surface and update user-facing guidance. | Phases 1-4 | R-01, DOC-03, DOC-04 | Public API/docs/tests no longer use direct-write create/replace/lint; examples describe the workspace compile/push workflow. | Slice 10, Slice 11 |
| 6 | Verify the complete workflow and invariants. | Phases 1-5 | All Observable Truths and Required Design Outcomes | Workflow and pure-logic tests cover the required matrix; package checks pass or skipped reasons are documented. | Slice 12 |

## Completion Contract

### Observable Truths

- [ ] OT-01: The CLI exposes the workspace compile/push command surface and no longer exposes `create`, `replace`, or standalone `lint` as public commands.
- [ ] OT-02: A workspace can clone a Project Root into Project Data Snapshot without writing DSL source or Project Root data.
- [ ] OT-03: A workspace can decompile Project Data Snapshot into non-destructive Decompiled Source with explicit Entry Identity.
- [ ] OT-04: A workspace can compile discovered DSL source into Generated Project Data without mutating Project Root or Project Data Snapshot.
- [ ] OT-05: Diff produces a Structured Diff Report comparing Generated Project Data and Project Data Snapshot.
- [ ] OT-06: Diff and Push reject Generated Project Data that is stale against the current Compile Baseline.
- [ ] OT-07: Push rejects Project Drift on Affected Project Data Files.
- [ ] OT-08: Normal Push rejects Destructive Changes, while Destructive Push applies them without bypassing freshness or drift checks.
- [ ] OT-09: Successful Push stages and writes affected Project Root data, then refreshes affected Project Data Snapshot and Sync Manifest.

### Required Design Outcomes

- [ ] OUT-01: Workspace Config no longer requires Definition Bindings for workspace-level compilation.
- [ ] OUT-02: DSL-owned entries require explicit Entry Identity.
- [ ] OUT-03: Staged Data Graph can resolve same-run DSL-owned references and External Project Data References.
- [ ] OUT-04: Generated Project Data carries forward non-owned data domains from Project Data Snapshot.
- [ ] OUT-05: Entry Removal preserves MV IDs with explicit hole values in dense arrays.
- [ ] OUT-06: Sync Manifest stores hashes and Compile Baseline metadata, not Entry Identity bindings.
- [ ] OUT-07: Definition Source Discovery uses source root include/exclude patterns.
- [ ] OUT-08: Standard Project Data Snapshot excludes non-standard project data files.

### Required Canonical Updates

- [ ] DOC-01: `CONTEXT.md` uses the new workspace compile/push vocabulary consistently.
- [ ] DOC-02: ADR-0003 and ADR-0004 remain aligned with implementation behavior.
- [ ] DOC-03: User-facing examples and sample workspace config reflect source-root discovery and explicit Entry Identity.
- [ ] DOC-04: README or CLI help describes the new command workflow and safe push behavior.

## Test Strategy

Highest-practical seam: workflow/CLI behavior using temporary workspaces and MV-like project data, following existing `workflow.test.ts`, `cli.test.ts`, and `workspace.test.ts` patterns. These tests should assert observable files, outputs, errors, and command availability rather than internal helper calls.

Required workflow tests:

- CLI command surface for `init`, `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- Workspace config loading with source-root include/exclude discovery and without Definition Bindings.
- Clone captures Standard Project Data Snapshot files and writes snapshot hashes.
- Clone ignores non-standard `data/*.json` files and fails when `MapInfos.json` references a missing map file.
- Pull refreshes snapshot despite stale generated data.
- Compile requires Project Data Snapshot.
- Compile writes Generated Project Data and manifest freshness data without touching Project Root or snapshot.
- Compile Check validates without writing Generated Project Data or updating manifest freshness data.
- Compile writes complete carrier output for DSL-Owned Project Data domains, not only changed files.
- Compile resolves same-run DSL-owned references.
- Compile rejects duplicate Entry Identity.
- Compile treats Map Event identity as `{ mapId, eventId }`, allowing the same event ID on different maps.
- Compile allows duplicate Display Name unless referenced ambiguously by name.
- Compile rejects missing Explicit ID References in the same visible reference scope as name-based references.
- Compile does not semantically validate Raw DSL Command parameters as Project Data References.
- Compile materializes Variable Definitions and Switch Definitions as `System.json` name entries and ignores empty string slots as definitions.
- Compile emits dense MV ID arrays with explicit `null` or `""` holes.
- Diff rejects stale generated data.
- Diff rejects generated data whose Compile Baseline snapshot hashes differ from the current Project Data Snapshot after Pull.
- Diff reports generated-only, snapshot-only, and changed entries by Data Domain and Entry Identity.
- Push rejects generated data stale against the current Compile Baseline.
- Push rejects Project Drift on Affected Project Data Files.
- Push ignores Project Root changes in non-standard data files outside the Standard Project Data Snapshot.
- Push ignores Project Root changes in standard files that are not Affected Project Data Files for the current generated-vs-snapshot diff.
- Normal Push rejects Destructive Changes.
- Destructive Push applies Destructive Changes and preserves ID holes.
- Successful Push stages writes, updates Project Root, snapshot, and manifest.
- Push does not refresh snapshot or manifest if staging fails or replacement only partially succeeds.
- Decompile writes the fixed non-destructive source layout and fails before writing if any target output exists.
- Decompile ignores empty variable/switch name slots.

Focused pure-logic tests:

- Hash calculation and manifest comparison.
- Source discovery ordering and Compile Baseline hash stability.
- Staged Data Graph duplicate and ambiguity checks.
- Data Domain materialization into carrier files.
- Structured Diff Report classification.
- Entry Removal representation for event and system arrays.
- Raw command to DSL helper or raw escape hatch decompilation mapping for supported commands.

Do not test implementation details such as private helper call order, exact object property ordering beyond stable JSON output requirements, or cosmetic CLI wording where the semantic error is already asserted.

## Deferred Ideas

- Supporting full `data/` directory ownership.
- Supporting field-level ownership policies for event position or page image fields.
- Supporting force push that bypasses Project Drift.
- Supporting source auto-rewrite for ID allocation.
- Supporting decompile overwrite.
- Supporting semantic event-command diff beyond initial Reconciliation Hints.
- Supporting a machine-only JSON output mode for Diff as a separate public contract.
- Supporting plugin or custom project data files in Project Data Snapshots.

## Open Questions

None that block design-to-slices. Exact workspace state directory names, manifest schema field names, and diff serialization details are implementation decisions within the locked boundaries above.
