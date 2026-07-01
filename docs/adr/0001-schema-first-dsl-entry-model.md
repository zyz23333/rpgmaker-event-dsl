---
status: accepted
---

# Schema-first DSL entry model

We decided to make the RPG Maker MV DSL schema-first and developer-facing, with named TypeScript exports as the module boundary and object-shaped inputs for `mapEvent`, `commonEvent`, `page`, System Data definitions, and command helpers. This keeps the authoring surface explicit, makes validation predictable, and avoids the ambiguity of positional patch scripts or mixed entry styles.

Consequences:

- Developers write DSL declarations, not patch operations directly.
- `mapEvent`, `commonEvent`, `page`, `variableDefinition`, and `switchDefinition` all use object inputs with named fields.
- Named exports are the only first-version collection boundary; default exports are out of scope.
- Definition Source Discovery selects declaration files from the Workspace source root.
- DSL-owned target identity comes from explicit Entry Identity in DSL source, not CLI target overrides, filename inference, or configuration-owned Definition Targets.
