# Workspace Compile Push Model Design

## Status

Draft

## Change Slug

`workspace-compile-push-model`

## Context

The current implementation is a first-version direct-write workflow. The CLI exposes `init`, `lint`, `create`, and `replace`; `runWorkflow` loads a configured Project Root, iterates `definitionTargets`, validates selected Event Definitions against the current Project Index, then writes changed `Map###.json` or `CommonEvents.json` files directly to the Project Root for non-preview create/replace runs.

ADR-0005 replaces that direct-write shape with a workspace-level `clone` / `pull` / `decompile` / `compile` / `diff` / `push` model. ADR-0006 fixes Entry Identity on explicit RPG Maker MV IDs rather than Display Names or Sync Manifest bindings. The PRD captures the product need: brownfield projects need a local Compile Output and synchronization gate so Event DSL can take over Event Data Store plus System Data variable and switch entries without silently overwriting editor-side changes.

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
- Detect Generated Freshness and Project Drift before user-visible diff or Project Root writes.
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
- Definition Source Discovery from a workspace source root.
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
- `docs/adr/0005-workspace-compile-push-model.md`
- `docs/adr/0006-explicit-mv-id-entry-identity.md`
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
| R-02 | Workspace Config uses `definitionTargets`. | Workspace Config uses Definition Source Discovery from source root. | Loading config succeeds with source root config and does not require Definition Bindings. |
| R-03 | DSL definitions omit IDs and workflow allocates or finds IDs by Display Name. | DSL-owned entries declare Entry Identity explicitly. | Compilation fails when a DSL-owned Map Event, Common Event, Variable Definition, or Switch Definition lacks required ID fields. |
| R-04 | Duplicate Display Names block create/replace or make references ambiguous inconsistently. | Duplicate Display Names are allowed for entries, but name-based references require exactly one match. | Duplicate IDs fail; duplicate names compile unless a name-based reference targets that ambiguous name. |
| R-05 | Project Index is built only from live Project Root data. | Staged Data Graph includes DSL-owned entries plus External Project Data References from Project Data Snapshot. | A Map Event can call a Common Event defined in the same compile run by ID, and unique name references resolve against staged entries. |
| R-06 | Compile-like behavior writes Project Root for create/replace. | `compile` writes Generated Project Data only. | After compile, Project Root and Project Data Snapshot files are unchanged while generated files exist. |
| R-07 | No Project Data Snapshot is required. | Compile requires Project Data Snapshot. | Running compile before clone/pull fails with a snapshot-required error. |
| R-08 | Diff is direct-write preview output. | Diff is a Structured Diff Report over Generated Project Data vs Project Data Snapshot. | Diff output groups changes by Data Domain and Entry Identity. |
| R-09 | No Generated Freshness check exists. | Diff and Push require Generated Freshness. | Modifying DSL source after compile causes diff and push to fail until compile runs again. |
| R-10 | No Project Drift check exists. | Push rejects Project Drift and instructs Pull. | Modifying Project Root after snapshot causes push to fail without writing. |
| R-11 | Deletes are not modeled. | Snapshot-Only Owned Entries are Destructive Changes. | Diff reports snapshot-only owned entries; normal push rejects them. |
| R-12 | No Destructive Push exists. | `push --allow-destructive` applies Destructive Changes without bypassing freshness or drift checks. | Destructive push removes snapshot-only owned entries only when generated is fresh and project has no drift. |
| R-13 | Event arrays are replaced/appended but removal behavior is not defined. | Event Entry Removal leaves null holes. | Destructive removal of Map/Common Events writes null at removed IDs and does not compact arrays. |
| R-14 | Variables and switches are read-only references from System Data. | Variable Definitions and Switch Definitions are DSL-owned domains. | Compile materializes System Data variable/switch arrays from DSL-owned definitions while preserving non-owned System Data. |
| R-15 | No DSL Decompilation exists. | Decompile writes non-destructive Decompiled Source for all DSL-Owned Project Data domains. | Decompile fails rather than overwriting existing output and emits explicit Entry Identity in generated DSL. |

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
- Destructive Push is distinct from force push and cannot bypass synchronization checks.

## Agent Discretion

- Exact internal module names, as long as responsibilities remain separated and domain terms are preserved.
- Exact filesystem paths under Workspace Data State, as long as they are not confused with DSL source and are consistently represented in config/manifest.
- Exact Structured Diff Report serialization format, as long as it is structured, grouped by Data Domain and entry, and stable enough for tests.
- Exact text of CLI errors and summaries, as long as they identify the failed invariant and next user action.
- Whether source discovery supports an exclude list in the first implementation, provided recursive source-root discovery remains the default.
- How much high-level DSL Decompilation performs beyond guaranteed raw escape hatch output.

## Invariants

- Compile never mutates Project Root.
- Compile never mutates Project Data Snapshot.
- Pull never mutates DSL source or Generated Project Data.
- Push is the only command that writes Project Root data.
- Normal Push never applies Destructive Changes.
- Destructive Push never bypasses Generated Freshness or Project Drift checks.
- Entry Identity uniqueness is enforced per Data Domain.
- Entry Removal never compacts MV ID arrays.
- Sync Manifest is never the source of truth for Entry Identity.
- External Project Data References do not imply ownership of their Data Domains.
- Structured Diff Report must be derivable without reading live Project Root state.

## Design

### System Flow

```text
Project Root
  -- clone/pull -->
Project Data Snapshot + Sync Manifest snapshot hashes

DSL source + Project Data Snapshot
  -- compile -->
Staged Data Graph
  -- validate/materialize -->
Generated Project Data + Sync Manifest generated hashes/source hash

Generated Project Data + Project Data Snapshot
  -- diff -->
Structured Diff Report

Generated Project Data + Project Data Snapshot + Project Root + Sync Manifest
  -- push -->
Project Root write + refreshed Project Data Snapshot + refreshed Sync Manifest
```

### Workspace Data State

Workspace Data State stores three categories:

- Project Data Snapshot: whole MV data files needed for DSL-owned domains and External Project Data References.
- Generated Project Data: whole MV data files that carry DSL-owned domains, with non-owned domains carried forward from the snapshot.
- Sync Manifest: hashes for snapshot files, generated files, and DSL source inputs used for Generated Freshness.

Workspace Data State is tool-maintained. Users may inspect it, but it is not the source of truth. DSL source and Workspace Config are the user-authored inputs.

### Workspace Config

Workspace Config retains `projectRoot` and `scriptEnabled`, replaces `definitionTargets` with source-root discovery, and may declare workspace state paths if the default paths are not sufficient. First-version source discovery recursively selects TypeScript files from the source root. Decompiled Source participates in discovery if written under that root.

### DSL Surface

Map Event definitions add explicit `mapId` and event `id`. Common Event definitions add explicit `id`. Variable Definitions and Switch Definitions are added as DSL-authored values with explicit `id` and Display Name. Existing `variableRef` and `switchRef` continue to reference entries; the Staged Data Graph decides whether the target is DSL-owned or external.

The source evaluator must discover all DSL-owned declarations, not only Event Definitions. It should continue to reject unsupported dynamic TypeScript constructs and preserve the current schema-first authoring style.

### Staged Data Graph

The Staged Data Graph is built from:

- All DSL-owned declarations from Definition Source Discovery.
- Project Data Snapshot indexes for External Project Data References.
- Project Data Snapshot carrier files for non-owned domains that must be preserved.

Validation checks:

- Required Entry Identity fields.
- Duplicate Entry Identity within each Data Domain.
- Required Map Event page list.
- Common Event trigger/switch rule.
- Script Command Gate.
- Name-based Project Data Reference uniqueness.
- Existence of ID-based Project Data References where the Data Domain is known in DSL-owned or external indexes.
- MV runtime shape requirements before writing Generated Project Data.

### Compile Output Materialization

Compile materializes DSL-owned domains into whole MV carrier files:

- Map Event entries are written into each affected `Map###.json` events array by explicit event ID.
- Common Events are written into `CommonEvents.json` by explicit ID.
- Variables and switches are written into their System Data arrays by explicit ID.
- Non-owned domains in those files are copied from Project Data Snapshot.

For Snapshot-Only Owned Entries, Compile Output represents absence from the DSL-owned domain. It does not mutate snapshot files. For event arrays, destructive absence materializes as null holes in Generated Project Data when removal is represented. For variable/switch arrays, destructive absence materializes as empty strings.

### Structured Diff Report

Diff compares only Generated Project Data and Project Data Snapshot. It must not read live Project Root state. The report groups by:

1. Data Domain.
2. Entry Identity.
3. Change detail.

Change classes include at least unchanged, generated-only, snapshot-only, changed, and non-owned-carried. Snapshot-only DSL-owned entries are reported as potential Destructive Changes. Reconciliation Hints attach to command-level differences where a raw MV command can be represented by an existing DSL helper or raw escape hatch.

### Push

Push performs preflight checks before writing:

1. Generated Freshness: current DSL source hash must match generated source hash in Sync Manifest.
2. Project Drift: current Project Root file hashes must match Project Data Snapshot hashes in Sync Manifest for affected files.
3. Destructive Change gate: normal Push rejects Destructive Changes; Destructive Push allows them.

If preflight passes, Push writes affected Generated Project Data files to Project Root with the MV-Style JSON Writer, refreshes affected Project Data Snapshot files from the written data, and updates Sync Manifest hashes.

### DSL Decompilation

DSL Decompilation reads Project Data Snapshot and writes Decompiled Source under the source root. It is non-destructive: existing output files cause failure in the first version. It emits explicit Entry Identity for every decompiled DSL-owned entry. It should prefer available DSL helpers and fall back to raw escape hatches when no supported helper exists.

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

CLI contract changes are breaking. `create`, `replace`, and independent `lint` are removed or no longer primary. `compile --check` is the validation path.

### Data Model / Persistence

Workspace Data State persists snapshots, generated files, and manifest metadata. The design requires deterministic hashing of:

- Project Data Snapshot files.
- Generated Project Data files.
- DSL source inputs selected by Definition Source Discovery.

Generated Project Data and Project Data Snapshot can be stored as whole MV data files. Sync Manifest records file hashes and source hashes only; it does not store entry bindings.

### Execution / Concurrency Semantics

Commands should avoid partial writes. Compile should fully validate before writing generated files. Push should complete all preflight checks before writing Project Root files. If Push writes multiple files, failure handling must avoid silently reporting success with only a subset updated; the implementation should either stage writes or report exactly which files were written if an unexpected filesystem failure occurs.

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

The project is still in development, so direct replacement is allowed. Tests and examples should be updated to the new command model rather than maintaining backward-compatible direct-write behavior. ADR-0005 explicitly supersedes the relevant direct-write parts of ADR-0002 and ADR-0003.

## Phase Slices

Reserved for `to-slices`. Do not fill this section in `to-design`.

| Phase | Goal | Depends On | Requirements | Success Criteria | Slice Candidates |
| --- | --- | --- | --- | --- | --- |

## Completion Contract

### Observable Truths

- [ ] OT-01: The CLI exposes the workspace compile/push command surface and no longer exposes `create` / `replace` as primary commands.
- [ ] OT-02: A workspace can clone a Project Root into Project Data Snapshot without writing DSL source or Project Root data.
- [ ] OT-03: A workspace can decompile Project Data Snapshot into non-destructive Decompiled Source with explicit Entry Identity.
- [ ] OT-04: A workspace can compile discovered DSL source into Generated Project Data without mutating Project Root or Project Data Snapshot.
- [ ] OT-05: Diff produces a Structured Diff Report comparing Generated Project Data and Project Data Snapshot.
- [ ] OT-06: Push rejects stale Generated Project Data.
- [ ] OT-07: Push rejects Project Drift.
- [ ] OT-08: Normal Push rejects Destructive Changes, while Destructive Push applies them without bypassing freshness or drift checks.
- [ ] OT-09: Successful Push writes Project Root data and refreshes affected Project Data Snapshot and Sync Manifest.

### Required Design Outcomes

- [ ] OUT-01: Workspace Config no longer requires Definition Bindings for workspace-level compilation.
- [ ] OUT-02: DSL-owned entries require explicit Entry Identity.
- [ ] OUT-03: Staged Data Graph can resolve same-run DSL-owned references and External Project Data References.
- [ ] OUT-04: Generated Project Data carries forward non-owned data domains from Project Data Snapshot.
- [ ] OUT-05: Entry Removal preserves MV IDs without array compaction.
- [ ] OUT-06: Sync Manifest stores hashes and freshness metadata, not Entry Identity bindings.

### Required Canonical Updates

- [ ] DOC-01: `CONTEXT.md` uses the new workspace compile/push vocabulary consistently.
- [ ] DOC-02: ADR-0005 and ADR-0006 remain aligned with implementation behavior.
- [ ] DOC-03: User-facing examples and sample workspace config reflect source-root discovery and explicit Entry Identity.
- [ ] DOC-04: README or CLI help describes the new command workflow and safe push behavior.

## Test Strategy

Highest-practical seam: workflow/CLI behavior using temporary workspaces and MV-like project data, following existing `workflow.test.ts`, `cli.test.ts`, and `workspace.test.ts` patterns. These tests should assert observable files, outputs, errors, and command availability rather than internal helper calls.

Required workflow tests:

- CLI command surface for `init`, `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- Workspace config loading with source-root discovery and without Definition Bindings.
- Clone captures snapshot files and writes snapshot hashes.
- Pull refreshes snapshot despite stale generated data.
- Compile requires Project Data Snapshot.
- Compile writes Generated Project Data and manifest freshness data without touching Project Root or snapshot.
- Compile resolves same-run DSL-owned references.
- Compile rejects duplicate Entry Identity.
- Compile allows duplicate Display Name unless referenced ambiguously by name.
- Diff rejects stale generated data.
- Diff reports generated-only, snapshot-only, and changed entries by Data Domain and Entry Identity.
- Push rejects stale generated data.
- Push rejects Project Drift.
- Normal Push rejects Destructive Changes.
- Destructive Push applies Destructive Changes and preserves ID holes.
- Successful Push updates Project Root, snapshot, and manifest.
- Decompile writes non-destructive source and fails if target output exists.

Focused pure-logic tests:

- Hash calculation and manifest comparison.
- Source discovery ordering and source hash stability.
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
- Supporting exclude globs for Definition Source Discovery if source-root recursion is insufficient.

## Open Questions

None that block design-to-slices. Exact workspace state directory names, manifest schema field names, and diff serialization details are implementation decisions within the locked boundaries above.
