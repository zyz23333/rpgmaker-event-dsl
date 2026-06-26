---
status: accepted
---

# Event data operations are create and replace

We decided that the first version of Event Data Management supports `create` and `replace` only, with no merge, upsert, partial update, or delete semantics. `create` appends new entries to the end of the target MV array, `replace` requires a unique existing name match, and both operations are strict about target identity so that event data changes remain explicit and easy to reason about.

Consequences:

- New Map Events and Common Events use append-only ID allocation.
- Existing entries are replaced only when the target name matches exactly once.
- Bare numeric IDs are not valid DSL references; explicit ID references are allowed only as explicit helpers.
- Null holes in MV arrays remain untouched in the first version.
