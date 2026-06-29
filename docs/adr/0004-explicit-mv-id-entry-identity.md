---
status: accepted
---

# Entry identity uses explicit MV IDs

We decided that each DSL-owned data entry is identified by an explicit Entry Identity, defined as its Data Domain plus the RPG Maker MV ID used by that domain. Display names remain useful for humans and for name-based references when unique, but they are not identity because RPG Maker MV allows duplicate names in relevant data domains.

This avoids a manifest-only binding model where Sync Manifest would become a second source of truth for entry identity. DSL source must declare Entry Identity directly for Map Events, Common Events, Variable Definitions, and Switch Definitions in the first version.

Consequences:

- Map Events include both `mapId` and event `id` in DSL.
- Common Events, Variable Definitions, and Switch Definitions include explicit `id` in DSL.
- Entry Identity uniqueness is required within its Data Domain.
- Display Name uniqueness is not required.
- Name-based Project Data References are valid only when the Display Name resolves to exactly one entry.
- ID-based Project Data References remain the stable path for ambiguous brownfield data.
- Sync Manifest records synchronization hashes and Generated Freshness data, but not Entry Identity bindings.
- Entry Removal preserves MV IDs: event arrays leave null holes, while variable and switch arrays write empty strings instead of compacting arrays.
