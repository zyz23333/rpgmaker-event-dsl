# Changelog

All notable changes to this package will be documented in this file.

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
  surface.
- Added workspace workflow commands: `init`, `clone`, `pull`, `decompile`, `compile`,
  `diff`, and `push`.
- Added generated freshness checks, project drift checks, and explicit destructive-change
  review through `push --allow-destructive`.
- Added workspace source discovery for `**/*.events.ts` and `**/*.dsl.ts` declaration
  files.
- Added `rawDslCommand(...)` as an explicit escape hatch for confirmed raw RPG Maker MV
  command shapes and unsupported or malformed decompiled commands.
- Added script gating through the workspace `scriptEnabled` setting for JavaScript-bearing
  event inputs.

### Known Limitations

- The package is in early development and has not reached a stable `1.0.0` API.
- The TypeScript API, DSL syntax, generated output, workspace config, and CLI workflow may
  change before `1.0.0`.
- Test coverage is still incomplete.
- The DSL targets the standard RPG Maker MV 1.6.1 editor event command surface; plugin
  command argument semantics and non-standard custom `data/*.json` files are not validated.
