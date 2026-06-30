# CLI Commands

Read this before choosing or running `rpgmaker-event-dsl` commands.

## Help First

When command syntax, flags, installed version behavior, or the package-manager command
form is uncertain, run:

- `rpgmaker-event-dsl --help`
- `rpgmaker-event-dsl <command> --help`

Use the command form that resolves in the Workspace, such as `npx rpgmaker-event-dsl`,
`pnpm exec rpgmaker-event-dsl`, or an existing package script. Do not invent flags from
memory.

## Commands

`init --project-root <path>` creates a Workspace config and source root. It requires a
Project Root containing a `.rpgproject` file and `data/`.

`clone` captures the initial Project Data Snapshot from the configured Project Root.

`pull` refreshes the Project Data Snapshot after RPG Maker MV editor changes.

`decompile` creates non-destructive starter Definition Source from the Project Data
Snapshot.

`compile --check` validates Definition Source and project-aware references without
writing Generated Project Data.

`compile` validates Definition Source and writes Generated Project Data inside the
Workspace.

`diff` compares Generated Project Data with the Project Data Snapshot. Use `diff --short`
for a compact summary and `diff --file <relativePath>` for one Project Data File.

`push` writes reviewed fresh Generated Project Data to the Project Root and requires
explicit user approval.

`push --allow-destructive` allows reviewed destructive changes and requires explicit user
confirmation of the destructive entries shown by Diff.
