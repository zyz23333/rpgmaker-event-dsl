# Slice 12: Coverage Documentation and Example Workspace Refresh

## Status

Ready

## Type

verification

## Tracker

External issue: none

## Parent Change

- Design: `../mv-command-coverage-design.md`

## Blocked By

- Slice 01: MV-Aligned Rename Foundation
- Slice 02: Shared Command Input Primitives
- Slice 03: Decompiler Completion Harness
- Slice 04: Message Commands
- Slice 05: Flow Control Completion
- Slice 06: Game Progression and Party
- Slice 07: Movement Commands
- Slice 08: Set Movement Route Subcommands
- Slice 09: Character and Screen Commands
- Slice 10: Audio, Video, System, and Map Commands
- Slice 11: Scene Control, Actor, Enemy, and Advanced Commands

## Purpose

Refresh user-facing docs and examples after the final helper surface exists, so the documented authoring workflow matches the implemented command coverage.

## Scope

### In

- README helper guidance and examples.
- `example/full-event` source refresh.
- `skills/rpgmaker-event-authoring` guidance and references.
- Any decompile/raw fallback documentation affected by the new coverage.

### Out

- Additional command implementation.
- Publishing to an external issue tracker.
- Marketing or landing-page style documentation.

## Design References

- Requirements: REQ-01, REQ-04, REQ-05, REQ-06, REQ-09
- Decisions: final helper names, Asset Reference strategy, raw escape hatch policy.
- Invariants: Script Input remains gated; raw escape hatch remains explicit.
- Completion Contract: DOC-02, DOC-03
- Canonical docs: `../mv-command-coverage-design.md`, README, `skills/rpgmaker-event-authoring`

## Code Context

Current README and example workspace reference the old helper names and only partial command coverage. Agent skill docs currently advise using supported helpers plus script/plugin/raw escape hatches.

## What To Build

Update documentation and examples to reflect the final full MV command coverage API and the remaining explicit escape hatch boundaries.

## Acceptance Criteria

- [ ] README examples use final helper names and current helper signatures.
- [ ] `example/full-event` compiles with final helper names and demonstrates representative command families.
- [ ] Agent Event Authoring Skill guidance reflects full helper coverage, Asset References, Script Gate, Plugin Command boundary, and raw fallback policy.
- [ ] No stale `controlSwitch` or `controlVariable` references remain.

## Implementation Notes

Do not try to document every helper exhaustively in prose if the result becomes noisy. Prefer representative examples plus a clear command coverage statement.

## Suggested Task Plan

1. Search for stale helper names and outdated coverage language.
2. Update README, example source, and skill guidance.
3. Run compile/check commands for the example if available.
4. Run repo checks.

## Verification Commands

```bash
rg "controlSwitch|controlVariable" README.md example skills packages
pnpm check
```

## Done When

- [ ] Acceptance criteria pass.
- [ ] Verification commands pass or skipped reason is documented.
- [ ] Design references remain satisfied.
- [ ] No unrelated scope was added.
