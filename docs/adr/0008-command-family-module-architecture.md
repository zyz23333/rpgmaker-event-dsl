---
status: accepted
---

# Organize Event DSL implementation as command-family vertical slices

We decided to organize Supported Event Command behavior as command-family vertical slices,
with separate horizontal coordination modules for compilation, decompilation, validation,
Workspace use cases, and RPG Maker MV Project Data IO.

This decision replaces the earlier stage-first layout recorded in this ADR. The project has
no external consumers that require compatibility with the transitional module structure, so
the migration removes the old `dsl.ts`, `decompiler.ts`, `workflow.ts`, and
`staged-graph.ts` facades instead of preserving compatibility re-exports.

Consequences:

- `src/commands/<family>/` owns authoring helpers and the specialized compiler or
  decompiler behavior assigned to one RPG Maker MV command family. Cross-family command
  unions and exhaustive validation remain in their owning horizontal modules.
- `src/domain/` owns declarations, references, assets, runtime selectors, and the combined
  DSL Command union. Domain modules do not depend on authoring, compiler, decompiler,
  validation, Workspace, Project Data, CLI, or package entry modules.
- `src/compiler/` owns Raw Event Command types, exhaustive command dispatch, event
  compilation, and compiler-only shared encoders.
- `src/decompiler/` owns decompiler types, exhaustive Raw Event Command dispatch, project
  decompilation, and decompiler-only parsing and rendering helpers.
- `src/validation/` owns Staged Data Graph construction, reference resolution, identity
  validation, command validation, input inspection, and snapshot validation.
- `src/workspace/` owns Workspace Config, Workspace Data State, Definition Source
  discovery, and the clone, pull, decompile, compile, diff, and push use cases.
- `src/project-data/` owns RPG Maker MV Project Data readers, stable writers,
  materialization, snapshots, and Structured Diff behavior that is independent of a
  specific Workspace command.
- `src/index.ts` exports only the Event DSL authoring surface and its domain types.
- `src/workspace-api.ts` is the optional programmatic Workspace API. CLI implementation is
  not part of either public library surface.
- Internal modules import the module that owns a value or type. They do not import package
  entry points or parent facades.
- Central compiler and decompiler dispatchers may depend on command-family modules;
  command-family modules may depend only on their stage's stable types and shared helpers,
  preventing reciprocal dispatcher dependencies. Validation owns the exhaustive
  cross-family traversal and may delegate family-specific rules as those rules grow.
- Adding a Supported Event Command updates the matching command-family slice and the
  relevant exhaustive dispatcher. Coverage must include authoring, compilation,
  decompilation, validation, and round-trip behavior where each stage applies.
- The existing Event DSL behavior, Workspace safety model, and RPG Maker MV output semantics
  are preserved by this structural migration unless a separate decision explicitly changes
  them.
