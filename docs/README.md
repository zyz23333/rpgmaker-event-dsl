# Documentation

These pages describe the current repository checkout, including unreleased changes.
The npm release and the checkout can expose different APIs. Follow the
[checkout installation steps](getting-started.md#use-the-current-checkout) to run
the examples here; for an installed release, consult its bundled README and CHANGELOG.

## Guides

| What you want to do                                      | Read                                           |
| -------------------------------------------------------- | ---------------------------------------------- |
| Set up a Workspace or take over an existing game         | [Getting started](getting-started.md)          |
| Organize declarations and reuse commands across events   | [Authoring Event DSL source](authoring.md)     |
| Bring in editor changes, review output or recover a Push | [Workspace workflow and recovery](workflow.md) |

## Reference

| What you need to look up                                 | Read                                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| CLI arguments and Workspace Config                       | [CLI and configuration](reference/cli.md)                |
| Event identities, references, Map Pages and Battle Pages | [Events, identities and references](reference/events.md) |
| Event command inputs, defaults and saved behavior        | [Command reference](reference/commands/README.md)        |
| Asset names, file checks, diagnostics and exceptions     | [Assets and file validation](reference/assets.md)        |

## Examples and agents

- [Shared authoring](../example/shared-authoring/README.md): a small complete workflow
  with reusable rewards and a transitive dependency change.
- [Full event](../example/full-event/README.md): representative command families,
  including Script and raw commands; requires matching project data and assets.
- [Agent Event Authoring Skill](../skills/rpgmaker-event-authoring/SKILL.md):
  independently distributable guidance for agents authoring events. Installation is
  documented in the [project README](../README.md#agent-event-authoring-skill).

## Project maintenance

For domain vocabulary, read the [glossary](../GLOSSARY.md). For the reasons behind
design boundaries, read the [architecture decisions](adr/). Current user-facing
behavior belongs in the guides and references above; ADRs preserve decision context.
Release history is recorded in the [changelog](../CHANGELOG.md).

Use Windows, Node.js 22 and pnpm 10.33.0 to work on this checkout:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm --filter rpgmaker-event-dsl test:windows-baseline
```

The Windows verification cases require Node 22 explicitly. After a first build,
run `pnpm install --frozen-lockfile` again to refresh executable links for the
example packages. The [getting-started guide](getting-started.md) explains how to
use the built package from a separate game Workspace.
