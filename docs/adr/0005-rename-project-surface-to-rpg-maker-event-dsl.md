---
status: accepted
---

# Rename project surface to RPG Maker Event DSL

We decided to rename the public project surface from RMMV Event DSL to RPG Maker Event DSL before the first public release. The first implementation still supports RPG Maker MV project data, but the broader name avoids making MV-specific terminology part of package names, CLI commands, workspace config filenames, or workspace state directories when RPG Maker MZ support is likely later.

Consequences:

- The npm package, import path, and CLI command are `rpgmaker-event-dsl`.
- The package implementation lives in `packages/rpgmaker-event-dsl`.
- The Workspace Config file is `rpgmaker-event-dsl.config.json`.
- The Workspace Data State directory is `.rpgmaker-event-dsl`.
- Old RMMV names are not retained as compatibility aliases because the package has not had a public release.
- This rename does not add an engine target setting or RPG Maker MZ behavior; those require a separate design for compatibility, detection, and validation.
