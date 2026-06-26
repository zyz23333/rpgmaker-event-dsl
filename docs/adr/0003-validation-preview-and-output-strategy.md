---
status: accepted
---

# Project-aware validation, preview, and MV-style output

We decided that `lint` and `create` / `replace` are project-aware by default, meaning the tool loads the configured RPG Maker MV project data, builds a Project Index, and validates definitions and planned operations before writing anything. The first version also provides `--dry-run` and `--diff`, and writes changed MV data files using a stable MV-style JSON writer instead of preserving original whitespace.

Consequences:

- Validation failures and planning failures produce no partial writes.
- `lint` is read-only and uses project data rather than static-only checks.
- Preview output shows entry-level summaries, and diff output adds full-file unified diffs.
- Changed `Map###.json` and `CommonEvents.json` files are rewritten in a stable MV-compatible format.
