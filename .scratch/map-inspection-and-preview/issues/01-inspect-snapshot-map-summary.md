# 01: Select a Map and Inspect Its Snapshot Summary

**What to build:** An author or agent can discover maps and inspect the Selected Map's snapshot summary through the CLI and Workspace interface, with explicit identity, source provenance, and existing read prerequisites.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Map listing reports numeric IDs, display names, and parent relationships; duplicate names remain distinguishable.
- [ ] Snapshot map summaries expose dimensions, tileset, settings, and event identities, names, and definition positions without dumping all cells or commands.
- [ ] The CLI and reusable Workspace operations expose versioned structured results and human-readable output; JSON stdout contains no progress chatter.
- [ ] Invalid map selection, missing snapshot prerequisites, and pending Interrupted Push state fail actionably without implicit synchronization.
- [ ] Public-interface tests use controlled temporary Workspaces and verify observation leaves authoritative data unchanged.
