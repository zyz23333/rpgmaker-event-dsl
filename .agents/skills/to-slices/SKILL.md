---
name: to-slices
description: Inspect the current codebase and break a local PRD or change design into executable slice files under .scratch/<change-slug>/slices/. Use when you want tracer-bullet style implementation planning without publishing issue tracker items.
---

This skill turns a local PRD or change design into executable slice files and,
when a design exists, fills that design's `Phase Slices` section. Prefer the
design document as the source of truth whenever it exists.

If a question can be answered by exploring the codebase, explore the codebase
instead of asking the user. Only ask when the slice breakdown is genuinely
ambiguous.

## Process

1. Read the local design first when it exists, then the local PRD if present,
   then `CONTEXT.md` and relevant ADRs.
2. Determine or confirm the `change-slug`. The slice directory must live at
   `.scratch/<change-slug>/slices/`.
3. Run a design readiness check. If a design exists, it must contain enough
   target behavior, requirements, locked decisions, agent discretion,
   invariants, applicable conditional modules, and completion contract to
   plan implementation. If it does not, stop and recommend `to-design` or
   `grill-with-docs`; do not invent missing design decisions here.
4. Explore the current codebase for implementation surfaces: existing modules,
   tests, commands, migration paths, dependency behavior, and likely ordering
   constraints. Use this exploration to plan execution, not to revise the
   design silently.
5. Draft the slice breakdown as a numbered list before writing files. For each
   slice, show:
   - title
   - type (`vertical`, `foundation`, `migration`, `verification`, or
     `decision`)
   - blocked by
   - design references
   - code context
   - acceptance criteria
6. Quiz the user on the proposed breakdown before writing files. Ask:
   - Does the granularity feel right? Too coarse or too fine?
   - Are the dependency relationships correct?
   - Should any slices be merged, split, reordered, or converted to another
     type?
   - Are the right slices marked as `decision` rather than executable work?
   - Does any slice exceed the design's scope or miss a required invariant?
7. Iterate until the user approves the breakdown. Prefer a small number of thin
   slices over a single thick one.
8. Fill or update the design's `Phase Slices` section with the approved
   high-level phase plan.
9. Write or update the slice files in dependency order. Update existing files in
   place when the slice already exists.
10. Do a final consistency check so that every slice maps back to the design's
   requirements, decisions, invariants, and `Completion Contract`.
11. Report the slice directory path and the next recommended action.

## Slice File Template

<slice-template>

# Slice NN: <Name>

## Status

Ready | In Progress | Done | Blocked

## Type

vertical | foundation | migration | verification | decision

## Tracker

External issue: none

## Parent Change

- Design: `../<change-slug>-design.md`
- PRD: `../<change-slug>-prd.md` if applicable

## Blocked By

- None

## Purpose

What this slice unlocks and why it exists.

## Scope

### In

What this slice must change.

### Out

What this slice must not change.

## Design References

- Requirements:
- Decisions:
- Invariants:
- Completion Contract:
- Canonical docs:

## Code Context

Relevant existing modules, tests, docs, commands, or dependency findings found
during planning.

## What To Build

Concrete behavior or system path this slice implements.

## Acceptance Criteria

- [ ] Pass/fail criterion
- [ ] Pass/fail criterion

## Implementation Notes

Important constraints, expected modules, known pitfalls, migration notes, or
dependency findings.

## Suggested Task Plan

1. Add or update tests.
2. Implement the smallest production change.
3. Run focused verification.
4. Update docs if required.
5. Report changed files and verification result.

## Verification Commands

```bash
# commands
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.

</slice-template>

## Output Rules

- If the target directory does not exist, create it.
- If the file already exists, read it first and preserve still-valid content.
- Derive slices from the design when a design exists. Do not ignore the design
  in favor of PRD-only slicing for complex or high-risk work.
- If a design exists, fill or update its `Phase Slices` section as part of
  implementation planning.
- Do not silently add or change locked design decisions. Return to `to-design`
  or `grill-with-docs` when the design is not ready for slicing.
- Keep slices local. Do not publish them to an external tracker by default.
- Prefer vertical slices, but allow foundation, migration, verification, and
  decision slices when they reduce risk or unblock later work.
