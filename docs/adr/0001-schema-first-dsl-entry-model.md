---
status: accepted
---

# Schema-first DSL entry model

We decided to make the first version of the RPG Maker MV DSL schema-first and developer-facing, with named TypeScript exports as the module boundary and object-shaped inputs for `mapEvent`, `commonEvent`, `page`, and command helpers. This keeps the authoring surface explicit, makes validation predictable, and avoids the ambiguity of positional patch scripts or mixed entry styles.

Consequences:

- Developers write Event Definitions, not patch operations directly.
- `mapEvent`, `commonEvent`, and `page` all use object inputs with named fields.
- Named exports are the only first-version collection boundary; default exports are out of scope.
- Map targets come from configuration, not CLI target overrides or filename inference.
