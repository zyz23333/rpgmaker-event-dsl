# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning after `1.0.0`. Before `1.0.0`, the TypeScript
API, DSL syntax, CLI workflow, generated output, and workspace format may change between
minor releases.

## [Unreleased]

## [0.1.2] - 2026-07-02

### Fixed

- Fixed the project name in the MIT license copyright notice.

## [0.1.1] - 2026-07-02

### Fixed

- Fixed the published CLI entrypoint when executed through package manager bin shims.

## [0.1.0] - 2026-07-02

### Added

- Added the initial public release of `rpgmaker-event-dsl`.
- Added a TypeScript DSL for authoring supported RPG Maker MV switches, variables, common
  events, map events, event pages, references, assets, and event commands.
- Added MV-aligned command helpers for the RPG Maker MV 1.6.1 editor event command
  surface, including text, choices, flow control, switches, variables, movement, screen
  effects, audio, pictures, battle, actor, party, system, and transfer commands.
- Added explicit reference helpers for RPG Maker MV project data, including switches,
  variables, actors, classes, skills, items, weapons, armors, enemies, troops, states,
  animations, tilesets, maps, and common events.
- Added asset reference helpers for audio, image, and movie filename stems.
- Added workspace initialization with `rpgmaker-event-dsl init`.
- Added snapshot-based workflow commands:
  - `clone` to capture an initial RPG Maker MV project data snapshot.
  - `pull` to refresh the workspace snapshot after editor-side changes.
  - `compile --check` to validate discovered DSL source without writing generated data.
  - `compile` to generate RPG Maker MV project data from DSL source.
  - `diff` to inspect structured changes before writing to the game project.
  - `push` to write reviewed generated data back to the RPG Maker MV project.
- Added generated freshness checks so stale generated data cannot be pushed.
- Added project drift checks so editor-side changes are detected before affected files are
  overwritten.
- Added explicit destructive-change review through `push --allow-destructive`.
- Added non-destructive `decompile` support for generating starter DSL source from an RPG
  Maker MV project data snapshot.
- Added `rawDslCommand(...)` as an explicit escape hatch for confirmed raw RPG Maker MV
  command shapes and unsupported or malformed decompiled commands.
- Added workspace source discovery for `**/*.events.ts` and `**/*.dsl.ts` declaration
  files.
- Added script gating through the workspace `scriptEnabled` setting for JavaScript-bearing
  event inputs.
- Added a distributable `rpgmaker-event-authoring` agent skill for guided RPG Maker MV
  event authoring workflows.
- Added README documentation, example project material, architectural decision records,
  tests, and MIT licensing.

### Known Limitations

- The project is in early development and has not reached a stable `1.0.0` API.
- The TypeScript API, DSL syntax, generated output, workspace config, and CLI workflow may
  change before `1.0.0`.
- Test coverage is still incomplete.
- The DSL targets the standard RPG Maker MV 1.6.1 editor event command surface; plugin
  command argument semantics and non-standard custom `data/*.json` files are not validated.
- Asset references compile filename stems and do not scan the filesystem or resolve
  database IDs.
