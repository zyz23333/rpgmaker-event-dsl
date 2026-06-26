# Slice 02: MV Schema Catalogue and Canonical Type Shapes Decision

## Status

Ready

## Type

decision

## Tracker

External issue: none

## Parent Change

- Design: `../rmmv-event-dsl-first-version-design.md`
- PRD: `../rmmv-event-dsl-first-version-prd.md`

## Blocked By

- Slice 01

## Purpose

Collect the MV source material needed to freeze the first-version type and schema vocabulary before implementation begins. This slice prevents the DSL and compiler slices from making conflicting assumptions about event pages, raw commands, and command-specific payloads.

## Scope

### In

- Establish canonical shapes for map events, common events, pages, conditions, images, movement routes, and raw event commands.
- Confirm the first-version command catalogue and its expected raw command families.
- Confirm where the schema allows omission in the TypeScript input and where output must be complete.
- Capture the MV runtime and editor sample evidence needed to guide later type/schema work.

### Out

- Implementing the DSL.
- Implementing the compiler.
- Writing CLI commands.
- Implementing validation logic.

## Design References

- Requirements:
  - R-08
  - R-10
  - R-21
  - R-22
  - R-23
  - R-29
  - R-30
- Decisions:
  - Page condition slots
  - Map page trigger set
  - Common event trigger set
  - Empty command lists allowed
  - MV-style JSON writer
- Invariants:
  - Output shapes must remain valid for MV runtime readers
  - No silent inheritance from replaced entries
- Completion Contract:
  - OT-04
  - OUT-02
  - OUT-03
- Canonical docs:
  - README.md
  - CONTEXT.md
  - references/rpg-maker-mv-corescript/js/json_docs.js
  - references/rpg-maker-mv-corescript/js/rpg_objects/Game_Event.js
  - references/rpg-maker-mv-corescript/js/rpg_objects/Game_CommonEvent.js
  - references/rmmv-local-runtime-1.6.1/data/CommonEvents.json
  - references/rmmv-local-runtime-1.6.1/data/Map001.json

## Code Context

The repository already contains MV runtime source copies and sample JSON files. This slice formalizes which schema details those sources establish so later implementation work has a canonical contract to follow.

## What To Build

Write down the canonical MV schema catalogue and the first-version command set that later implementation slices must follow.

## Acceptance Criteria

- [ ] The canonical type/schema vocabulary for first-version MV data is fixed.
- [ ] The first-version command catalogue is fixed enough for the DSL and compiler slices to implement against.
- [ ] The decision explicitly distinguishes TypeScript input optionality from MV output completeness.

## Implementation Notes

This slice should stop at the type and schema contract. It should not encode implementation details of parsing, compilation, or CLI behavior.

## Suggested Task Plan

1. Capture MV schema evidence.
2. Freeze the canonical type shapes.
3. Freeze the first-version command catalogue and output expectations.

## Verification Commands

```bash
# decision slice; no build verification yet
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
