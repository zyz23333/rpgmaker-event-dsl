---
status: accepted
---

# Restricted shared authoring modules

We choose compile-time reuse through local TypeScript modules evaluated by the Event DSL's restricted source evaluator, rather than executing arbitrary TypeScript or JavaScript modules. Relative named value imports resolve to TypeScript implementations physically inside the configured sourceRoot and outside the Decompile isolation area; existing type-only dependencies remain validation inputs without value evaluation. Shared constants, configuration, references and commands compose into ordinary DSL values, leaving runtime Common Event calls and explicit Entry Identity unchanged.

Definition Source Discovery remains the declaration-collection boundary. Loading a dependency does not recursively collect its exported Event Definitions, and source include/exclude patterns select entry files rather than authorizing imports. Actual shared source reads, resolution observations and type-validation inputs belong to the same captured Compile Baseline; changing them invalidates Generated Freshness even when discovered entry files do not change. Cyclic value-module imports fail with a dependency chain, while type-only cycles follow TypeScript's existing rules.

This extends ADR 0013's former no-value-import boundary without allowing host module execution or event JavaScript execution. Parameterized Command Functions are named declarations or const arrows with zero parameters or one options object, and an expression body or const declarations followed by one return. Ordinary lexical bindings, including shadowing and const initialization order, apply within that subset. Functions compose values and commands; explicit event declarations retain Entry Identity. Host methods, general author-time computation/control flow, mutation, higher-order functions, recursion and Event Definition factories remain outside the boundary.

Decompile shares captured module resolution while retaining ADR 0014's separate lazy identity projection. Only identity-relevant bindings, option fields and function results are inspected; unrelated command bodies, type errors and the Script Command Gate do not trigger full existing-event validation. Indeterminate identities and candidate collisions still fail before complete candidate publication. Decompile emits expanded source and does not reconstruct original module/function boundaries. Per-use diagnostic origins do not change Native Saved Shape or runtime event context.

The user accepted the first-version scope and implementation graph on 2026-11-03. See the [shared authoring specification](https://github.com/zyz23333/rpgmaker-event-dsl/blob/98ad17b61371e349e09719009204e29264b16f1b/.scratch/shared-authoring-modules/shared-authoring-modules-spec.md) for the supported syntax and workflow acceptance boundary.
