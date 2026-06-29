# Workspace Compile Push Model PRD

## Change Slug

`workspace-compile-push-model`

## Problem Statement

Developers using Event DSL on brownfield RPG Maker MV projects need a safer way to take over event-related project data without directly overwriting Project Root files on every DSL run. The current `create` / `replace` workflow writes directly to MV data files, uses Display Name matching as the operation target, and cannot represent a full workspace-level desired state. This makes editor collaboration risky: a developer may adjust event positions or commands in the RPG Maker MV editor, then accidentally overwrite those changes with a later DSL run.

The current model also cannot naturally resolve references to DSL-owned data created in the same workspace compilation, such as a Map Event calling a Common Event defined by the same DSL source set before that Common Event has been written to `CommonEvents.json`. As the DSL expands to Variable Definitions and Switch Definitions, operation-by-operation `create` / `replace` becomes an increasingly poor user model.

## Solution

Replace the direct `create` / `replace` workflow with a workspace-level compile and synchronization model. Developers will use Event DSL as the authority for DSL-Owned Project Data domains, first covering the Event Data Store and System Data variable and switch entries.

The workspace will maintain Workspace Data State:

- Project Data Snapshots captured from the Project Root.
- Generated Project Data produced by compilation.
- A Sync Manifest containing synchronization hashes and Generated Freshness metadata.

The main user workflow becomes:

1. `clone` captures the initial Project Data Snapshot from a Project Root.
2. `decompile` turns the Project Data Snapshot into non-destructive Decompiled Source with explicit Entry Identities.
3. `compile` validates the Staged Data Graph and produces complete Compile Output for all DSL-Owned Project Data domains.
4. `diff` compares Generated Project Data with the Project Data Snapshot using a Structured Diff Report.
5. `push` writes Generated Project Data to the Project Root only after Generated Freshness and Project Drift checks pass.
6. `pull` refreshes the Project Data Snapshot from the Project Root for later reconciliation.

Entry Identity is explicit in DSL and is defined as Data Domain plus RPG Maker MV ID. Display Names remain useful for humans and name-based references when unique, but they are not identity.

## User Stories

1. As a brownfield project developer, I want to clone the current Project Root into a Project Data Snapshot, so that I can inspect and take over existing MV data without immediately changing the project.
2. As a brownfield project developer, I want DSL Decompilation to generate initial DSL declarations from my Project Data Snapshot, so that I can migrate existing events into DSL incrementally.
3. As a brownfield project developer, I want Decompiled Source to be written non-destructively, so that generated DSL skeletons do not overwrite hand-maintained source files.
4. As a brownfield project developer, I want decompiled commands to use DSL helpers when possible and raw escape hatches when needed, so that unsupported MV commands do not block migration.
5. As a DSL author, I want `compile` to generate local Generated Project Data instead of writing directly to the Project Root, so that I can review the intended output before applying it.
6. As a DSL author, I want `compile` to validate the Staged Data Graph, so that missing references, duplicate Entry Identities, and invalid DSL-owned data are caught before any Project Root write.
7. As a DSL author, I want Map Events, Common Events, Variable Definitions, and Switch Definitions to declare explicit Entry Identities, so that RPG Maker MV IDs remain stable across compile, diff, pull, and push.
8. As a DSL author, I want Display Names to be allowed to repeat, so that brownfield projects with duplicate MV names can still be represented.
9. As a DSL author, I want name-based Project Data References to fail when a Display Name is ambiguous, so that the tool never silently resolves to the wrong entry.
10. As a DSL author, I want ID-based Project Data References to remain available, so that ambiguous brownfield data can still be referenced precisely.
11. As a DSL author, I want a Map Event to call a Common Event defined in the same compile run, so that DSL-owned data can reference other DSL-owned data before it has been pushed to the Project Root.
12. As a DSL author, I want events to reference external RPG Maker MV data such as actors, items, troops, and maps from the Project Data Snapshot, so that Event DSL can remain project-aware without owning every MV data domain.
13. As a DSL author, I want Variable Definitions and Switch Definitions to be DSL-owned data domains, so that event logic and the key system state it depends on are represented together.
14. As a developer using the RPG Maker MV editor, I want editor-side changes to be detected as Project Drift before push, so that a DSL push cannot silently overwrite changes made since the last snapshot.
15. As a developer using the RPG Maker MV editor, I want `pull` to refresh the Project Data Snapshot without running diff or modifying DSL source, so that I can capture the editor's current state as a separate step.
16. As a developer reviewing changes, I want `diff` to compare Generated Project Data with the Project Data Snapshot, so that I can see what the DSL currently wants to change relative to the project snapshot.
17. As a developer reviewing changes, I want Diff output to be structured by Data Domain, entry, and command-level detail, so that large brownfield differences are readable and actionable.
18. As a developer reviewing changes, I want Diff to include Reconciliation Hints for raw MV data where possible, so that I can manually update DSL source toward the project snapshot.
19. As a developer migrating a project, I want Snapshot-Only Owned Entries to appear in Diff, so that I know which project entries are not yet represented in DSL.
20. As a developer migrating a project, I want normal `push` to reject Destructive Changes, so that missing DSL coverage does not accidentally remove project data.
21. As a developer intentionally removing DSL-owned entries, I want an explicit Destructive Push option, so that I can remove Snapshot-Only Owned Entries after reviewing the impact.
22. As a developer using Destructive Push, I want it to still enforce Generated Freshness and Project Drift checks, so that destructive intent does not become an unsafe force push.
23. As a DSL author, I want removed Map Events and Common Events to leave null holes instead of compacting arrays, so that MV IDs remain stable.
24. As a DSL author, I want removed Variable Definitions and Switch Definitions to become empty strings instead of compacting arrays, so that variable and switch IDs remain stable.
25. As a workspace user, I want `push` to refresh the affected Project Data Snapshot and Sync Manifest after a successful write, so that later drift checks use the new baseline.
26. As a workspace user, I want `diff` and `push` to reject stale Generated Project Data, so that I do not inspect or push output produced from older DSL source.
27. As a workspace user, I want `compile --check` to validate without requiring a separate `lint` command, so that validation follows the same model as compilation.
28. As a workspace user, I want Definition Source Discovery to collect source files from the workspace source root, so that compilation is workspace-level rather than binding-level.
29. As a workspace user, I want Decompiled Source to participate in Definition Source Discovery by default, so that decompiled DSL can immediately compile unless I move it outside the source root.
30. As a project maintainer, I want Generated Project Data and Project Data Snapshots to be optional workspace state rather than the source of truth, so that repository policy can focus on DSL source and workspace config.

## Implementation Decisions

- Replace `create` and `replace` as primary user-facing operation modes with `clone`, `pull`, `decompile`, `compile`, `diff`, and `push`.
- Treat `compile` as the operation that validates the Staged Data Graph and produces complete Compile Output for all DSL-Owned Project Data domains.
- Require a Project Data Snapshot before first-version compilation.
- Treat `pull` as a snapshot refresh only; it does not run Diff, check Generated Freshness, or modify DSL source.
- Treat `clone` as the initial Project Data Snapshot capture only; it does not automatically perform DSL Decompilation.
- Treat `diff` as a Structured Diff Report comparing Generated Project Data with Project Data Snapshot.
- Treat `push` as a gated synchronization operation that checks Generated Freshness and Project Drift before writing to the Project Root.
- Refresh the affected Project Data Snapshot and Sync Manifest after successful Push.
- Add an explicit Destructive Push option for Destructive Changes; do not make it bypass Generated Freshness or Project Drift checks.
- Define DSL-Owned Project Data by Data Domain, not by JSON file.
- First DSL-Owned Project Data domains are Event Data Store plus System Data variable and switch entries.
- Allow Project Data Snapshots and Generated Project Data to store whole MV data files as carriers while only DSL-owned domains are generated from DSL.
- Carry non-owned data domains forward from Project Data Snapshot into Generated Project Data.
- Define Entry Identity as Data Domain plus RPG Maker MV ID, expressed directly in DSL source.
- Require explicit Entry Identity for first-version Map Events, Common Events, Variable Definitions, and Switch Definitions.
- Do not use Sync Manifest as an Entry Identity binding source of truth.
- Allow duplicate Display Names.
- Allow name-based Project Data References only when the Display Name resolves to exactly one entry.
- Preserve ID stability during Entry Removal: null holes for event arrays and empty strings for variable and switch arrays.
- Use Definition Source Discovery from a workspace source root rather than Definition Bindings.
- Have DSL Decompilation produce non-destructive Decompiled Source for all DSL-Owned Project Data domains.
- Prefer output under a decompiled source area inside the workspace source root, while leaving exact file layout to design.
- Make Generated Project Data, Project Data Snapshot, and Sync Manifest workspace state that is not required to be committed.

## Testing Decisions

- Prefer highest-seam tests around CLI/workflow behavior, because the core value is user-visible workspace state transitions rather than individual helper implementation.
- Existing workflow-style tests are useful prior art: they create temporary workspaces, MV-like project data, source files, and assert command effects without relying on implementation details.
- Add behavior tests for `clone`, `pull`, `compile`, `diff`, `push`, and `decompile` as user-facing workflows.
- Test that `compile` requires a Project Data Snapshot and produces Generated Project Data without mutating the Project Root or Project Data Snapshot.
- Test that the Staged Data Graph resolves references across DSL-owned entries in the same compile run, including Map Events calling DSL-owned Common Events.
- Test that duplicate Entry Identities fail compilation, while duplicate Display Names are allowed.
- Test that ambiguous name-based Project Data References fail compilation.
- Test that Variable Definitions and Switch Definitions are compiled into the owned System Data domains.
- Test that non-owned data domains in carrier files are carried forward from Project Data Snapshot into Generated Project Data.
- Test that `diff` requires Generated Freshness and reports changes grouped by Data Domain and entry.
- Test that Snapshot-Only Owned Entries appear in Diff without compile mutating snapshot files.
- Test that `push` rejects stale Generated Project Data.
- Test that `push` rejects Project Drift and instructs the user to pull first.
- Test that normal `push` rejects Destructive Changes, while Destructive Push accepts them without bypassing Generated Freshness or Project Drift checks.
- Test Entry Removal representation: null holes for Map Event and Common Event arrays, empty strings for variable and switch arrays.
- Test that successful Push updates Project Root, affected Project Data Snapshot, and Sync Manifest.
- Test that `pull` refreshes Project Data Snapshot even when Generated Project Data is stale.
- Test DSL Decompilation at the workflow seam: output is non-destructive, includes explicit Entry Identities, and emits raw escape hatches for unsupported commands.
- Keep lower-level unit tests for pure logic that is hard to observe through CLI tests, such as structured diff classification, manifest hash comparison, and raw command to Reconciliation Hint mapping.

## Out of Scope

- Full ownership of the entire RPG Maker MV `data/` directory.
- Field-level mixed ownership inside DSL-Owned Project Data domains.
- Force push that ignores Project Drift.
- Manifest-only Entry Identity binding.
- Automatic rewriting of DSL source to assign IDs.
- Default overwrite behavior for DSL Decompilation output.
- Perfect raw MV data to high-level DSL round-tripping.
- Semantic command diff beyond the first Structured Diff Report and Reconciliation Hint model.
- A separate `lint` command as a first-version validation entry point.
- Committing Generated Project Data, Project Data Snapshots, or Sync Manifest as a required workflow.
- Automatic `decompile` during `clone`.
- Automatic `diff` during `compile` or `pull`.

## Further Notes

This PRD follows ADR-0005 and ADR-0006. ADR-0005 supersedes the direct-write shape from ADR-0002 and ADR-0003 for the next implementation phase. ADR-0006 fixes Entry Identity on explicit RPG Maker MV IDs rather than Display Names or Sync Manifest bindings.

The expected follow-up is a design document for the workspace data layout, command contracts, source discovery behavior, Staged Data Graph construction, structured diff schema, and push safety checks.
