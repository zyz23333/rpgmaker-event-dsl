---
status: accepted
---

# Organize Event DSL implementation by command family and processing stage

We decided to split the Event DSL implementation into explicit domain, authoring,
compilation, decompilation, validation, and workflow modules. Event command behavior is
grouped by RPG Maker MV command family inside each processing stage, while the existing
top-level modules remain small coordination and package-boundary facades.

Consequences:

- DSL command constructors live under `src/commands/` and are grouped by command family.
- Domain types live under `src/domain/` and separate declarations, references, and command
  node types.
- Event command compilation lives under `src/compiler/commands/`; the central dispatcher
  performs exhaustive routing while parameter encoders live in focused modules.
- Event command decompilation lives under `src/decompiler/commands/`; sequence-aware
  dispatch remains centralized while command renderers live in focused modules.
- Staged Data Graph validation delegates identity, reference, command, inspection, and
  snapshot behavior to `src/validation/` modules.
- Interrupted Push and Push write behavior live under `src/workflow/push.ts`, while
  `src/workflow.ts` coordinates the public Workspace workflow.
- New Supported Event Commands should update the matching command-family modules in the
  authoring, compilation, decompilation, and validation stages.
- The package's named authoring exports and Workspace safety behavior remain unchanged by
  this structural decision.
