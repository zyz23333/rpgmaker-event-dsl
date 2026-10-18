# 01: Select a Map and Inspect Its Snapshot Summary

**What to build:** An author or agent can discover maps and inspect the Selected Map's snapshot summary through the CLI and Workspace interface, with explicit identity, source provenance, and existing read prerequisites.

**Blocked by:** None (can start immediately).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Map listing reports numeric IDs, display names, and parent relationships; duplicate names remain distinguishable.
- [x] Snapshot map summaries expose dimensions, tileset, settings, and event identities, names, and definition positions without dumping all cells or commands.
- [x] The CLI and reusable Workspace operations expose versioned structured results and human-readable output; JSON stdout contains no progress chatter.
- [x] Invalid map selection, missing snapshot prerequisites, and pending Interrupted Push state fail actionably without implicit synchronization.
- [x] Public-interface tests use controlled temporary Workspaces and verify observation leaves authoritative data unchanged.

## Verification

- Added public `listWorkspaceMaps` and `inspectWorkspaceMap` operations with versioned list/summary results, explicit source and map identity, and actual data-input byte hashes. Added `map list` and `map inspect --map <id>` with source selection, readable output, and clean JSON stdout.
- Added validated native-MV map, map-directory, and tileset reading behind the Workspace boundary. Structured inspection requires no image files. Generated observation routing remains ticket 02's scope.
- Exercised the spec-approved public Workspace seam using real temporary Workspaces and the CLI seam using real subprocesses. Covered duplicate names, summary shape, saved-project changes without implicit Pull, invalid identities/sources, missing snapshot/supporting data, malformed data, pending Interrupted Push, actual provenance, and unchanged authoritative files on successful and failing reads.
- `pnpm check` passed: typecheck, lint, format, and all 15 test files / 123 tests.
- `pnpm build` passed.
