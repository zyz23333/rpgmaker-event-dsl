# Slice 08: Golden Samples for Battle, Shop, and Complex Command Shapes

## Status

Ready

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../rmmv-event-dsl-first-version-design.md`
- PRD: `../rmmv-event-dsl-first-version-prd.md`

## Blocked By

- Slice 06

## Purpose

Confirm the complex first-version command families against editor-generated MV samples so that battle and shop command shapes do not drift from the real runtime/editor contract.

## Scope

### In

- Battle processing command families.
- Shop processing command families.
- Any additional complex command shapes that depend on sample confirmation.

### Out

- DSL syntax redesign.
- CLI workflow changes.
- Project index rules.

## Design References

- Requirements:
  - R-30
  - R-08
- Decisions:
  - Initial command coverage includes battle/shop with golden-sample confirmation
- Invariants:
  - Output must remain valid for MV runtime readers
- Completion Contract:
  - OT-04
- Canonical docs:
  - README.md
  - CONTEXT.md
  - references/rmmv-local-runtime-1.6.1/data/CommonEvents.json
  - references/rmmv-local-runtime-1.6.1/data/Map001.json

## Code Context

The repository already contains MV reference data and source copies. This slice uses those samples as the truth source for the most shape-sensitive command families.

## What To Build

Add or refine the regression coverage that proves battle and shop command compilation matches editor-generated MV samples.

## Acceptance Criteria

- [ ] Battle command output matches reference MV samples.
- [ ] Shop command output matches reference MV samples.
- [ ] The complex command families are covered in regression tests rather than ad hoc manual checks.

## Implementation Notes

This slice is about confirmation, not feature expansion. If a sample reveals a shape mismatch, the fix belongs in the compiler slice, not here.

## Suggested Task Plan

1. Capture or reference the golden samples.
2. Compare compiler output against them.
3. Keep the confirmation tests narrow and behavior-focused.

## Verification Commands

```bash
# to be defined by implementation
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
