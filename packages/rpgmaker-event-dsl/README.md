# RPG Maker Event DSL

Write supported RPG Maker MV event logic as TypeScript and compile it into normal
MV project data. The package provides event authoring helpers and a CLI for
snapshot-based validation, review and synchronization.

The current stage supports Windows and RPG Maker MV 1.6.1, with Node.js 22 as the
runtime and CI baseline. APIs, generated output and Workspace formats may change
before 1.0.0.

## Install

In an Event DSL Workspace next to your MV game project:

```powershell
npm init -y
npm pkg set type=module
npm install --save-dev rpgmaker-event-dsl
npx rpgmaker-event-dsl --version
```

The linked repository guides describe development HEAD and can include unreleased
APIs. For a release, use its bundled README and CHANGELOG to identify supported
behavior. To run the current repository examples, follow the
[checkout installation guide](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/getting-started.md#use-the-current-checkout).

## Example

Save a named declaration as `src/intro.events.ts`:

```ts
import { commonEvent, showText } from "rpgmaker-event-dsl";

export const intro = commonEvent({
  id: 1,
  name: "Introduction",
  trigger: "none",
  commands: [
    showText({
      lines: ["Welcome."],
      face: { image: null, index: 0 },
      background: "window",
      position: "bottom",
    }),
  ],
});
```

This defines Common Event 1, which runs when called. Use an unused ID when adding
it to imported declarations. Shared modules and restricted author functions are
explained in the [authoring guide](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/authoring.md).

## Workflow

Initialize against an existing MV project and capture its data:

```powershell
npx rpgmaker-event-dsl init --project-root ../Game
npx rpgmaker-event-dsl clone
```

For a game with existing event data, run `npx rpgmaker-event-dsl decompile` before
adding source, then edit the imported declarations under `src/decompiled/`.
After editing, run:

```powershell
npx rpgmaker-event-dsl compile --check
npx rpgmaker-event-dsl compile
npx rpgmaker-event-dsl diff
```

Review Diff, then run `npx rpgmaker-event-dsl push` to apply it. Only Push writes to
the game project. Source owns complete data domains, so omitted declarations can
request removals or Troop Event Resets. Pull refreshes the Snapshot after editor
changes; reconcile source and Compile again before reviewing a new Diff.

## Documentation and API

- [Documentation index](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/README.md)
- [CLI and configuration](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/reference/cli.md)
- [Events and references](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/reference/events.md)
- [Event command reference](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/reference/commands/README.md)
- [Assets and validation](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/reference/assets.md)
- [Workflow and recovery](https://github.com/zyz23333/rpgmaker-event-dsl/blob/HEAD/docs/workflow.md)

Import authoring helpers and domain types from `rpgmaker-event-dsl`. Programmatic
Workspace operations are available from `rpgmaker-event-dsl/workspace`; consult the
installed TypeScript declarations for their options and return types.

## License

MIT. See the package's LICENSE file.
