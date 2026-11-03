---
status: accepted
---

# Restricted shared authoring modules

We choose compile-time reuse through local TypeScript modules evaluated by the Event DSL's restricted source evaluator, rather than executing arbitrary TypeScript or JavaScript modules. Relative named value imports resolve to TypeScript implementations physically inside the configured sourceRoot and outside the Decompile isolation area; existing type-only dependencies remain validation inputs without value evaluation. Shared constants, configuration, references and commands compose into ordinary DSL values, leaving runtime Common Event calls and explicit Entry Identity unchanged.

Definition Source Discovery remains the declaration-collection boundary. Loading a dependency does not recursively collect its exported Event Definitions, and source include/exclude patterns select entry files rather than authorizing imports. Actual shared source reads, resolution observations and type-validation inputs belong to the same captured Compile Baseline; changing them invalidates Generated Freshness even when discovered entry files do not change. Cyclic value-module imports fail with a dependency chain, while type-only cycles follow TypeScript's existing rules.

This extends ADR 0013's former no-value-import boundary without allowing host module execution or event JavaScript execution. The accepted first-version spec also defines a bounded parameterized command-function subset and Decompile identity compatibility; their implementation and acceptance are tracked separately from the initial shared-value slice. Full source evaluation must not replace ADR 0014's limited identity analysis.

The user accepted the first-version scope and implementation graph on 2026-11-03. See the [shared authoring specification](../../.scratch/shared-authoring-modules/shared-authoring-modules-spec.md) for the supported syntax and workflow acceptance boundary.
