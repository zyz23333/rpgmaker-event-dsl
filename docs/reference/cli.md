# CLI and Workspace Config

[Documentation](../README.md)

Run commands from the Workspace containing `rpgmaker-event-dsl.config.json`.
Use `npx rpgmaker-event-dsl`, `pnpm exec rpgmaker-event-dsl`, or an existing package
script that resolves the intended installed version. Commands below omit that prefix.
Read [Getting started](../getting-started.md) for installation and the
[workflow guide](../workflow.md) for synchronization and recovery behavior.

## Commands

| Command                                      | Writes to Project Root? | Purpose                                                                                           |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `init [workspaceRoot] --project-root <path>` | No                      | Creates config and the default source root; defaults to the current Workspace directory.          |
| `clone`                                      | No                      | Captures the initial Standard Project Data Snapshot.                                              |
| `pull`                                       | No                      | Refreshes the Snapshot from the configured Project Root.                                          |
| `decompile`                                  | No                      | Publishes starter DSL source from the Snapshot in a new `sourceRoot/decompiled/` directory.       |
| `compile --check`                            | No                      | Validates the complete candidate without publishing Generated Project Data or freshness metadata. |
| `compile`                                    | No                      | Validates and publishes Generated Project Data inside the Workspace.                              |
| `diff`                                       | No                      | Compares fresh Generated Project Data with the Snapshot.                                          |
| `push`                                       | Yes                     | Applies fresh generated data after drift, integrity and asset checks.                             |

`init` accepts a relative or absolute Project Root containing a `.rpgproject` file
and `data/`. Relative project paths resolve from the selected Workspace Root.
An existing Workspace Config is never overwritten by initialization.

## Options

| Option                  | Applies to         | Meaning                                                                       |
| ----------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `--check`               | `compile`          | Validate without publishing output; does not make existing output fresh.      |
| `--short`               | `diff`             | Show a summary without entry details.                                         |
| `--file <relativePath>` | `diff`             | Filter the structured view, for example `Map001.json` or `Map1001.json`.      |
| `--allow-destructive`   | `push`             | Allow reviewed removals and Troop Event Resets; all other checks still apply. |
| `--help`                | CLI or any command | Show available syntax.                                                        |
| `--version`             | CLI                | Show the package version.                                                     |

A Diff file filter changes the displayed details, not ownership or write authority.
The report retains global destructive-change status and lists the Affected Project
Data Files that Push would write if its checks pass. Diff compares parsed JSON:
object key order, formatting and equivalent escapes do not create changes. Key
presence, array length/order, exact strings and negative zero remain significant.
Live byte changes still count as [Project Drift](../workflow.md#project-drift).

## Workspace Config

The config file is `rpgmaker-event-dsl.config.json` at the Workspace Root:

```json
{
  "projectRoot": "../Game",
  "scriptEnabled": false,
  "sourceRoot": "src",
  "sourceInclude": ["**/*.events.ts", "**/*.dsl.ts"],
  "sourceExclude": ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
  "assetCheckExceptions": []
}
```

| Field                  | Meaning                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `projectRoot`          | Required nonempty path to the MV project, resolved from the Workspace.                                                   |
| `scriptEnabled`        | Required Boolean; Init writes `false`. Controls recognized event JavaScript inputs.                                      |
| `sourceRoot`           | Required nonempty path; Init writes `src`. Pre-create a custom root before Decompile.                                    |
| `sourceInclude`        | Required array of entry discovery patterns; Init uses the two patterns above. An empty array selects all ordinary files. |
| `sourceExclude`        | Required array of exclusion patterns; directory exclusions include descendants.                                          |
| `assetCheckExceptions` | Optional array of exact, reasoned asset exceptions; omission is equivalent to `[]`.                                      |

Unknown config fields fail validation. The [authoring guide](../authoring.md#source-discovery)
explains entry discovery versus shared dependencies. See [asset exceptions](assets.md#asset-check-exceptions)
for permitted keys and downgrades, and [Script Command Gate](commands/extensions.md#raw-commands-and-the-script-command-gate)
for recognized JavaScript inputs.

Changing `projectRoot` requires an explicit Pull to establish the new binding,
then Compile. A pending Interrupted Push must first be resolved against its original
target. See [Snapshot binding](../workflow.md#what-gets-snapshotted).

## Programmatic Workspace API

The package root exports Event DSL authoring helpers and domain types.
`rpgmaker-event-dsl/workspace` exports Workspace operations, including `initWorkspace`,
`cloneWorkspace`, `pullWorkspace`, `decompileWorkspace`, `compileWorkspace`,
`diffWorkspace`, `pushWorkspace` and `isGeneratedProjectDataFresh`.
Use the installed TypeScript declarations for option and return types. Programmatic
calls use the same validation and per-Workspace lock as the CLI.
