# 03: Inspect Map Event Pages and Commands

**What to build:** An agent can inspect one event's pages and request full command detail from the selected snapshot or generated source, enabling focused analysis of existing interactions.

**Blocked by:** [02: Observe Generated Maps with Verified Source Routing](02-inspect-generated-map-source.md).

**Status:** ready-for-agent

**Category:** enhancement

**Parent spec:** [Map Inspection and Map Preview](../map-inspection-and-preview-spec.md)

## Acceptance criteria

- [ ] Event inspection reports page conditions, triggers, image definitions, and command summaries from the selected source.
- [ ] Full commands are opt-in and preserve raw MV records while identifying unsupported shapes without inventing semantics or executing scripts.
- [ ] Event selection and command-detail option validation work through the CLI and the existing typed inspection interface.
- [ ] Generated event detail reflects compiled domain replacement and does not borrow removed snapshot events or missing appearance.
- [ ] Public-interface tests cover valid, image-free, condition-bearing, malformed, and nonexistent event data without image-file prerequisites.
