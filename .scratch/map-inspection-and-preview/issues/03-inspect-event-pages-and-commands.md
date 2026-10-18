# 03: Inspect Map Event Pages and Commands

**What to build:** An agent can inspect one event's pages and request full command detail from the selected snapshot or generated source, enabling focused analysis of existing interactions.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** resolved

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [x] Event inspection reports page conditions, triggers, image definitions, and command summaries from the selected source.
- [x] Full commands are opt-in and preserve raw MV records while identifying unsupported shapes without inventing semantics or executing scripts.
- [x] Event selection and command-detail option validation work through the CLI and the existing typed inspection interface.
- [x] Generated event detail reflects compiled domain replacement and does not borrow removed snapshot events or missing appearance.
- [x] Public-interface tests cover valid, image-free, condition-bearing, malformed, and nonexistent event data without image-file prerequisites.

## Verification

- Added the event variant of the single typed inspection selector and versioned `map-event` results, including each page's stored conditions, numeric/readable trigger, image definition, command summary, and relevant named references. Page numbers are one-based; inspection makes no runtime activation claim.
- Command detail is opt-in through `selector: { kind: "event", eventId, commands: true }` or `map inspect --map <id> --event <id> --commands`. Raw MV records retain extra fields and unknown/malformed shapes. Compact summaries use the existing pure decompiler to identify supported command spans, while unsupported spans retain their record locations and produce typed warnings. Stored script text is never executed.
- Relevant conditions and Common Event calls resolve names through source-aware supporting-data routing. Generated detail reads generated System/Common Event definitions and records their actual provenance. Snapshot-only events and appearance are never inherited into generated results.
- Added dedicated public Workspace tests and real CLI subprocess tests covering character/image-free pages, enabled conditions, source fidelity, unknown/unsupported records, script non-execution, raw opt-in, malformed pages, and invalid/nonexistent identities. Reads compare all authoritative Workspace bytes before and after; no images are required.
- Focused Map Inspection and module-architecture verification passed: 6 test files / 37 tests. `pnpm typecheck`, `pnpm lint`, and `pnpm format:check` passed.
